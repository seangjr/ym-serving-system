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

export interface TeamDetailMember {
  id: string;
  member_id: string;
  role: "lead" | "member";
  joined_at: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  contact_number: string | null;
  skills: {
    position_id: string;
    proficiency: string;
    preference: string;
  }[];
}

export interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  positions: {
    id: string;
    name: string;
    category: string | null;
    quantity_needed: number;
    sort_order: number;
    is_active: boolean;
  }[];
  members: TeamDetailMember[];
}

export interface MemberOption {
  id: string;
  full_name: string;
  email: string;
}

export interface RosterMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  teams: {
    id: string;
    name: string;
    color: string | null;
    role: "lead" | "member";
  }[];
  positions: {
    name: string;
    category: string | null;
    proficiency: string;
    preference: string;
  }[];
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
 * Get a single team with positions, members (with profiles and skills).
 * Used for the team detail page with full member information.
 */
export async function getTeamDetail(
  teamId: string,
): Promise<TeamDetail | null> {
  const supabase = await createClient();

  // Fetch team + positions + members with member profile data
  const { data: team, error: teamError } = await supabase
    .from("serving_teams")
    .select(
      `
      id, name, description, color, is_active, sort_order,
      team_positions(id, name, category, quantity_needed, sort_order, is_active),
      team_members(
        id, member_id, role, joined_at,
        members(id, full_name, email, contact_number, member_profiles(avatar_url))
      )
    `,
    )
    .eq("id", teamId)
    .single();

  if (teamError) {
    if (teamError.code === "PGRST116") return null;
    throw teamError;
  }

  // Get skill data for all members in this team
  const memberIds = (team.team_members ?? []).map(
    (m: { member_id: string }) => m.member_id,
  );
  const positionIds = (team.team_positions ?? []).map(
    (p: { id: string }) => p.id,
  );

  let skillsMap: Record<
    string,
    { position_id: string; proficiency: string; preference: string }[]
  > = {};

  if (memberIds.length > 0 && positionIds.length > 0) {
    const { data: skills } = await supabase
      .from("member_position_skills")
      .select("member_id, position_id, proficiency, preference")
      .in("member_id", memberIds)
      .in("position_id", positionIds);

    if (skills) {
      skillsMap = {};
      for (const skill of skills) {
        const mid = skill.member_id as string;
        if (!skillsMap[mid]) skillsMap[mid] = [];
        skillsMap[mid].push({
          position_id: skill.position_id as string,
          proficiency: skill.proficiency as string,
          preference: skill.preference as string,
        });
      }
    }
  }

  // Transform the nested Supabase response into our clean TeamDetail type
  const members: TeamDetailMember[] = (team.team_members ?? []).map(
    (tm: Record<string, unknown>) => {
      const member = tm.members as {
        id: string;
        full_name: string;
        email: string;
        contact_number: string | null;
        member_profiles: {
          avatar_url: string | null;
        } | null;
      } | null;
      const profile = member?.member_profiles ?? null;
      const memberId = tm.member_id as string;
      return {
        id: tm.id as string,
        member_id: memberId,
        role: tm.role as "lead" | "member",
        joined_at: tm.joined_at as string,
        full_name: member?.full_name ?? "Unknown",
        email: member?.email ?? "",
        avatar_url: profile?.avatar_url ?? null,
        contact_number: member?.contact_number ?? null,
        skills: skillsMap[memberId] ?? [],
      };
    },
  );

  // Sort: leads first, then alphabetical by name
  members.sort((a, b) => {
    if (a.role === "lead" && b.role !== "lead") return -1;
    if (a.role !== "lead" && b.role === "lead") return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    color: team.color,
    is_active: team.is_active,
    sort_order: team.sort_order,
    positions: (team.team_positions ?? []) as TeamDetail["positions"],
    members,
  };
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

/**
 * Get all serving members (members with at least one team) for the roster page.
 * Optionally filter by search query (name/email) and team ID.
 */
export async function getTeamRoster(
  searchQuery?: string,
  teamId?: string,
): Promise<RosterMember[]> {
  const supabase = await createClient();

  // Fetch members who are on at least one team (!inner join)
  let query = supabase.from("members").select(
    `
      id,
      full_name,
      email,
      member_profiles(avatar_url),
      team_members!inner(
        id,
        role,
        serving_teams(id, name, color)
      ),
      member_position_skills(
        proficiency,
        preference,
        team_positions(name, category)
      )
    `,
  );

  if (searchQuery) {
    query = query.or(
      `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
    );
  }

  const { data, error } = await query.order("full_name");

  if (error) throw error;

  // Transform into flat RosterMember shape
  const members: RosterMember[] = (data ?? []).map(
    (row: Record<string, unknown>) => {
      const profile = row.member_profiles as {
        avatar_url: string | null;
      } | null;
      const teamMemberships = (row.team_members ?? []) as {
        id: string;
        role: "lead" | "member";
        serving_teams: { id: string; name: string; color: string | null };
      }[];
      const skills = (row.member_position_skills ?? []) as {
        proficiency: string;
        preference: string;
        team_positions: { name: string; category: string | null };
      }[];

      return {
        id: row.id as string,
        full_name: row.full_name as string,
        email: row.email as string,
        avatar_url: profile?.avatar_url ?? null,
        teams: teamMemberships.map((tm) => ({
          id: tm.serving_teams.id,
          name: tm.serving_teams.name,
          color: tm.serving_teams.color,
          role: tm.role,
        })),
        positions: skills.map((s) => ({
          name: s.team_positions.name,
          category: s.team_positions.category,
          proficiency: s.proficiency,
          preference: s.preference,
        })),
      };
    },
  );

  // If filtering by team, only keep members on that team
  if (teamId) {
    return members.filter((m) => m.teams.some((t) => t.id === teamId));
  }

  return members;
}
