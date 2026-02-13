import { getUserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OwnProfile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  member_profiles: {
    phone: string | null;
    avatar_url: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    birthdate: string | null;
    joined_serving_at: string | null;
    notify_email: boolean;
    notify_assignment_changes: boolean;
    reminder_days_before: number;
    updated_at: string;
  } | null;
}

export interface MemberProfile {
  id: string;
  full_name: string;
  email: string;
  member_profiles: {
    phone: string | null;
    avatar_url: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    birthdate: string | null;
    joined_serving_at: string | null;
    notify_email: boolean;
    notify_assignment_changes: boolean;
    reminder_days_before: number;
    updated_at: string;
  } | null;
  team_members: {
    id: string;
    team_id: string;
    role: "lead" | "member";
    joined_at: string;
    serving_teams: {
      id: string;
      name: string;
      color: string | null;
    };
  }[];
  member_position_skills: {
    proficiency: string;
    preference: string;
    team_positions: {
      id: string;
      name: string;
      category: string | null;
    };
  }[];
}

export interface TeamMemberProfile {
  id: string;
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
  member_position_skills: {
    proficiency: string;
    preference: string;
    team_positions: {
      id: string;
      name: string;
      category: string | null;
    };
  }[];
}

// ---------------------------------------------------------------------------
// Queries (all use RLS-protected client)
// ---------------------------------------------------------------------------

/**
 * Get the current user's own profile.
 * Returns member data with nested profile (may be null if no profile row yet).
 */
export async function getOwnProfile(): Promise<OwnProfile | null> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return null;

  const { data, error } = await supabase
    .from("members")
    .select(
      `
      id,
      full_name,
      email,
      created_at,
      member_profiles(
        phone,
        avatar_url,
        emergency_contact_name,
        emergency_contact_phone,
        birthdate,
        joined_serving_at,
        notify_email,
        notify_assignment_changes,
        reminder_days_before,
        updated_at
      )
    `,
    )
    .eq("id", memberId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }

  return data as unknown as OwnProfile;
}

/**
 * Get a specific member's profile with their teams and skills.
 * For viewing other members' profiles (PROF-06).
 */
export async function getMemberProfile(
  memberId: string,
): Promise<MemberProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select(
      `
      id,
      full_name,
      email,
      member_profiles(
        phone,
        avatar_url,
        emergency_contact_name,
        emergency_contact_phone,
        birthdate,
        joined_serving_at,
        notify_email,
        notify_assignment_changes,
        reminder_days_before,
        updated_at
      ),
      team_members(
        id,
        team_id,
        role,
        joined_at,
        serving_teams(
          id,
          name,
          color
        )
      ),
      member_position_skills(
        proficiency,
        preference,
        team_positions(
          id,
          name,
          category
        )
      )
    `,
    )
    .eq("id", memberId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }

  return data as unknown as MemberProfile;
}

/**
 * Get the current user's position skills grouped by team.
 * For the profile page Positions & Skills tab.
 */
export interface OwnPositionSkill {
  proficiency: string;
  preference: string;
  team_positions: {
    id: string;
    name: string;
    category: string | null;
    serving_teams: {
      id: string;
      name: string;
      color: string | null;
    };
  };
}

export async function getOwnPositionSkills(): Promise<OwnPositionSkill[]> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return [];

  const { data, error } = await supabase
    .from("member_position_skills")
    .select(
      `
      proficiency,
      preference,
      team_positions(
        id,
        name,
        category,
        serving_teams(
          id,
          name,
          color
        )
      )
    `,
    )
    .eq("member_id", memberId);

  if (error) throw error;
  return (data ?? []) as unknown as OwnPositionSkill[];
}

/**
 * Get all members of a specific team with their profiles and skills.
 * For team detail views.
 */
export async function getMembersByTeam(
  teamId: string,
): Promise<TeamMemberProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select(
      `
      id,
      member_id,
      role,
      joined_at,
      members(
        id,
        full_name,
        email
      ),
      member_profiles:member_id(
        phone,
        avatar_url
      ),
      member_position_skills:member_id(
        proficiency,
        preference,
        team_positions(
          id,
          name,
          category
        )
      )
    `,
    )
    .eq("team_id", teamId)
    .order("role")
    .order("joined_at");

  if (error) throw error;
  return (data ?? []) as unknown as TeamMemberProfile[];
}
