# Phase 2: Teams & Member Profiles - Research

**Researched:** 2026-02-13
**Domain:** Supabase schema design for teams/positions/profiles, RLS policies, server actions, form-based profile management UI
**Confidence:** HIGH

## Summary

Phase 2 introduces the team/position data model, team membership management, and member profile editing -- building directly on Phase 1's auth infrastructure (Supabase clients, role resolution via `members` -> `assignments` -> `roles`, admin client with service role key). The core technical challenge is designing a ministry-agnostic schema that uses the **existing** `members` table (350+ records, shared with ym-attend-4) while adding new serving-specific tables (`serving_teams`, `team_positions`, `team_members`, `member_profiles`) with proper RLS policies.

The existing codebase already has the patterns needed: server actions with admin auth checks (`lib/auth/admin-actions.ts`), role resolution via DB queries (`lib/auth/roles.ts`), admin client for bypassing RLS (`lib/supabase/admin.ts`), and Zod validation (`lib/auth/schemas.ts`). Phase 2 extends these patterns to team CRUD, member assignment, and profile management. The UI will use the existing shadcn/ui component library (Table, Dialog, Select, Form, Badge, Avatar, Input, Tabs, Command/Combobox) with the established mobile-first responsive pattern (mobile card layout + desktop table layout, as seen in `components/admin/user-role-table.tsx`).

**Primary recommendation:** Create new `serving_teams`, `team_positions`, `team_members`, and `member_profiles` tables (do NOT modify the shared `members` table schema). Use `createAdminClient()` for all team management server actions (bypasses RLS, simpler for single-church). Add RLS policies on new tables for anon-key client reads. Use react-hook-form + Zod for profile editing forms. Use Supabase Storage `avatars` bucket for profile photos.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.95.3 | Database queries, storage uploads | Already installed; Supabase JS client for all data operations |
| `@supabase/ssr` | ^0.8.0 | Server-side Supabase client with cookies | Already installed; used in server actions and server components |
| `react-hook-form` | ^7.71.1 | Profile editing form state management | Already installed; handles form state, validation, dirty tracking |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for react-hook-form | Already installed; connects Zod schemas to form validation |
| `zod` | ^4.3.6 | Schema validation for team/profile data | Already installed; runtime validation in server actions |
| `lucide-react` | ^0.563.0 | Icons for team UI (Users, UserPlus, Shield, etc.) | Already installed |
| `sonner` | ^2.0.7 | Toast notifications for CRUD feedback | Already installed |
| `date-fns` | ^4.1.0 | Date formatting for join dates, birthdates | Already installed |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Table | (installed) | Team roster display, member lists | Desktop view of team members and roster |
| shadcn/ui Dialog | (installed) | Create/edit team modals, position management | Modal forms for CRUD operations |
| shadcn/ui Command/Combobox | (installed) | Member search in team assignment | Searchable dropdown for adding members to teams |
| shadcn/ui Avatar | (installed) | Profile photos in roster and profile views | Member avatar display everywhere |
| shadcn/ui Badge | (installed) | Skill level indicators, role badges | Display proficiency levels and team roles |
| shadcn/ui Tabs | (installed) | Profile sections (info, preferences, etc.) | Organize profile editing into sections |
| shadcn/ui Select | (installed) | Skill level dropdowns, team selection | Enum-style selections in forms |
| shadcn/ui Form | (installed) | Form field components with validation | Profile editing form fields |

### No New Dependencies Required
All libraries needed for Phase 2 are already installed. No `pnpm add` commands needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate `member_profiles` table | Add columns to existing `members` table | `members` is shared with ym-attend-4; adding columns risks breaking the other system. Separate table is safer. |
| Admin client for all mutations | Anon-key client with RLS policies | Single-church app with <500 users; admin client is simpler, avoids complex RLS for mutations. Use RLS for reads only. |
| `uuid[]` array for qualified positions | Separate `member_position_qualifications` join table | Array is simpler for small datasets; join table needed if querying "who can play drums?" frequently. Recommend join table for query flexibility. |
| Supabase Storage for avatars | External CDN (Cloudinary, Uploadcare) | Storage is built-in, free tier sufficient, RLS-compatible. No need for external service. |

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)
```
app/
  (app)/
    team-roster/
      page.tsx                    # Team roster overview (PROF-07: searchable)
    teams/
      page.tsx                    # Team management (admin/committee only)
      [teamId]/
        page.tsx                  # Single team detail with members
    profile/
      page.tsx                    # Own profile view/edit (PROF-02, PROF-03, PROF-04, PROF-05)
    members/
      [memberId]/
        page.tsx                  # View other member's profile (PROF-06)

lib/
  teams/
    actions.ts                    # Server Actions: team CRUD, position CRUD, member assignment
    queries.ts                    # Query functions: getTeams, getTeamMembers, getTeamPositions
    schemas.ts                    # Zod schemas for team/position validation
  profiles/
    actions.ts                    # Server Actions: updateProfile, updatePreferences, uploadAvatar
    queries.ts                    # Query functions: getProfile, getMemberProfile
    schemas.ts                    # Zod schemas for profile validation

components/
  teams/
    team-card.tsx                 # Team display card (name, member count, lead)
    team-form.tsx                 # Create/edit team form (Dialog)
    position-manager.tsx          # Manage positions within a team
    member-assignment.tsx         # Add/remove members from team (Combobox)
    team-member-list.tsx          # List of members in a team with roles
  profiles/
    profile-form.tsx              # Profile editing form (react-hook-form)
    avatar-upload.tsx             # Avatar upload component
    notification-preferences.tsx  # Notification preference toggles
    position-preferences.tsx      # Position preference settings

supabase/
  migrations/
    00003_serving_teams.sql       # Teams, positions, team_members tables
    00004_member_profiles.sql     # Member profiles table, avatar storage bucket
```

### Pattern 1: Ministry-Agnostic Team Schema (TEAM-05)
**What:** Teams and positions are pure data rows, not hardcoded schema. New teams created by inserting rows, not schema changes.
**When to use:** All team/position data modeling.

```sql
-- Source: Architecture research + Supabase best practices
-- Teams are data, not schema. Any ministry can be added.
create table public.serving_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,        -- "Worship", "Lights", "Sound", "Ushering"
  description text,
  color text,                       -- hex color for UI (calendar, badges)
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Positions belong to a team. Categories group positions for display.
create table public.team_positions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.serving_teams(id) on delete cascade,
  name text not null,               -- "Lead Vocals", "Bass Guitar", "Camera 1"
  category text,                    -- "vocals", "instruments", "production", etc.
  quantity_needed int not null default 1,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(team_id, name)
);

-- Junction: which members belong to which teams with what role
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.serving_teams(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role text not null default 'member' check (role in ('lead', 'member')),
  joined_at timestamptz not null default now(),
  unique(team_id, member_id)
);

-- Junction: which positions a member is qualified for, with proficiency
create table public.member_position_skills (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  position_id uuid not null references public.team_positions(id) on delete cascade,
  proficiency text not null default 'beginner'
    check (proficiency in ('beginner', 'intermediate', 'advanced', 'expert')),
  preference text not null default 'willing'
    check (preference in ('primary', 'secondary', 'willing')),
  created_at timestamptz not null default now(),
  unique(member_id, position_id)
);
```

### Pattern 2: Separate Member Profiles Table
**What:** Serving-specific profile fields in a separate table, not modifying shared `members` table.
**When to use:** All profile data beyond what `members` already has (full_name, email, auth_user_id).

```sql
-- Serving-specific profile extensions (does NOT modify shared members table)
create table public.member_profiles (
  member_id uuid primary key references public.members(id) on delete cascade,
  phone text,
  avatar_url text,                  -- path in Supabase Storage avatars bucket
  emergency_contact_name text,
  emergency_contact_phone text,
  birthdate date,
  joined_serving_at timestamptz default now(),
  notify_email boolean not null default true,
  notify_assignment_changes boolean not null default true,
  reminder_days_before int not null default 2,
  updated_at timestamptz not null default now()
);
```

### Pattern 3: RLS Policies for Team Tables
**What:** Read access for all authenticated users; write access restricted to admin/committee via server actions using admin client.
**When to use:** All new serving tables.

```sql
-- Source: Supabase RLS docs + project pitfall research
-- Strategy: RLS for reads (authenticated users can see team data).
-- Writes go through server actions using admin client (service role key).

-- serving_teams: all authenticated can read
alter table public.serving_teams enable row level security;
create policy "Authenticated users can view teams"
  on public.serving_teams for select
  to authenticated
  using (true);

-- team_positions: all authenticated can read
alter table public.team_positions enable row level security;
create policy "Authenticated users can view positions"
  on public.team_positions for select
  to authenticated
  using (true);

-- team_members: all authenticated can read
-- (contact info visibility controlled at application layer, not RLS)
alter table public.team_members enable row level security;
create policy "Authenticated users can view team membership"
  on public.team_members for select
  to authenticated
  using (true);

-- member_position_skills: all authenticated can read
alter table public.member_position_skills enable row level security;
create policy "Authenticated users can view skills"
  on public.member_position_skills for select
  to authenticated
  using (true);

-- member_profiles: authenticated can read all, but only own profile for write
alter table public.member_profiles enable row level security;
create policy "Authenticated users can view profiles"
  on public.member_profiles for select
  to authenticated
  using (true);

create policy "Members can update own profile"
  on public.member_profiles for update
  to authenticated
  using (
    member_id in (
      select id from public.members
      where auth_user_id = (select auth.uid())
    )
  );

create policy "Members can insert own profile"
  on public.member_profiles for insert
  to authenticated
  with check (
    member_id in (
      select id from public.members
      where auth_user_id = (select auth.uid())
    )
  );
```

### Pattern 4: Server Action with Auth Check (Mutation Pattern)
**What:** All team/profile mutations go through server actions with role verification + admin client.
**When to use:** Every write operation.

```typescript
// Source: Established pattern from lib/auth/admin-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createTeamSchema } from "./schemas";

export async function createTeam(formData: FormData) {
  // 1. Verify caller is admin or committee
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (role !== "admin" && role !== "committee") {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  // 2. Validate input
  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return { error: "Invalid team data." };
  }

  // 3. Use admin client for write (bypasses RLS)
  const admin = createAdminClient();
  const { error } = await admin
    .from("serving_teams")
    .insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/teams");
  return { success: true };
}
```

### Pattern 5: Searchable Team Roster (PROF-07)
**What:** Server-side text search for team roster using `ilike` filter.
**When to use:** Team roster page with search functionality.

```typescript
// Query function for searchable roster
export async function getTeamRoster(searchQuery?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("members")
    .select(`
      id, full_name, email,
      member_profiles(phone, avatar_url),
      team_members(
        team_id, role,
        serving_teams(id, name, color)
      ),
      member_position_skills(
        proficiency, preference,
        team_positions(id, name, category, team_id)
      )
    `)
    .not("auth_user_id", "is", null);

  if (searchQuery) {
    query = query.or(
      `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
    );
  }

  const { data, error } = await query.order("full_name");
  if (error) throw error;
  return data;
}
```

### Pattern 6: Avatar Upload with Supabase Storage
**What:** Upload avatar images to a dedicated Supabase Storage bucket, store path in `member_profiles.avatar_url`.
**When to use:** Profile photo upload.

```typescript
// Client-side avatar upload (in a "use client" component)
import { createClient } from "@/lib/supabase/client";

async function uploadAvatar(file: File, memberId: string) {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const filePath = `${memberId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return publicUrl;
}
```

### Anti-Patterns to Avoid
- **Modifying the shared `members` table:** Adding columns to `members` risks breaking ym-attend-4. Use a separate `member_profiles` table with `member_id` FK.
- **Storing team structure in code:** Hardcoding team names, positions, or categories in TypeScript enums. All must be data-driven from the database.
- **Complex RLS for mutations:** For a single-church app with admin-checked server actions, using the admin client for writes is simpler and equally secure. RLS is for read protection.
- **N+1 queries for roster:** Fetching each member's teams and positions in separate queries. Use Supabase's nested select (`team_members(serving_teams(...))`) to get everything in one query.
- **Putting `qualified_positions` as a UUID array on `team_members`:** This prevents efficient querying ("who can play drums?"). Use a proper join table (`member_position_skills`) instead.
- **Creating new role tables for team leads:** Use the existing `team_members.role = 'lead'` column. Do NOT create new roles in the `roles` table for per-team leadership. The `roles`/`assignments` tables are for global app roles (Admin, Committee) only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Searchable member dropdown | Custom search input + API | shadcn/ui Combobox (`components/ui/combobox.tsx`) | Already installed; handles keyboard nav, search filtering, accessible |
| Avatar image handling | Custom upload UI + resize logic | Supabase Storage + shadcn/ui Avatar | Built-in CDN, RLS support, automatic URL generation |
| Form state for profile editing | Manual useState for each field | react-hook-form + Zod resolver | Already installed; handles dirty tracking, validation, error display |
| Toast notifications for CRUD | Custom notification system | sonner (already in root layout) | Already configured; `toast.success()` / `toast.error()` |
| Responsive table/card layout | Custom responsive logic | Pattern from `user-role-table.tsx` (desktop Table + mobile cards) | Already proven in Phase 1; reuse the same pattern |
| Proficiency level display | Custom component | shadcn/ui Badge with variant colors | Consistent with existing role badge pattern |

**Key insight:** Phase 2 introduces no new libraries. Every UI component and data pattern needed is already installed and has working examples in the Phase 1 codebase. The primary work is database schema design and wiring up new server actions and pages using established patterns.

## Common Pitfalls

### Pitfall 1: Breaking the Shared `members` Table
**What goes wrong:** Adding serving-specific columns (phone, avatar, emergency_contact, birthdate, notification_preferences) directly to the `members` table. ym-attend-4 queries break if columns are added, or data inconsistency arises if both systems update the same row.
**Why it happens:** It feels natural to extend the existing table rather than creating a new one. "DRY principle" instinct.
**How to avoid:** Create `member_profiles` as a separate 1:1 table with `member_id` as PK + FK to `members.id`. Read `full_name` and `email` from `members`, everything else from `member_profiles`. Use Supabase's nested select to join them in queries.
**Warning signs:** Queries in ym-attend-4 start failing; migration conflicts between the two systems.

### Pitfall 2: Team Lead as a Global Role Instead of Per-Team
**What goes wrong:** Making "Team Lead" a global role in the `roles`/`assignments` tables. A user who leads Worship can then manage Sound, Lights, and every other team.
**Why it happens:** The existing role infrastructure (Admin/Committee/Member) is global. It seems simpler to add another global role.
**How to avoid:** Team lead is a per-team attribute stored in `team_members.role = 'lead'`. The global "Committee" role already gives broad team management access. Team lead status is checked by querying `team_members` for the specific team.
**Warning signs:** A worship leader can edit the AV team roster; no way to give someone lead access to just one team.

### Pitfall 3: RLS Policy Performance on Nested Selects
**What goes wrong:** RLS policies on `team_members` that do subqueries to check team membership cause slow nested selects when fetching roster data with many joins.
**Why it happens:** Each row in `team_members` triggers the RLS policy evaluation. With nested selects joining 4+ tables, the policy runs many times.
**How to avoid:** Keep RLS policies simple -- `to authenticated using (true)` for SELECT on team data (all authenticated users can see team structure in a single-church app). Control sensitive data visibility (contact info) at the application layer in query functions, not RLS.
**Warning signs:** Roster page with 50+ members takes >1 second to load.

### Pitfall 4: Avatar Upload Without Upsert
**What goes wrong:** Uploading a new avatar creates a new file each time instead of replacing the old one. Storage fills up with orphaned files.
**Why it happens:** Default Supabase Storage upload does not overwrite existing files.
**How to avoid:** Use `{ upsert: true }` option on upload. Use a deterministic file path like `{memberId}/avatar.{ext}` so re-uploads overwrite.
**Warning signs:** Storage usage grows linearly with profile edits; old avatars accessible via old URLs.

### Pitfall 5: Not Handling the "No Profile Yet" Case
**What goes wrong:** Member logs in but has no row in `member_profiles`. Profile page crashes or shows error.
**Why it happens:** `member_profiles` is created per-member, but existing 350+ members have no profile rows yet.
**How to avoid:** Use `upsert` pattern for profile updates -- if no row exists, insert; if exists, update. In queries, use left join (Supabase handles this with nullable nested selects). Profile form should work with empty/null values for all fields.
**Warning signs:** Existing members see "Profile not found" errors.

### Pitfall 6: Position Category as Enum Instead of Data
**What goes wrong:** Hardcoding position categories as a TypeScript enum or Postgres enum (`vocals`, `instruments`, `production`). New categories require code/schema changes.
**Why it happens:** The Figma prototype shows these specific categories, suggesting they're fixed.
**How to avoid:** Store category as a `text` column on `team_positions`. The UI can group by this text value. Admins can use any category name. The Figma categories are just seed data.
**Warning signs:** User requests "can you add a 'logistics' category?" and it requires a code deploy.

## Code Examples

### Team CRUD Server Actions
```typescript
// lib/teams/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function createTeam(data: {
  name: string;
  description?: string;
  color?: string;
}) {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized" };
  }

  const admin = createAdminClient();
  const { data: team, error } = await admin
    .from("serving_teams")
    .insert({
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/teams");
  return { success: true, teamId: team.id };
}

export async function addMemberToTeam(
  teamId: string,
  memberId: string,
  role: "lead" | "member" = "member",
) {
  const supabase = await createClient();
  const { role: userRole, memberId: callerMemberId } = await getUserRole(supabase);

  // Admin/committee can add to any team; team lead can add to their team
  if (!isAdminOrCommittee(userRole)) {
    const admin = createAdminClient();
    const { data: teamMembership } = await admin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("member_id", callerMemberId)
      .single();

    if (teamMembership?.role !== "lead") {
      return { error: "Unauthorized" };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members")
    .upsert({ team_id: teamId, member_id: memberId, role });

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}
```

### Profile Update with Upsert Pattern
```typescript
// lib/profiles/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateOwnProfile(data: {
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  birthdate?: string;
  notify_email?: boolean;
  notify_assignment_changes?: boolean;
  reminder_days_before?: number;
}) {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return { error: "Member not found" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("member_profiles")
    .upsert(
      {
        member_id: memberId,
        ...data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "member_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
```

### Nested Select for Roster Query
```typescript
// lib/teams/queries.ts
import { createClient } from "@/lib/supabase/server";

export async function getTeamRoster(searchQuery?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("members")
    .select(`
      id,
      full_name,
      email,
      member_profiles(phone, avatar_url),
      team_members!inner(
        id,
        team_id,
        role,
        serving_teams(id, name, color)
      ),
      member_position_skills(
        proficiency,
        preference,
        team_positions(id, name, category)
      )
    `)
    .not("auth_user_id", "is", null);

  if (searchQuery) {
    query = query.or(
      `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
    );
  }

  const { data, error } = await query.order("full_name");
  if (error) throw error;
  return data;
}
```

### Zod Schemas for Team/Position Validation
```typescript
// lib/teams/schemas.ts
import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color").optional(),
});

export const createPositionSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1, "Position name is required").max(100),
  category: z.string().max(50).optional(),
  quantityNeeded: z.number().int().min(1).max(20).default(1),
});

export const proficiencySchema = z.enum([
  "beginner", "intermediate", "advanced", "expert"
]);

export const preferenceSchema = z.enum([
  "primary", "secondary", "willing"
]);

// lib/profiles/schemas.ts
export const updateProfileSchema = z.object({
  phone: z.string().max(20).optional(),
  emergency_contact_name: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(20).optional(),
  birthdate: z.string().date().optional(),
  notify_email: z.boolean().optional(),
  notify_assignment_changes: z.boolean().optional(),
  reminder_days_before: z.number().int().min(0).max(14).optional(),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded team types as Postgres enums | Teams as data rows in a generic `serving_teams` table | Industry best practice | New teams without schema migrations |
| `qualified_positions uuid[]` on member row | Separate `member_position_skills` join table | Schema normalization best practice | Queryable ("who can play drums?"), indexable, supports per-position proficiency |
| Roles in JWT claims | Roles in database with per-request query | Phase 1 decision (ym-attend-4 alignment) | Instant role changes, shared role infrastructure |
| Single profile table for all apps | Separate `member_profiles` extension table | Shared Supabase project constraint | Safe co-existence with ym-attend-4 |

**Deprecated/outdated:**
- Custom access token hook approach (was in Phase 1 research but rejected in favor of DB queries during implementation)
- `@supabase/auth-helpers-nextjs`: Project already uses `@supabase/ssr`

## Open Questions

1. **Existing `members` table columns**
   - What we know: Table has `id`, `full_name`, `email`, `auth_user_id` columns (observed from queries in `admin-actions.ts` and `roles.ts`).
   - What's unclear: Full column list of the shared `members` table. Are there already `phone`, `birthdate`, or other profile-like columns?
   - Recommendation: Before executing migration, query `information_schema.columns WHERE table_name = 'members'` to discover all columns. If `phone` already exists on `members`, read from there instead of duplicating in `member_profiles`.

2. **Supabase Storage `avatars` bucket**
   - What we know: Supabase Storage is not yet configured for this project.
   - What's unclear: Whether ym-attend-4 has already created storage buckets that we should reuse.
   - Recommendation: Create a new `avatars` public bucket in the migration. Public buckets simplify URL handling (no signed URLs needed for display).

3. **Team lead permissions scope (TEAM-03, TEAM-04)**
   - What we know: Committee role is global (can manage any team). Team lead is per-team. TEAM-04 says team leads can add/remove members from *their* team.
   - What's unclear: Can a team lead also manage positions in their team, or is that admin/committee only?
   - Recommendation: Team leads can manage membership (add/remove members) for their team. Position CRUD (create/edit/delete positions) is admin/committee only, since positions affect scheduling structure.

4. **Contact info visibility (PROF-06)**
   - What we know: PROF-06 says users can view other team members' profiles (name, positions, contact info).
   - What's unclear: "Contact info" -- does this include phone/email for everyone, or just team members in the same team?
   - Recommendation: All authenticated serving members can see name, positions, and email of other members. Phone and emergency contact visible only to admin/committee and same-team members. Control at application layer in query functions.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `lib/auth/roles.ts`, `lib/auth/admin-actions.ts`, `lib/supabase/admin.ts`, `components/admin/user-role-table.tsx` -- established patterns for server actions, role checks, admin client usage, responsive UI
- Supabase docs: RLS policies for team membership tables, nested select syntax, Storage upload API
- Context7 `/supabase/supabase-js` -- select with relations, insert, upsert patterns
- Context7 `/websites/supabase` -- RLS policy optimization (avoid joins, use `(select auth.uid())`)
- `.planning/research/ARCHITECTURE.md` -- Generic teams/positions schema pattern, RLS strategy table

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` -- RLS performance pitfalls, flat role model pitfall, N+1 query pitfall
- `.planning/research/FEATURES.md` -- Feature dependencies confirming teams/positions as prerequisite for scheduling
- Supabase Storage docs -- avatar upload with upsert, public bucket URL generation

### Tertiary (LOW confidence)
- Exact column list of shared `members` table -- inferred from queries, not directly verified via `information_schema`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in Phase 1; no new dependencies
- Architecture: HIGH -- patterns directly extend established Phase 1 patterns (server actions, admin client, responsive UI)
- Schema design: HIGH -- follows architecture research's generic teams/positions pattern, adapted for shared `members` table constraint
- RLS policies: HIGH -- simplified for single-church; read-open for authenticated, writes via admin client
- Pitfalls: HIGH -- directly sourced from pitfalls research and codebase analysis of shared table constraint
- Profile/avatar: MEDIUM -- Supabase Storage not yet used in project; patterns from official docs

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days -- stable libraries, no breaking changes expected)
