import type { Session } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Role types — must match the SQL enum `public.app_role` exactly
// ---------------------------------------------------------------------------

export type AppRole = "admin" | "committee" | "member";

export const ROLES = {
  ADMIN: "admin" as const,
  COMMITTEE: "committee" as const,
  MEMBER: "member" as const,
};

// Role hierarchy: higher index = higher privilege
const ROLE_HIERARCHY: AppRole[] = ["member", "committee", "admin"];

// ---------------------------------------------------------------------------
// JWT role extraction
// ---------------------------------------------------------------------------

interface JwtWithRole {
  user_role?: AppRole;
}

/**
 * Extract the user's role from a Supabase session JWT.
 *
 * The custom access token hook embeds `user_role` in JWT claims.
 * We decode the JWT payload manually (split + atob) to avoid adding
 * a `jwt-decode` dependency — the JWT is already verified by Supabase.
 *
 * Returns `'member'` if no session or no role claim is found.
 */
export function getUserRole(session: Session | null): AppRole {
  if (!session) return "member";

  try {
    const payload = session.access_token.split(".")[1];
    if (!payload) return "member";
    const claims = JSON.parse(atob(payload)) as JwtWithRole;
    return claims?.user_role ?? "member";
  } catch {
    return "member";
  }
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

/** Admin and Committee see 7 navigation items. */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: "Services", href: "/dashboard", icon: "Calendar" },
  { title: "Team Roster", href: "/team-roster", icon: "Users" },
  { title: "Songs", href: "/songs", icon: "Music" },
  { title: "Announcements", href: "/announcements", icon: "Megaphone" },
  { title: "Equipment", href: "/equipment", icon: "Wrench" },
  { title: "Reports", href: "/reports", icon: "BarChart3" },
  { title: "Files", href: "/files", icon: "FolderOpen" },
];

/** Members see 4 navigation items. */
export const MEMBER_NAV_ITEMS: NavItem[] = [
  { title: "My Schedule", href: "/my-schedule", icon: "CalendarCheck" },
  { title: "Songs", href: "/songs", icon: "Music" },
  { title: "Announcements", href: "/announcements", icon: "Megaphone" },
  { title: "Files", href: "/files", icon: "FolderOpen" },
];

/** Return the appropriate navigation items based on the user's role. */
export function getNavItems(role: AppRole): NavItem[] {
  return role === "member" ? MEMBER_NAV_ITEMS : ADMIN_NAV_ITEMS;
}

/** Return the default landing route based on the user's role. */
export function getDefaultRoute(role: AppRole): string {
  return role === "member" ? "/my-schedule" : "/dashboard";
}
