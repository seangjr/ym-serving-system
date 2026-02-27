import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  IncomingSwapRequest,
  MyAssignment,
  Notification,
  SwapRequest,
} from "./types";

// ---------------------------------------------------------------------------
// Notification queries (RLS-protected client)
// ---------------------------------------------------------------------------

/**
 * Fetch notifications for the current user.
 * Ordered by created_at DESC. Default limit 20.
 */
export async function getNotifications(
  limit = 20,
): Promise<Notification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    recipientMemberId: row.recipient_member_id,
    type: row.type,
    title: row.title,
    body: row.body,
    metadata: row.metadata ?? {},
    actionUrl: row.action_url,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

/**
 * Count unread notifications for the current user.
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw error;

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// My Schedule query
// ---------------------------------------------------------------------------

/**
 * Fetch upcoming assignments for the logged-in member.
 * Powers the My Schedule page.
 *
 * Filter: service_date >= today
 * Order: service_date ASC, start_time ASC
 */
export async function getMyAssignments(): Promise<MyAssignment[]> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return [];

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("service_assignments")
    .select(
      `
      id,
      member_id,
      status,
      notes,
      service_positions!inner(
        service_id,
        services!inner(id, title, service_date, start_time, end_time),
        team_positions(name),
        serving_teams!service_positions_team_id_fkey(name, color)
      )
    `,
    )
    .eq("member_id", memberId)
    .gte("service_positions.services.service_date", today);

  if (error) throw error;

  // Sort in JS — PostgREST doesn't support deeply nested ordering
  const sorted = (data ?? []).sort((a, b) => {
    const spA = a.service_positions as unknown as {
      services: { service_date: string; start_time: string };
    };
    const spB = b.service_positions as unknown as {
      services: { service_date: string; start_time: string };
    };
    const dateCompare = spA.services.service_date.localeCompare(
      spB.services.service_date,
    );
    if (dateCompare !== 0) return dateCompare;
    return (spA.services.start_time ?? "").localeCompare(
      spB.services.start_time ?? "",
    );
  });

  return sorted.map((row) => {
    const sp = row.service_positions as unknown as {
      service_id: string;
      services: {
        id: string;
        title: string;
        service_date: string;
        start_time: string;
        end_time: string | null;
      };
      team_positions: { name: string } | null;
      serving_teams: { name: string; color: string | null };
    };

    return {
      id: row.id,
      memberId: row.member_id,
      serviceId: sp.services.id,
      serviceTitle: sp.services.title,
      serviceDate: sp.services.service_date,
      startTime: sp.services.start_time,
      endTime: sp.services.end_time,
      positionName: sp.team_positions?.name ?? "Unknown",
      teamName: sp.serving_teams.name,
      teamColor: sp.serving_teams.color,
      status: row.status as "pending" | "confirmed" | "declined",
      notes: row.notes,
    };
  });
}

// ---------------------------------------------------------------------------
// Swap request queries
// ---------------------------------------------------------------------------

/**
 * Get swap requests for a specific assignment.
 */
export async function getSwapRequestsForAssignment(
  assignmentId: string,
): Promise<SwapRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("swap_requests")
    .select(
      `
      id,
      assignment_id,
      requester_member_id,
      target_member_id,
      status,
      reason,
      resolved_by,
      resolved_at,
      created_at,
      updated_at,
      requester:members!requester_member_id(full_name),
      target:members!target_member_id(full_name)
    `,
    )
    .eq("assignment_id", assignmentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    assignmentId: row.assignment_id,
    requesterMemberId: row.requester_member_id,
    requesterName:
      (row.requester as unknown as { full_name: string } | null)?.full_name ??
      "Unknown",
    targetMemberId: row.target_member_id,
    targetName:
      (row.target as unknown as { full_name: string } | null)?.full_name ??
      "Unknown",
    status: row.status,
    reason: row.reason,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get pending swap requests that a team lead needs to approve.
 * Returns swaps where the given member is a lead for the assignment's team.
 */
export async function getPendingSwapsForTeamLead(
  memberId: string,
): Promise<SwapRequest[]> {
  const admin = createAdminClient();

  // Find teams where this member is a lead
  const { data: leadTeams } = await admin
    .from("team_members")
    .select("team_id")
    .eq("member_id", memberId)
    .eq("role", "lead");

  if (!leadTeams || leadTeams.length === 0) return [];

  const teamIds = leadTeams.map((t) => t.team_id);

  // Find pending swap requests for assignments in those teams
  const { data, error } = await admin
    .from("swap_requests")
    .select(
      `
      id,
      assignment_id,
      requester_member_id,
      target_member_id,
      status,
      reason,
      resolved_by,
      resolved_at,
      created_at,
      updated_at,
      requester:members!requester_member_id(full_name),
      target:members!target_member_id(full_name),
      service_assignments!inner(
        service_positions!inner(team_id)
      )
    `,
    )
    .eq("status", "pending")
    .in("service_assignments.service_positions.team_id", teamIds);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    assignmentId: row.assignment_id,
    requesterMemberId: row.requester_member_id,
    requesterName:
      (row.requester as unknown as { full_name: string } | null)?.full_name ??
      "Unknown",
    targetMemberId: row.target_member_id,
    targetName:
      (row.target as unknown as { full_name: string } | null)?.full_name ??
      "Unknown",
    status: row.status,
    reason: row.reason,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// ---------------------------------------------------------------------------
// Service-level swap queries (for service detail page)
// ---------------------------------------------------------------------------

/**
 * Extended swap request with position and service context for display.
 */
export interface SwapRequestWithContext extends SwapRequest {
  positionName: string;
  serviceTitle: string;
  serviceId: string;
}

/**
 * Get all swap requests for a specific service.
 * Used on the service detail page for team lead approval view.
 */
export async function getSwapRequestsForService(
  serviceId: string,
): Promise<SwapRequestWithContext[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("swap_requests")
    .select(
      `
      id,
      assignment_id,
      requester_member_id,
      target_member_id,
      status,
      reason,
      resolved_by,
      resolved_at,
      created_at,
      updated_at,
      requester:members!requester_member_id(full_name),
      target:members!target_member_id(full_name),
      service_assignments!inner(
        service_positions!inner(
          services!inner(id, title),
          team_positions(name)
        )
      )
    `,
    )
    .eq(
      "service_assignments.service_positions.services.id",
      serviceId,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const sa = row.service_assignments as unknown as {
      service_positions: {
        services: { id: string; title: string };
        team_positions: { name: string } | null;
      };
    };

    return {
      id: row.id,
      assignmentId: row.assignment_id,
      requesterMemberId: row.requester_member_id,
      requesterName:
        (row.requester as unknown as { full_name: string } | null)
          ?.full_name ?? "Unknown",
      targetMemberId: row.target_member_id,
      targetName:
        (row.target as unknown as { full_name: string } | null)?.full_name ??
        "Unknown",
      status: row.status,
      reason: row.reason,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      positionName: sa.service_positions.team_positions?.name ?? "Unknown",
      serviceTitle: sa.service_positions.services.title,
      serviceId: sa.service_positions.services.id,
    };
  });
}

/**
 * Get the active (pending) swap request for an assignment, if any.
 * Used to show "Swap Pending" state on assignment card.
 */
export async function getActiveSwapForAssignment(
  assignmentId: string,
): Promise<SwapRequest | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("swap_requests")
    .select(
      `
      id,
      assignment_id,
      requester_member_id,
      target_member_id,
      status,
      reason,
      resolved_by,
      resolved_at,
      created_at,
      updated_at,
      requester:members!requester_member_id(full_name),
      target:members!target_member_id(full_name)
    `,
    )
    .eq("assignment_id", assignmentId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    assignmentId: data.assignment_id,
    requesterMemberId: data.requester_member_id,
    requesterName:
      (data.requester as unknown as { full_name: string } | null)
        ?.full_name ?? "Unknown",
    targetMemberId: data.target_member_id,
    targetName:
      (data.target as unknown as { full_name: string } | null)?.full_name ??
      "Unknown",
    status: data.status,
    reason: data.reason,
    resolvedBy: data.resolved_by,
    resolvedAt: data.resolved_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Fetch pending swap requests where the current user is the target.
 * Shown on the My Schedule page so the target member is aware of incoming swaps.
 */
export async function getIncomingSwapRequests(): Promise<IncomingSwapRequest[]> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return [];

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("swap_requests")
    .select(
      `
      id,
      reason,
      created_at,
      requester:members!requester_member_id(full_name),
      service_assignments!inner(
        service_positions!inner(
          services!inner(title, service_date, start_time),
          team_positions(name),
          serving_teams!service_positions_team_id_fkey(name)
        )
      )
    `,
    )
    .eq("target_member_id", memberId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const sa = row.service_assignments as unknown as {
      service_positions: {
        services: { title: string; service_date: string; start_time: string };
        team_positions: { name: string } | null;
        serving_teams: { name: string };
      };
    };

    return {
      id: row.id,
      requesterName:
        (row.requester as unknown as { full_name: string } | null)
          ?.full_name ?? "Unknown",
      positionName: sa.service_positions.team_positions?.name ?? "Unknown",
      teamName: sa.service_positions.serving_teams.name,
      serviceTitle: sa.service_positions.services.title,
      serviceDate: sa.service_positions.services.service_date,
      startTime: sa.service_positions.services.start_time,
      reason: row.reason,
      createdAt: row.created_at,
    };
  });
}

/**
 * Get team members eligible for swap — only those who have a skill for the
 * same position as the assignment (e.g., only Bassists can swap with Bassists).
 * Used to populate the swap partner dropdown.
 */
export async function getTeamMembersForSwap(
  assignmentId: string,
  currentMemberId: string,
): Promise<{ id: string; fullName: string }[]> {
  const admin = createAdminClient();

  // Find the team_id and position_id for this assignment
  const { data: assignment } = await admin
    .from("service_assignments")
    .select(
      `
      service_positions!inner(
        team_id,
        position_id
      )
    `,
    )
    .eq("id", assignmentId)
    .single();

  if (!assignment) return [];

  const sp = assignment.service_positions as unknown as {
    team_id: string;
    position_id: string;
  };

  // Get members who: are on the same team, have a skill for this position, and are not the current member
  const { data: skillMembers, error } = await admin
    .from("member_position_skills")
    .select(
      `
      member_id,
      members!inner(id, full_name)
    `,
    )
    .eq("position_id", sp.position_id)
    .neq("member_id", currentMemberId);

  if (error) throw error;

  // Also verify they are on the same team
  const { data: teamMemberIds } = await admin
    .from("team_members")
    .select("member_id")
    .eq("team_id", sp.team_id);

  const teamSet = new Set((teamMemberIds ?? []).map((tm) => tm.member_id));

  return (skillMembers ?? [])
    .filter((sm) => teamSet.has(sm.member_id))
    .map((sm) => {
      const member = sm.members as unknown as {
        id: string;
        full_name: string;
      };
      return {
        id: member.id,
        fullName: member.full_name,
      };
    });
}
