import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  team_positions: { count: number }[];
  team_members: { count: number }[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  member_id: string;
  role: "lead" | "member";
  joined_at: string;
  members: {
    id: string;
    full_name: string;
    email: string;
  };
  member_profiles: {
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

export interface TeamWithMembers {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  team_positions: {
    id: string;
    name: string;
    category: string | null;
    quantity_needed: number;
    sort_order: number;
    is_active: boolean;
  }[];
  team_members: {
    id: string;
    member_id: string;
    role: "lead" | "member";
    joined_at: string;
    members: {
      id: string;
      full_name: string;
      email: string;
    };
  }[];
}

export interface TeamListItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  memberCount: number;
  leadName: string | null;
}

export interface MemberOption {
  id: string;
  full_name: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Queries (all use RLS-protected client)
// ---------------------------------------------------------------------------

/**
 * Get all active teams with position and member counts.
 * Used for team listing/overview pages.
 */
export async function getTeams(): Promise<TeamSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("serving_teams")
    .select(
      `
      *,
      team_positions(count),
      team_members(count)
    `,
    )
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw error;
  return (data ?? []) as TeamSummary[];
}

/**
 * Get all active teams with member counts and lead names.
 * Used for team listing cards on the /teams page.
 */
export async function getTeamsWithLeads(): Promise<TeamListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("serving_teams")
    .select(
      `
      id,
      name,
      description,
      color,
      team_members(
        role,
        members(full_name)
      )
    `,
    )
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw error;

  // biome-ignore lint: Supabase returns nested relations with dynamic types
  return (data ?? []).map((team: Record<string, unknown>) => {
    const teamMembers = (team.team_members ?? []) as {
      role: string;
      members: { full_name: string } | { full_name: string }[] | null;
    }[];
    const lead = teamMembers.find((m) => m.role === "lead");
    // Supabase returns members as object (single FK) or array; handle both
    const leadMembers = lead?.members;
    const leadName = leadMembers
      ? Array.isArray(leadMembers)
        ? (leadMembers[0]?.full_name ?? null)
        : leadMembers.full_name
      : null;
    return {
      id: team.id as string,
      name: team.name as string,
      description: team.description as string | null,
      color: team.color as string | null,
      memberCount: teamMembers.length,
      leadName,
    };
  });
}

/**
 * Get a single team with all positions, members, and member details.
 * Used for team detail pages.
 */
export async function getTeamWithMembers(
  teamId: string,
): Promise<TeamWithMembers | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("serving_teams")
    .select(
      `
      id,
      name,
      description,
      color,
      is_active,
      sort_order,
      team_positions(
        id,
        name,
        category,
        quantity_needed,
        sort_order,
        is_active
      ),
      team_members(
        id,
        member_id,
        role,
        joined_at,
        members(
          id,
          full_name,
          email
        )
      )
    `,
    )
    .eq("id", teamId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }

  return data as unknown as TeamWithMembers;
}

/**
 * Get positions for a specific team, ordered by sort_order.
 */
export async function getTeamPositions(
  teamId: string,
): Promise<TeamWithMembers["team_positions"]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_positions")
    .select("id, name, category, quantity_needed, sort_order, is_active")
    .eq("team_id", teamId)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

/**
 * Get all members for the member assignment combobox.
 * Optional search filter on full_name or email.
 */
export async function getAllMembers(
  searchQuery?: string,
): Promise<MemberOption[]> {
  const supabase = await createClient();

  let query = supabase
    .from("members")
    .select("id, full_name, email")
    .not("auth_user_id", "is", null);

  if (searchQuery) {
    query = query.or(
      `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
    );
  }

  const { data, error } = await query.order("full_name");

  if (error) throw error;
  return (data ?? []) as MemberOption[];
}
