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

  // Fetch service_positions for this service and team, with position details
  const { data: positions, error: posError } = await admin
    .from("service_positions")
    .select("position_id, team_positions(name, category)")
    .eq("service_id", parsed.data.serviceId)
    .eq("team_id", parsed.data.teamId);

  if (posError) return { error: posError.message };

  // Build positions JSON snapshot, grouped by position_id with counts
  const positionCounts = new Map<
    string,
    {
      positionId: string;
      positionName: string;
      category: string | null;
      count: number;
    }
  >();

  for (const pos of positions ?? []) {
    const tp = pos.team_positions as unknown as {
      name: string;
      category: string | null;
    } | null;
    const key = pos.position_id;
    const existing = positionCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      positionCounts.set(key, {
        positionId: pos.position_id,
        positionName: tp?.name ?? "Unknown",
        category: tp?.category ?? null,
        count: 1,
      });
    }
  }

  const positionsJson = Array.from(positionCounts.values());

  const { error } = await admin.from("schedule_templates").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    team_id: parsed.data.teamId,
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
    .select("team_id, positions")
    .eq("id", parsed.data.templateId)
    .single();

  if (templateError || !template) {
    return { error: "Template not found." };
  }

  const teamId = template.team_id;
  if (!teamId) return { error: "Template has no team association." };

  // Delete existing positions for this team on this service (replace strategy)
  const { error: deleteError } = await admin
    .from("service_positions")
    .delete()
    .eq("service_id", parsed.data.serviceId)
    .eq("team_id", teamId);

  if (deleteError) return { error: deleteError.message };

  // Insert new positions from template
  const templatePositions = template.positions as {
    positionId: string;
    positionName: string;
    category: string | null;
    count: number;
  }[];

  const insertRows: {
    service_id: string;
    team_id: string;
    position_id: string;
    sort_order: number;
  }[] = [];

  let sortOrder = 0;
  for (const pos of templatePositions) {
    for (let i = 0; i < pos.count; i++) {
      insertRows.push({
        service_id: parsed.data.serviceId,
        team_id: teamId,
        position_id: pos.positionId,
        sort_order: sortOrder++,
      });
    }
  }

  if (insertRows.length > 0) {
    const { error: insertError } = await admin
      .from("service_positions")
      .insert(insertRows);

    if (insertError) return { error: insertError.message };
  }

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

export async function fetchTemplates(teamId?: string) {
  return getTemplates(teamId);
}
