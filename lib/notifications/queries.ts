import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MyAssignment, Notification, SwapRequest } from "./types";

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
        serving_teams!inner(name, color)
      )
    `,
    )
    .eq("member_id", memberId)
    .gte("service_positions.services.service_date", today)
    .order("service_positions(services(service_date))", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
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
