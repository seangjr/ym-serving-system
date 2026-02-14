"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMemberConflicts, getTemplates } from "./queries";
import {
  addServicePositionSchema,
  assignMemberSchema,
  deleteTemplateSchema,
  loadTemplateSchema,
  reorderPositionsSchema,
  removeServicePositionSchema,
  saveTemplateSchema,
  unassignMemberSchema,
  updateAssignmentNoteSchema,
} from "./schemas";
import type { ConflictInfo } from "./types";

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------

/**
 * Check if the caller is authorized to manage assignments for a given team.
 * Admin/committee always allowed; team leads allowed for their own team.
 */
async function canManageTeamAssignments(
  role: string,
  memberId: string | null,
  teamId: string,
): Promise<boolean> {
  if (isAdminOrCommittee(role as "admin" | "committee" | "member")) return true;
  if (!memberId) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("member_id", memberId)
    .single();

  return data?.role === "lead";
}

// ---------------------------------------------------------------------------
// Assignment CRUD
// ---------------------------------------------------------------------------

export async function assignMember(
  data: unknown,
): Promise<{ success: true } | { error: string } | { conflict: ConflictInfo }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = assignMemberSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid assignment data.",
    };
  }

  // Get the team for this service position to check authorization
  const admin = createAdminClient();
  const { data: sp } = await admin
    .from("service_positions")
    .select("team_id")
    .eq("id", parsed.data.servicePositionId)
    .single();

  if (!sp) return { error: "Position slot not found." };

  if (!(await canManageTeamAssignments(role, callerId, sp.team_id))) {
    return {
      error: "Unauthorized. Admin, Committee, or team lead access required.",
    };
  }

  // Check for conflicts before assigning
  const conflicts = await getMemberConflicts(
    parsed.data.memberId,
    parsed.data.serviceId,
  );

  if (conflicts.length > 0 && !parsed.data.forceAssign) {
    return { conflict: conflicts[0] };
  }

  // Remove any existing assignment for this position slot first (handles
  // re-assignment and stale rows from previous UI failures)
  await admin
    .from("service_assignments")
    .delete()
    .eq("service_position_id", parsed.data.servicePositionId);

  const { error } = await admin.from("service_assignments").insert({
    service_position_id: parsed.data.servicePositionId,
    member_id: parsed.data.memberId,
    status: "pending",
    notes: parsed.data.notes || null,
    has_conflict: conflicts.length > 0,
    assigned_by: callerId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}

export async function unassignMember(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = unassignMemberSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  // Get the team for authorization
  const admin = createAdminClient();
  const { data: sp } = await admin
    .from("service_positions")
    .select("team_id")
    .eq("id", parsed.data.servicePositionId)
    .single();

  if (!sp) return { error: "Position slot not found." };

  if (!(await canManageTeamAssignments(role, callerId, sp.team_id))) {
    return {
      error: "Unauthorized. Admin, Committee, or team lead access required.",
    };
  }

  const { error } = await admin
    .from("service_assignments")
    .delete()
    .eq("service_position_id", parsed.data.servicePositionId);

  if (error) return { error: error.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}

export async function updateAssignmentNote(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = updateAssignmentNoteSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  // Get assignment to find the team for authorization
  const admin = createAdminClient();
  const { data: assignment } = await admin
    .from("service_assignments")
    .select("service_positions(team_id)")
    .eq("id", parsed.data.assignmentId)
    .single();

  if (!assignment) return { error: "Assignment not found." };

  const teamId = (
    assignment.service_positions as unknown as { team_id: string }
  )?.team_id;

  if (!teamId) return { error: "Assignment team not found." };

  if (!(await canManageTeamAssignments(role, callerId, teamId))) {
    return {
      error: "Unauthorized. Admin, Committee, or team lead access required.",
    };
  }

  const { error } = await admin
    .from("service_assignments")
    .update({ notes: parsed.data.notes || null })
    .eq("id", parsed.data.assignmentId);

  if (error) return { error: error.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Position management
// ---------------------------------------------------------------------------

export async function addServicePosition(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = addServicePositionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  if (!(await canManageTeamAssignments(role, callerId, parsed.data.teamId))) {
    return {
      error: "Unauthorized. Admin, Committee, or team lead access required.",
    };
  }

  const admin = createAdminClient();

  // Compute next sort_order
  const { data: existing } = await admin
    .from("service_positions")
    .select("sort_order")
    .eq("service_id", parsed.data.serviceId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder =
    existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await admin.from("service_positions").insert({
    service_id: parsed.data.serviceId,
    team_id: parsed.data.teamId,
    position_id: parsed.data.positionId,
    sort_order: nextSortOrder,
  });

  if (error) return { error: error.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}

export async function removeServicePosition(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = removeServicePositionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  // Get the team for authorization
  const admin = createAdminClient();
  const { data: sp } = await admin
    .from("service_positions")
    .select("team_id")
    .eq("id", parsed.data.servicePositionId)
    .single();

  if (!sp) return { error: "Position slot not found." };

  if (!(await canManageTeamAssignments(role, callerId, sp.team_id))) {
    return {
      error: "Unauthorized. Admin, Committee, or team lead access required.",
    };
  }

  // CASCADE will delete any assignment on this slot
  const { error } = await admin
    .from("service_positions")
    .delete()
    .eq("id", parsed.data.servicePositionId);

  if (error) return { error: error.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Position reordering
// ---------------------------------------------------------------------------

export async function reorderPositions(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = reorderPositionsSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  // Check that caller can manage at least one position (admin/committee always can)
  if (!isAdminOrCommittee(role as "admin" | "committee" | "member")) {
    // For non-admin, verify team lead access
    if (!callerId) return { error: "Unauthorized." };
  }

  const admin = createAdminClient();

  // Update sort_order for each position in the new order
  const updates = parsed.data.positionIds.map((id, index) =>
    admin
      .from("service_positions")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("service_id", parsed.data.serviceId),
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Template management
// ---------------------------------------------------------------------------

export async function saveTemplate(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = saveTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid template data.",
    };
  }

  const admin = createAdminClient();

  // Get the service's type
  const { data: service } = await admin
    .from("services")
    .select("service_type_id")
    .eq("id", parsed.data.serviceId)
    .single();

  // Fetch ALL service_positions for this service (across all teams)
  const { data: positions, error: posError } = await admin
    .from("service_positions")
    .select(
      `
      id,
      team_id,
      position_id,
      sort_order,
      team_positions(name, category),
      serving_teams(name)
    `,
    )
    .eq("service_id", parsed.data.serviceId)
    .order("sort_order");

  if (posError) return { error: posError.message };

  // Build positions JSON snapshot (positions only, no member assignments)
  const positionsJson = (positions ?? []).map((pos) => {
    const tp = pos.team_positions as unknown as {
      name: string;
      category: string | null;
    } | null;
    const team = pos.serving_teams as unknown as { name: string } | null;

    return {
      teamId: pos.team_id,
      teamName: team?.name ?? "Unknown",
      positionId: pos.position_id,
      positionName: tp?.name ?? "Unknown",
      category: tp?.category ?? null,
      sortOrder: pos.sort_order,
    };
  });

  const { error } = await admin.from("schedule_templates").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    service_type_id: service?.service_type_id ?? null,
    positions: positionsJson,
    created_by: callerId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}

export async function loadTemplate(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);

  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = loadTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const admin = createAdminClient();

  // Fetch template
  const { data: template, error: templateError } = await admin
    .from("schedule_templates")
    .select("positions")
    .eq("id", parsed.data.templateId)
    .single();

  if (templateError || !template) {
    return { error: "Template not found." };
  }

  const templatePositions = template.positions as {
    teamId: string;
    positionId: string;
    sortOrder: number;
  }[];

  // Delete ALL existing positions for this service (replace strategy)
  const { error: deleteError } = await admin
    .from("service_positions")
    .delete()
    .eq("service_id", parsed.data.serviceId);

  if (deleteError) return { error: deleteError.message };

  if (templatePositions.length === 0) {
    revalidatePath(`/services/${parsed.data.serviceId}`);
    return { success: true };
  }

  // Insert new positions from template
  const insertRows = templatePositions.map((pos) => ({
    service_id: parsed.data.serviceId,
    team_id: pos.teamId,
    position_id: pos.positionId,
    sort_order: pos.sortOrder,
  }));

  const { error: insertError } = await admin
    .from("service_positions")
    .insert(insertRows);

  if (insertError) return { error: insertError.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}

export async function deleteTemplate(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);

  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = deleteTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("schedule_templates")
    .delete()
    .eq("id", parsed.data.templateId);

  if (error) return { error: error.message };

  return { success: true };
}

// ---------------------------------------------------------------------------
// Template fetching (server action wrapper for client components)
// ---------------------------------------------------------------------------

export async function fetchTemplates(serviceTypeId?: string) {
  return getTemplates(serviceTypeId);
}
