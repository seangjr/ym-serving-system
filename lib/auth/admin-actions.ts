"use server";

import { revalidatePath } from "next/cache";
import type { AppRole } from "@/lib/auth/roles";
import { getUserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserWithRole {
  id: string; // member.id
  authUserId: string;
  fullName: string;
  email: string;
  roles: string[]; // all role names from assignments
  highestServingRole: AppRole;
}

// ---------------------------------------------------------------------------
// Role name → AppRole mapping
// ---------------------------------------------------------------------------

function deriveHighestServingRole(roleNames: string[]): AppRole {
  const lower = roleNames.map((r) => r.toLowerCase());
  if (lower.includes("admin")) return "admin";
  if (lower.includes("committee")) return "committee";
  return "member";
}

// ---------------------------------------------------------------------------
// Role sort order
// ---------------------------------------------------------------------------

const ROLE_SORT_ORDER: Record<AppRole, number> = {
  admin: 0,
  committee: 1,
  member: 2,
};

// ---------------------------------------------------------------------------
// getUsers — fetch all members with auth accounts + their roles
// ---------------------------------------------------------------------------

export async function getUsers(): Promise<
  { users: UserWithRole[] } | { error: string }
> {
  try {
    // Verify calling user is admin
    const supabase = await createClient();
    const { role } = await getUserRole(supabase);
    if (role !== "admin") {
      return { error: "Unauthorized. Admin access required." };
    }

    const admin = createAdminClient();

    // Get all members who have an auth_user_id (i.e., they have an account)
    const { data: members, error: membersError } = await admin
      .from("members")
      .select("id, auth_user_id, full_name, email")
      .not("auth_user_id", "is", null);

    if (membersError) {
      return { error: `Failed to fetch members: ${membersError.message}` };
    }

    if (!members || members.length === 0) {
      return { users: [] };
    }

    // Get all assignments with role names for these members
    const memberIds = members.map((m) => m.id);
    const { data: assignments, error: assignmentsError } = await admin
      .from("assignments")
      .select("member_id, roles(name)")
      .in("member_id", memberIds);

    if (assignmentsError) {
      return {
        error: `Failed to fetch assignments: ${assignmentsError.message}`,
      };
    }

    // Build a map of member_id → role names
    const memberRolesMap = new Map<string, string[]>();
    for (const assignment of assignments ?? []) {
      const raw = assignment as Record<string, unknown>;
      const rolesData = raw.roles as { name: string } | null;
      const roleName = rolesData?.name;
      if (!roleName) continue;
      const memberId = raw.member_id as string;
      const existing = memberRolesMap.get(memberId) ?? [];
      existing.push(roleName);
      memberRolesMap.set(memberId, existing);
    }

    // Map to UserWithRole
    const users: UserWithRole[] = members.map((member) => {
      const roles = memberRolesMap.get(member.id) ?? [];
      return {
        id: member.id,
        authUserId: member.auth_user_id,
        fullName: member.full_name ?? "",
        email: member.email ?? "",
        roles,
        highestServingRole: deriveHighestServingRole(roles),
      };
    });

    // Sort: admins first, then committee, then members; alphabetically within
    users.sort((a, b) => {
      const orderDiff =
        ROLE_SORT_ORDER[a.highestServingRole] -
        ROLE_SORT_ORDER[b.highestServingRole];
      if (orderDiff !== 0) return orderDiff;
      return a.fullName.localeCompare(b.fullName);
    });

    return { users };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

// ---------------------------------------------------------------------------
// updateUserRole — change a member's serving-relevant role
// ---------------------------------------------------------------------------

export async function updateUserRole(
  memberId: string,
  newRole: AppRole,
): Promise<{ success: true } | { error: string }> {
  try {
    // Verify calling user is admin
    const supabase = await createClient();
    const { role } = await getUserRole(supabase);
    if (role !== "admin") {
      return { error: "Unauthorized. Admin access required." };
    }

    const admin = createAdminClient();

    // Look up the role IDs for Admin and Committee
    const { data: roleDefs, error: roleDefsError } = await admin
      .from("roles")
      .select("id, name")
      .in("name", ["Admin", "Committee"]);

    if (roleDefsError) {
      return {
        error: `Failed to fetch role definitions: ${roleDefsError.message}`,
      };
    }

    const adminRoleId = roleDefs?.find(
      (r) => r.name.toLowerCase() === "admin",
    )?.id;
    const committeeRoleId = roleDefs?.find(
      (r) => r.name.toLowerCase() === "committee",
    )?.id;

    if (!adminRoleId || !committeeRoleId) {
      return { error: "Admin or Committee role not found in roles table." };
    }

    // Remove any existing Admin or Committee assignments for this member
    // (don't touch other roles like Zone Leader, CG Leader)
    const { error: deleteError } = await admin
      .from("assignments")
      .delete()
      .eq("member_id", memberId)
      .in("role_id", [adminRoleId, committeeRoleId]);

    if (deleteError) {
      return {
        error: `Failed to remove existing roles: ${deleteError.message}`,
      };
    }

    // Insert the new role assignment if not 'member' (member = no serving role)
    if (newRole === "admin") {
      const { error: insertError } = await admin.from("assignments").insert({
        member_id: memberId,
        role_id: adminRoleId,
        scope_type: "church",
      });
      if (insertError) {
        return { error: `Failed to assign admin role: ${insertError.message}` };
      }
    } else if (newRole === "committee") {
      const { error: insertError } = await admin.from("assignments").insert({
        member_id: memberId,
        role_id: committeeRoleId,
        scope_type: "serving",
      });
      if (insertError) {
        return {
          error: `Failed to assign committee role: ${insertError.message}`,
        };
      }
    }
    // If newRole === 'member', we just removed Admin/Committee above — done

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}
