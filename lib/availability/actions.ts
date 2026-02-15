"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  addBlackoutRangeSchema,
  addBlackoutSchema,
  createRecurringPatternSchema,
  deleteBlackoutSchema,
  deleteRecurringPatternSchema,
} from "./schemas";

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------

/**
 * Check if the caller can manage availability for a target member.
 * Admin/committee always allowed; team leads allowed for shared-team members.
 */
async function canManageForMember(
  role: string,
  callerId: string | null,
  targetMemberId: string,
): Promise<boolean> {
  // Self-management is always allowed
  if (callerId === targetMemberId) return true;

  // Admin/committee can manage anyone
  if (isAdminOrCommittee(role as "admin" | "committee" | "member")) return true;

  if (!callerId) return false;

  // Team lead: check if caller leads a team that the target member belongs to
  const admin = createAdminClient();
  const { data: leaderTeams } = await admin
    .from("team_members")
    .select("team_id")
    .eq("member_id", callerId)
    .eq("role", "lead");

  if (!leaderTeams || leaderTeams.length === 0) return false;

  const leaderTeamIds = leaderTeams.map((t) => t.team_id);

  const { data: sharedTeam } = await admin
    .from("team_members")
    .select("team_id")
    .eq("member_id", targetMemberId)
    .in("team_id", leaderTeamIds)
    .limit(1);

  return !!sharedTeam && sharedTeam.length > 0;
}

// ---------------------------------------------------------------------------
// Blackout date actions
// ---------------------------------------------------------------------------

export async function addBlackoutDate(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = addBlackoutSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const targetMemberId = parsed.data.memberId ?? callerId;
  if (!targetMemberId) return { error: "Not authenticated." };

  if (!(await canManageForMember(role, callerId, targetMemberId))) {
    return {
      error:
        "Unauthorized. Only team leads can set availability for their team members.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("member_blackout_dates").insert({
    member_id: targetMemberId,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate ?? parsed.data.startDate,
    reason: parsed.data.reason || null,
    created_by: callerId !== targetMemberId ? callerId : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/availability");
  return { success: true };
}

export async function addBlackoutRange(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = addBlackoutRangeSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const targetMemberId = parsed.data.memberId ?? callerId;
  if (!targetMemberId) return { error: "Not authenticated." };

  if (!(await canManageForMember(role, callerId, targetMemberId))) {
    return {
      error:
        "Unauthorized. Only team leads can set availability for their team members.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("member_blackout_dates").insert({
    member_id: targetMemberId,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    reason: parsed.data.reason || null,
    created_by: callerId !== targetMemberId ? callerId : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/availability");
  return { success: true };
}

export async function deleteBlackout(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = deleteBlackoutSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  // Fetch the blackout to check ownership
  const admin = createAdminClient();
  const { data: blackout, error: fetchError } = await admin
    .from("member_blackout_dates")
    .select("member_id")
    .eq("id", parsed.data.blackoutId)
    .single();

  if (fetchError || !blackout) return { error: "Blackout date not found." };

  if (!(await canManageForMember(role, callerId, blackout.member_id))) {
    return {
      error:
        "Unauthorized. Only the member or their team lead can delete this blackout date.",
    };
  }

  const { error } = await admin
    .from("member_blackout_dates")
    .delete()
    .eq("id", parsed.data.blackoutId);

  if (error) return { error: error.message };

  revalidatePath("/availability");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Recurring pattern actions
// ---------------------------------------------------------------------------

export async function createRecurringPattern(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = createRecurringPatternSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const targetMemberId = parsed.data.memberId ?? callerId;
  if (!targetMemberId) return { error: "Not authenticated." };

  if (!(await canManageForMember(role, callerId, targetMemberId))) {
    return {
      error:
        "Unauthorized. Only team leads can set availability for their team members.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("member_recurring_unavailability").insert({
    member_id: targetMemberId,
    frequency: parsed.data.frequency,
    day_of_week: parsed.data.dayOfWeek,
    nth_occurrence: parsed.data.nthOccurrence ?? null,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate ?? null,
    reason: parsed.data.reason || null,
    created_by: callerId !== targetMemberId ? callerId : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/availability");
  return { success: true };
}

export async function deleteRecurringPattern(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = deleteRecurringPatternSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  // Fetch the pattern to check ownership
  const admin = createAdminClient();
  const { data: pattern, error: fetchError } = await admin
    .from("member_recurring_unavailability")
    .select("member_id")
    .eq("id", parsed.data.patternId)
    .single();

  if (fetchError || !pattern) return { error: "Recurring pattern not found." };

  if (!(await canManageForMember(role, callerId, pattern.member_id))) {
    return {
      error:
        "Unauthorized. Only the member or their team lead can delete this pattern.",
    };
  }

  const { error } = await admin
    .from("member_recurring_unavailability")
    .delete()
    .eq("id", parsed.data.patternId);

  if (error) return { error: error.message };

  revalidatePath("/availability");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Team availability fetch wrapper (for client components)
// ---------------------------------------------------------------------------

export async function fetchTeamAvailability(
  teamId: string,
  monthStart: string,
  monthEnd: string,
) {
  const { getTeamAvailability } = await import("./queries");
  return getTeamAvailability(teamId, monthStart, monthEnd);
}
