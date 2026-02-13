---
phase: 02-teams-and-member-profiles
plan: 01
subsystem: database, api
tags: [supabase, postgres, rls, zod, server-actions, storage]

# Dependency graph
requires:
  - phase: 01-foundation-and-authentication
    provides: "Supabase clients (server, admin), getUserRole(), isAdminOrCommittee(), members/assignments/roles tables"
provides:
  - "serving_teams, team_positions, team_members, member_position_skills tables with RLS"
  - "member_profiles table with upsert-based profile management"
  - "Supabase Storage avatars bucket with upload/read policies"
  - "10 team server actions (CRUD, membership, skills) with admin/committee/lead auth"
  - "4 profile server actions (own profile, notifications, avatar, admin update)"
  - "7 query functions for teams and profiles with nested Supabase selects"
  - "Zod validation schemas for all inputs"
affects: [02-02, 02-03, 02-04, 03-scheduling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Team CRUD server actions with admin/committee authorization"
    - "Team lead per-team authorization via team_members.role check"
    - "Profile upsert pattern for existing members with no profile row"
    - "Admin client for writes, RLS client for reads"
    - "Nested Supabase selects for team/member/profile joins"
    - "Zod v4 .issues (not .errors) for validation error access"

key-files:
  created:
    - supabase/migrations/00003_serving_teams.sql
    - supabase/migrations/00004_member_profiles.sql
    - lib/teams/schemas.ts
    - lib/teams/actions.ts
    - lib/teams/queries.ts
    - lib/profiles/schemas.ts
    - lib/profiles/actions.ts
    - lib/profiles/queries.ts
  modified: []

key-decisions:
  - "Zod v4 uses .issues not .errors on ZodError -- fixed across all action files"
  - "Position categories are free-form text with CHECK constraints, not Postgres enums"
  - "Team lead authorization checks team_members table per-team, not global roles"
  - "Profile upsert pattern handles 350+ existing members with no profile rows"
  - "Avatars bucket is public for simplified URL handling (no signed URLs)"

patterns-established:
  - "Team module pattern: schemas.ts + actions.ts + queries.ts in lib/{domain}/"
  - "Team lead auth: query team_members for caller's role before allowing action"
  - "Admin client for all mutations, RLS client for all reads"
  - "Upsert with onConflict for idempotent profile updates"

# Metrics
duration: 5min
completed: 2026-02-13
---

# Phase 2 Plan 1: Schema & Data Layer Summary

**5 Postgres tables (teams, positions, membership, skills, profiles), 14 server actions with role-based auth, 7 query functions with nested selects, and Supabase Storage avatars bucket**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-13T14:29:36Z
- **Completed:** 2026-02-13T14:34:47Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Complete database schema: serving_teams, team_positions, team_members, member_position_skills, member_profiles tables with RLS policies and updated_at triggers
- 14 server actions across teams and profiles modules with admin/committee/team-lead authorization
- 7 query functions with nested Supabase selects for efficient data loading
- Supabase Storage avatars bucket with authenticated upload and public read policies

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migrations** - `3b4bb6e` (feat)
2. **Task 2: Teams module (schemas, actions, queries)** - `36f1ce4` (feat)
3. **Task 3: Profiles module (schemas, actions, queries)** - `0f053ad` (feat)
4. **Zod v4 .issues fix** - `750644f` (fix, deviation Rule 1)

**Plan metadata:** pending

## Files Created/Modified
- `supabase/migrations/00003_serving_teams.sql` - Teams, positions, membership, skills tables + RLS
- `supabase/migrations/00004_member_profiles.sql` - Profiles table + avatars storage bucket + RLS
- `lib/teams/schemas.ts` - Zod schemas for team/position create/update + proficiency/preference types
- `lib/teams/actions.ts` - 10 server actions for team CRUD, position CRUD, membership, skills
- `lib/teams/queries.ts` - getTeams, getTeamWithMembers, getTeamPositions, getAllMembers
- `lib/profiles/schemas.ts` - Zod schemas for profile update and notification preferences
- `lib/profiles/actions.ts` - updateOwnProfile, updateNotificationPreferences, updateAvatarUrl, adminUpdateMemberProfile
- `lib/profiles/queries.ts` - getOwnProfile, getMemberProfile, getMembersByTeam

## Decisions Made
- Used Zod v4 `.issues` property instead of `.errors` for validation error access (v4 API change)
- Position categories stored as free-form text with CHECK constraints, not Postgres enums (ministry-agnostic per TEAM-05)
- Team lead authorization checks `team_members.role = 'lead'` per-team, not global roles table (per Pitfall 2 guidance)
- Profile upsert pattern handles existing 350+ members with no profile rows (per Pitfall 5 guidance)
- Avatars bucket set to public for simplified URL handling without signed URLs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 uses .issues instead of .errors on ZodError**
- **Found during:** Overall verification (pnpm build)
- **Issue:** Zod v4 renamed `ZodError.errors` to `ZodError.issues`, causing TypeScript compilation failure
- **Fix:** Replaced all `parsed.error.errors[0]` with `parsed.error.issues[0]` in both action files
- **Files modified:** lib/teams/actions.ts, lib/profiles/actions.ts
- **Verification:** `pnpm build` compiles successfully
- **Committed in:** `750644f`

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor API naming change in Zod v4. No scope creep.

## Issues Encountered
None beyond the Zod v4 deviation above.

## User Setup Required
None - no external service configuration required. Migrations are SQL files to be applied to the existing Supabase project.

## Next Phase Readiness
- Data foundation complete for Phase 2 UI plans (02-02, 02-03, 02-04)
- All server actions and query functions exported and typed for UI consumption
- Team management UI (02-02) can import from lib/teams/ directly
- Profile editing UI (02-03) can import from lib/profiles/ directly
- Roster view (02-04) can use getTeams(), getAllMembers(), getMemberProfile()

## Self-Check: PASSED

- 8/8 files found
- 4/4 commits found
- pnpm build: passed
- pnpm lint (new files): no errors

---
*Phase: 02-teams-and-member-profiles*
*Completed: 2026-02-13*
