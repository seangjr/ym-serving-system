import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Role types — based on role names in the existing `roles` table
// ---------------------------------------------------------------------------

export type AppRole = "admin" | "committee" | "member";

// Role hierarchy: higher index = higher privilege
const ROLE_HIERARCHY: AppRole[] = ["member", "committee", "admin"];

// ---------------------------------------------------------------------------
// DB-based role resolution
// ---------------------------------------------------------------------------

/**
 * Get the user's highest role by querying the database.
 *
 * Uses the existing `members` → `assignments` → `roles` tables from ym-attend-4.
 * Returns `'member'` as the safe default when no session, no member record, or
 * no assignments are found.
 */
export async function getUserRole(
  supabase: SupabaseClient,
): Promise<{ role: AppRole; memberId: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { role: "member", memberId: null };

  // Find member by auth_user_id
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!member) return { role: "member", memberId: null };

  // Get all role assignments for this member
  const { data: assignments } = await supabase
    .from("assignments")
    .select("roles(name)")
    .eq("member_id", member.id);

  if (!assignments || assignments.length === 0)
    return { role: "member", memberId: member.id };

  // Determine highest role (admin > committee > member)
  const roleNames = assignments
    .map((a: Record<string, unknown>) => {
      const roles = a.roles as { name: string } | null;
      return roles?.name;
    })
    .filter(Boolean) as string[];

  if (roleNames.some((r: string) => r.toLowerCase() === "admin"))
    return { role: "admin", memberId: member.id };
  if (roleNames.some((r: string) => r.toLowerCase() === "committee"))
    return { role: "committee", memberId: member.id };
  return { role: "member", memberId: member.id };
}

// ---------------------------------------------------------------------------
// Role comparison helpers
// ---------------------------------------------------------------------------

/** Check if `userRole` is at least as high as `requiredRole` in the hierarchy. */
export function hasRoleOrHigher(
  userRole: AppRole,
  requiredRole: AppRole,
): boolean {
  return (
    ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole)
  );
}

export function isAdmin(role: AppRole): boolean {
  return role === "admin";
}

export function isCommittee(role: AppRole): boolean {
  return role === "committee";
}

export function isAdminOrCommittee(role: AppRole): boolean {
  return role === "admin" || role === "committee";
}

// ---------------------------------------------------------------------------
// Navigation items per role (for sidebar)
// ---------------------------------------------------------------------------

export interface NavItem {
  title: string;
  href: string;
  icon: string; // Lucide icon name
}

/** Admin and Committee see 9 navigation items. */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: "Services", href: "/dashboard", icon: "Calendar" },
  { title: "Teams", href: "/teams", icon: "Layers" },
  { title: "Team Roster", href: "/team-roster", icon: "Users" },
  { title: "Availability", href: "/availability", icon: "CalendarOff" },
  { title: "Songs", href: "/songs", icon: "Music" },
  { title: "Announcements", href: "/announcements", icon: "Megaphone" },
  { title: "Equipment", href: "/equipment", icon: "Wrench" },
  { title: "Reports", href: "/reports", icon: "BarChart3" },
  { title: "Files", href: "/files", icon: "FolderOpen" },
];

/** Members see 5 navigation items. */
export const MEMBER_NAV_ITEMS: NavItem[] = [
  { title: "My Schedule", href: "/my-schedule", icon: "CalendarCheck" },
  { title: "Availability", href: "/availability", icon: "CalendarOff" },
  { title: "Songs", href: "/songs", icon: "Music" },
  { title: "Announcements", href: "/announcements", icon: "Megaphone" },
  { title: "Files", href: "/files", icon: "FolderOpen" },
];

/** Return the appropriate navigation items based on the user's role. */
export function getNavItems(role: AppRole): NavItem[] {
  if (role === "admin")
    return [
      ...ADMIN_NAV_ITEMS,
      { title: "Admin", href: "/admin", icon: "Shield" },
    ];
  if (role === "committee") return ADMIN_NAV_ITEMS;
  return MEMBER_NAV_ITEMS;
}

/** Return the default landing route based on the user's role. */
export function getDefaultRoute(role: AppRole): string {
  return role === "member" ? "/my-schedule" : "/dashboard";
}
