import { createClient } from "@/lib/supabase/server";
import { getUnavailableMembersForDate } from "@/lib/availability/queries";
import type { UnavailableMember } from "@/lib/availability/types";
import type {
  ConflictInfo,
  EligibleMember,
  ServicePositionWithAssignment,
  TeamAssignmentGroup,
  TeamForAssignment,
  TemplateDetail,
  TemplateListItem,
  TemplatePosition,
} from "./types";

// ---------------------------------------------------------------------------
// Helper: calculate end time from start_time + duration_minutes
// ---------------------------------------------------------------------------

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Queries (all use RLS-protected client)
// ---------------------------------------------------------------------------

/**
 * Get all service positions for a service with their assignments,
 * grouped by team then by category.
 *
 * This is the main data fetch for the assignment panel.
 */
export async function getServiceAssignments(
  serviceId: string,
): Promise<TeamAssignmentGroup[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_positions")
    .select(
      `
      id,
      service_id,
      team_id,
      position_id,
      sort_order,
      team_positions(name, category),
      serving_teams(name, color),
      service_assignments(
        id,
        member_id,
        status,
        notes,
        has_conflict,
        assigned_at,
        members!member_id(full_name)
      )
    `,
    )
    .eq("service_id", serviceId)
    .order("sort_order");

  if (error) throw error;

  // Build a map of team groups
  const teamMap = new Map<string, TeamAssignmentGroup>();

  for (const row of data ?? []) {
    const teamPosition = row.team_positions as unknown as {
      name: string;
      category: string | null;
    } | null;
    const team = row.serving_teams as unknown as {
      name: string;
      color: string | null;
    } | null;

    // service_assignments has UNIQUE on service_position_id — Supabase may
    // return a single object (one-to-one) or an array depending on detection.
    type AssignmentShape = {
      id: string;
      member_id: string;
      status: string;
      notes: string | null;
      has_conflict: boolean;
      assigned_at: string;
      members: { full_name: string } | null;
    };
    const raw = row.service_assignments as unknown;
    let assignmentRow: AssignmentShape | null = null;
    if (Array.isArray(raw)) {
      assignmentRow = (raw as AssignmentShape[])[0] ?? null;
    } else if (raw && typeof raw === "object") {
      assignmentRow = raw as AssignmentShape;
    }

    const position: ServicePositionWithAssignment = {
      id: row.id,
      serviceId: row.service_id,
      teamId: row.team_id,
      positionId: row.position_id,
      positionName: teamPosition?.name ?? "Unknown",
      category: teamPosition?.category ?? null,
      sortOrder: row.sort_order,
      assignment: assignmentRow
        ? {
            id: assignmentRow.id,
            memberId: assignmentRow.member_id,
            memberName: assignmentRow.members?.full_name ?? "Unknown",
            status: assignmentRow.status as
              | "pending"
              | "confirmed"
              | "declined",
            notes: assignmentRow.notes,
            hasConflict: assignmentRow.has_conflict,
            assignedAt: assignmentRow.assigned_at,
          }
        : null,
    };

    if (!teamMap.has(row.team_id)) {
      teamMap.set(row.team_id, {
        teamId: row.team_id,
        teamName: team?.name ?? "Unknown",
        teamColor: team?.color ?? null,
        categories: {},
      });
    }

    // biome-ignore lint/style/noNonNullAssertion: group guaranteed to exist (set above)
    const group = teamMap.get(row.team_id)!;
    const categoryKey = position.category ?? "General";
    if (!group.categories[categoryKey]) {
      group.categories[categoryKey] = [];
    }
    group.categories[categoryKey].push(position);
  }

  return Array.from(teamMap.values());
}

/**
 * Get eligible members for a team, with conflict info pre-computed.
 *
 * Fetches team members and checks for conflicting assignments on the same
 * service_date with overlapping times. Uses a single query for all same-date
 * assignments to avoid N+1 (per Pitfall 1 from RESEARCH.md).
 */
export async function getEligibleMembers(
  teamId: string,
  serviceId: string,
): Promise<EligibleMember[]> {
  const supabase = await createClient();

  // 1. Get target service details
  const { data: targetService, error: serviceError } = await supabase
    .from("services")
    .select("service_date, start_time, end_time, duration_minutes")
    .eq("id", serviceId)
    .single();

  if (serviceError) throw serviceError;
  if (!targetService) return [];

  const targetEndTime =
    targetService.end_time ??
    calculateEndTime(
      targetService.start_time,
      targetService.duration_minutes ?? 120,
    );

  // 2. Get all members on this team
  const { data: teamMembers, error: membersError } = await supabase
    .from("team_members")
    .select("member_id, members(id, full_name)")
    .eq("team_id", teamId);

  if (membersError) throw membersError;
  if (!teamMembers || teamMembers.length === 0) return [];

  const memberIds = teamMembers.map(
    (tm: Record<string, unknown>) => tm.member_id as string,
  );

  // 3. Fetch all same-date assignments for these members (single query)
  const { data: sameDateAssignments } = await supabase
    .from("service_assignments")
    .select(
      `
      id,
      member_id,
      status,
      service_positions!inner(
        service_id,
        services!inner(id, title, service_date, start_time, end_time, duration_minutes),
        team_positions(name)
      )
    `,
    )
    .in("member_id", memberIds)
    .neq("status", "declined")
    .eq("service_positions.services.service_date", targetService.service_date)
    .neq("service_positions.services.id", serviceId);

  // 4. Build conflict map: memberId -> ConflictInfo
  const conflictMap = new Map<
    string,
    { serviceName: string; serviceTime: string; positionName: string }
  >();

  for (const row of sameDateAssignments ?? []) {
    const sp = row.service_positions as unknown as {
      service_id: string;
      services: {
        id: string;
        title: string;
        service_date: string;
        start_time: string;
        end_time: string | null;
        duration_minutes: number | null;
      };
      team_positions: { name: string } | null;
    };

    const s = sp.services;
    const sEndTime =
      s.end_time ?? calculateEndTime(s.start_time, s.duration_minutes ?? 120);

    // Check overlap: service starts before target ends AND service ends after target starts
    if (s.start_time < targetEndTime && sEndTime > targetService.start_time) {
      conflictMap.set(row.member_id, {
        serviceName: s.title,
        serviceTime: s.start_time,
        positionName: sp.team_positions?.name ?? "Unknown",
      });
    }
  }

  // 4.5. Check availability for all team members on the service date
  const unavailableMap = await getUnavailableMembersForDate(
    memberIds,
    targetService.service_date,
  );

  // 5. Fetch position skills for these members
  const { data: positionSkills } = await supabase
    .from("member_position_skills")
    .select("member_id, position_id")
    .in("member_id", memberIds);

  const positionSkillMap = new Map<string, string[]>();
  for (const ps of positionSkills ?? []) {
    const existing = positionSkillMap.get(ps.member_id) ?? [];
    existing.push(ps.position_id);
    positionSkillMap.set(ps.member_id, existing);
  }

  // 6. Map to EligibleMember[]
  return teamMembers.map((tm: Record<string, unknown>) => {
    const memberId = tm.member_id as string;
    const members = tm.members as unknown as {
      id: string;
      full_name: string;
    } | null;
    const conflict = conflictMap.get(memberId);
    const unavailability = unavailableMap.get(memberId);
    return {
      id: memberId,
      fullName: members?.full_name ?? "Unknown",
      hasConflict: !!conflict,
      conflictDetails: conflict ?? null,
      isUnavailable: !!unavailability,
      unavailabilityReason: unavailability?.reason ?? null,
      positionIds: positionSkillMap.get(memberId) ?? [],
    };
  });
}

/**
 * Detailed conflict check for a specific member against a specific service.
 *
 * Used before assignment to get full conflict details for the confirmation dialog.
 * Handles null end_time by calculating from start_time + duration_minutes (default 120).
 */
export async function getMemberConflicts(
  memberId: string,
  serviceId: string,
): Promise<ConflictInfo[]> {
  const supabase = await createClient();

  // Get target service details
  const { data: targetService, error: serviceError } = await supabase
    .from("services")
    .select("service_date, start_time, end_time, duration_minutes")
    .eq("id", serviceId)
    .single();

  if (serviceError) throw serviceError;
  if (!targetService) return [];

  const targetEndTime =
    targetService.end_time ??
    calculateEndTime(
      targetService.start_time,
      targetService.duration_minutes ?? 120,
    );

  // Find overlapping assignments for this member on the same date
  const { data: conflicts } = await supabase
    .from("service_assignments")
    .select(
      `
      id,
      status,
      service_positions!inner(
        service_id,
        services!inner(id, title, service_date, start_time, end_time, duration_minutes),
        team_positions(name)
      )
    `,
    )
    .eq("member_id", memberId)
    .neq("status", "declined")
    .eq("service_positions.services.service_date", targetService.service_date)
    .neq("service_positions.services.id", serviceId);

  // Filter for actual time overlap in application code
  return (conflicts ?? [])
    .filter((c) => {
      const sp = c.service_positions as unknown as {
        services: {
          start_time: string;
          end_time: string | null;
          duration_minutes: number | null;
        };
      };
      const s = sp.services;
      const endTime =
        s.end_time ?? calculateEndTime(s.start_time, s.duration_minutes ?? 120);
      return s.start_time < targetEndTime && endTime > targetService.start_time;
    })
    .map((c) => {
      const sp = c.service_positions as unknown as {
        services: { title: string; start_time: string };
        team_positions: { name: string } | null;
      };
      return {
        assignmentId: c.id,
        serviceName: sp.services.title,
        serviceTime: sp.services.start_time,
        positionName: sp.team_positions?.name ?? "Unknown",
      };
    });
}

/**
 * Get all unavailable members for a specific service (by service date).
 *
 * Fetches all team member IDs across teams that have positions on this service,
 * then checks unavailability. Used for the availability banner on the service
 * detail page.
 */
export async function getUnavailableMembersForService(
  serviceId: string,
): Promise<UnavailableMember[]> {
  const supabase = await createClient();

  // 1. Get service date
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("service_date")
    .eq("id", serviceId)
    .single();

  if (serviceError || !service) return [];

  // 2. Get all team member IDs across teams with positions on this service
  const { data: servicePositions } = await supabase
    .from("service_positions")
    .select("team_id")
    .eq("service_id", serviceId);

  if (!servicePositions || servicePositions.length === 0) return [];

  const teamIds = [...new Set(servicePositions.map((sp) => sp.team_id))];

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("member_id, members(id, full_name)")
    .in("team_id", teamIds);

  if (!teamMembers || teamMembers.length === 0) return [];

  // Deduplicate members across teams
  const memberMap = new Map<string, string>();
  for (const tm of teamMembers) {
    const memberId = tm.member_id as string;
    if (!memberMap.has(memberId)) {
      const member = tm.members as unknown as {
        id: string;
        full_name: string;
      } | null;
      memberMap.set(memberId, member?.full_name ?? "Unknown");
    }
  }

  const memberIds = [...memberMap.keys()];

  // 3. Check unavailability
  const unavailableMap = await getUnavailableMembersForDate(
    memberIds,
    service.service_date,
  );

  // 4. Build result with member names
  const result: UnavailableMember[] = [];
  for (const [memberId, info] of unavailableMap) {
    result.push({
      memberId,
      memberName: memberMap.get(memberId) ?? "Unknown",
      reason: info.reason,
      type: info.type,
    });
  }

  return result;
}

/**
 * Get all active teams with their positions and members.
 * Used for the assignment page (position adder dropdown + eligible members).
 */
export async function getTeamsForAssignment(): Promise<TeamForAssignment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("serving_teams")
    .select(
      `
      id,
      name,
      color,
      team_positions(id, name, category),
      team_members(
        member_id,
        members(id, full_name)
      )
    `,
    )
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw error;

  return (data ?? []).map((team: Record<string, unknown>) => {
    const positions = (team.team_positions ?? []) as {
      id: string;
      name: string;
      category: string | null;
    }[];
    const teamMembers = (team.team_members ?? []) as {
      member_id: string;
      members: { id: string; full_name: string } | null;
    }[];
    return {
      id: team.id as string,
      name: team.name as string,
      color: team.color as string | null,
      positions,
      members: teamMembers.map((tm) => ({
        id: tm.member_id,
        fullName: tm.members?.full_name ?? "Unknown",
      })),
    };
  });
}

/**
 * List templates, optionally filtered by service type.
 */
export async function getTemplates(
  serviceTypeId?: string,
): Promise<TemplateListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("schedule_templates")
    .select(
      `
      id,
      name,
      description,
      service_type_id,
      positions,
      created_at,
      service_types(label)
    `,
    )
    .order("created_at", { ascending: false });

  if (serviceTypeId) {
    query = query.eq("service_type_id", serviceTypeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const serviceType = row.service_types as unknown as {
      label: string;
    } | null;
    const positions = row.positions as unknown[];
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | null,
      serviceTypeId: row.service_type_id as string | null,
      serviceTypeLabel: serviceType?.label ?? null,
      positionCount: Array.isArray(positions) ? positions.length : 0,
      createdAt: row.created_at as string,
    };
  });
}

/**
 * Get full template detail for loading.
 */
export async function getTemplateById(
  templateId: string,
): Promise<TemplateDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule_templates")
    .select("id, name, description, service_type_id, positions")
    .eq("id", templateId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    serviceTypeId: data.service_type_id,
    positions: (data.positions as TemplatePosition[]) ?? [],
  };
}
