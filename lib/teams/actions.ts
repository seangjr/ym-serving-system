"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdmin, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Preference, Proficiency } from "./schemas";
import {
  createPositionSchema,
  createTeamSchema,
  updatePositionSchema,
  updateTeamSchema,
} from "./schemas";

// ---------------------------------------------------------------------------
// Team CRUD
// ---------------------------------------------------------------------------

export async function createTeam(
  data: unknown,
): Promise<{ success: true; teamId: string } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = createTeamSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid team data." };
  }

  const admin = createAdminClient();
  const { data: team, error } = await admin
    .from("serving_teams")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      color: parsed.data.color ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/teams");
  return { success: true, teamId: team.id };
}

export async function updateTeam(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = updateTeamSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid team data." };
  }

  const { id, ...updates } = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin
    .from("serving_teams")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/teams");
  return { success: true };
}

export async function deleteTeam(
  teamId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdmin(role)) {
    return { error: "Unauthorized. Admin access required." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("serving_teams").delete().eq("id", teamId);

  if (error) return { error: error.message };

  revalidatePath("/teams");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Position CRUD
// ---------------------------------------------------------------------------

export async function createPosition(
  data: unknown,
): Promise<{ success: true; positionId: string } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = createPositionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid position data.",
    };
  }

  const admin = createAdminClient();
  const { data: position, error } = await admin
    .from("team_positions")
    .insert({
      team_id: parsed.data.teamId,
      name: parsed.data.name,
      category: parsed.data.category ?? null,
      quantity_needed: parsed.data.quantityNeeded,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/teams/${parsed.data.teamId}`);
  return { success: true, positionId: position.id };
}

export async function updatePosition(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = updatePositionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid position data.",
    };
  }

  const { id, ...fields } = parsed.data;

  // Map camelCase to snake_case for the DB columns
  const updates: Record<string, unknown> = {};
  if (fields.name !== undefined) updates.name = fields.name;
  if (fields.category !== undefined) updates.category = fields.category;
  if (fields.quantityNeeded !== undefined)
    updates.quantity_needed = fields.quantityNeeded;
  if (fields.sortOrder !== undefined) updates.sort_order = fields.sortOrder;
  if (fields.isActive !== undefined) updates.is_active = fields.isActive;

  const admin = createAdminClient();

  // Get the team_id for revalidation
  const { data: pos } = await admin
    .from("team_positions")
    .select("team_id")
    .eq("id", id)
    .single();

  const { error } = await admin
    .from("team_positions")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  if (pos?.team_id) {
    revalidatePath(`/teams/${pos.team_id}`);
  }
  return { success: true };
}

export async function deletePosition(
  positionId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const admin = createAdminClient();

  // Get the team_id for revalidation before deleting
  const { data: pos } = await admin
    .from("team_positions")
    .select("team_id")
    .eq("id", positionId)
    .single();

  const { error } = await admin
    .from("team_positions")
    .delete()
    .eq("id", positionId);

  if (error) return { error: error.message };

  if (pos?.team_id) {
    revalidatePath(`/teams/${pos.team_id}`);
  }
  return { success: true };
}

// ---------------------------------------------------------------------------
// Team membership
// ---------------------------------------------------------------------------

export async function addMemberToTeam(
  teamId: string,
  memberId: string,
  memberRole: "lead" | "member" = "member",
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role: userRole, memberId: callerMemberId } =
    await getUserRole(supabase);

  // Admin/committee can add to any team; team lead can add to their team
  if (!isAdminOrCommittee(userRole)) {
    const admin = createAdminClient();
    const { data: callerMembership } = await admin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("member_id", callerMemberId)
      .single();

    if (callerMembership?.role !== "lead") {
      return { error: "Unauthorized" };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("team_members").upsert(
    {
      team_id: teamId,
      member_id: memberId,
      role: memberRole,
    },
    { onConflict: "team_id,member_id" },
  );

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function removeMemberFromTeam(
  teamId: string,
  memberId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role: userRole, memberId: callerMemberId } =
    await getUserRole(supabase);

  // Admin/committee can remove from any team; team lead can remove from their team
  if (!isAdminOrCommittee(userRole)) {
    const admin = createAdminClient();
    const { data: callerMembership } = await admin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("member_id", callerMemberId)
      .single();

    if (callerMembership?.role !== "lead") {
      return { error: "Unauthorized" };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("member_id", memberId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function updateMemberTeamRole(
  teamId: string,
  memberId: string,
  newRole: "lead" | "member",
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role: userRole } = await getUserRole(supabase);

  // Only admin/committee can change team roles (not team leads)
  if (!isAdminOrCommittee(userRole)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members")
    .update({ role: newRole })
    .eq("team_id", teamId)
    .eq("member_id", memberId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Member position skills
// ---------------------------------------------------------------------------

export async function updateMemberPositionSkill(
  memberId: string,
  positionId: string,
  proficiency: Proficiency,
  preference: Preference,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role: userRole, memberId: callerMemberId } =
    await getUserRole(supabase);

  // Admin/committee can update any; team lead can update for their team
  if (!isAdminOrCommittee(userRole)) {
    const admin = createAdminClient();
    // Find which team this position belongs to
    const { data: pos } = await admin
      .from("team_positions")
      .select("team_id")
      .eq("id", positionId)
      .single();

    if (!pos) return { error: "Position not found" };

    const { data: callerMembership } = await admin
      .from("team_members")
      .select("role")
      .eq("team_id", pos.team_id)
      .eq("member_id", callerMemberId)
      .single();

    if (callerMembership?.role !== "lead") {
      return { error: "Unauthorized" };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("member_position_skills").upsert(
    {
      member_id: memberId,
      position_id: positionId,
      proficiency,
      preference,
    },
    { onConflict: "member_id,position_id" },
  );

  if (error) return { error: error.message };

  // Find position's team for revalidation
  const { data: pos } = await admin
    .from("team_positions")
    .select("team_id")
    .eq("id", positionId)
    .single();

  if (pos?.team_id) {
    revalidatePath(`/teams/${pos.team_id}`);
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Fetch helpers (server actions callable from client components)
// ---------------------------------------------------------------------------

export async function fetchAllMembers(): Promise<
  { id: string; full_name: string; email: string }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select("id, full_name, email")
    .not("auth_user_id", "is", null)
    .order("full_name");

  if (error) return [];
  return data ?? [];
}
