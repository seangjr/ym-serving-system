---
phase: 02-teams-and-member-profiles
plan: 04
subsystem: ui, api
tags: [react, next.js, shadcn, supabase, search, roster, profiles]

# Dependency graph
requires:
  - phase: 02-teams-and-member-profiles
    plan: 01
    provides: "serving_teams, team_members, team_positions, member_position_skills, member_profiles tables, getMemberProfile query, getTeams query"
  - phase: 02-teams-and-member-profiles
    plan: 02
    provides: "Team management UI patterns, TeamMemberList component, getTeamsWithLeads query"
  - phase: 02-teams-and-member-profiles
    plan: 03
    provides: "Profile page patterns, position-preferences badge color system, avatar display pattern"
provides:
  - "/team-roster page with searchable responsive member grid and team filter chips"
  - "/members/[memberId] profile view page with contact info, teams, and skills"
  - "getTeamRoster() query with !inner join for serving-members-only filtering"
  - "RosterSearch client component with debounced URL-param-based filtering"
  - "RosterMemberCard with avatar, team badges, position/skill chips, link to profile"
  - "MemberProfileView component with 2-column layout for viewing other members"
affects: [03-scheduling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "URL-based search with debounced client component and server component data fetch"
    - "Team filter chips as anchor tags for URL-param-based filtering (no client state)"
    - "Responsive grid: 1/2/3/4 columns via grid-cols-* breakpoints"
    - "Reusable proficiency/preference badge color maps across multiple components"

key-files:
  created:
    - app/(app)/team-roster/page.tsx
    - components/teams/roster-member-card.tsx
    - components/teams/roster-search.tsx
    - app/(app)/members/[memberId]/page.tsx
    - components/profiles/member-profile-view.tsx
  modified:
    - lib/teams/queries.ts

key-decisions:
  - "getTeamRoster uses !inner join on team_members to return only serving members (not all 350+ members)"
  - "Search filtering uses URL params (not client state) for shareable/bookmarkable search results"
  - "All authenticated users can view all profile fields (phone, contact) -- noted for future privacy restriction"
  - "Team filter chips use anchor tags (server component) for URL-based filtering without client JS"

patterns-established:
  - "URL-param search pattern: debounced client input -> URL replace -> server component re-render"
  - "Profile view pattern: server component fetches data, renders read-only layout with back navigation"
  - "Badge color consistency: PROFICIENCY_STYLES and PREFERENCE_STYLES maps shared across roster cards, profile views, position preferences"

# Metrics
duration: 4min
completed: 2026-02-13
---

# Phase 2 Plan 4: Team Roster & Member Profile View Summary

**Searchable team roster page with responsive member grid, team filter chips, and member profile view page showing contact info, teams, and position skills**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-13T14:51:20Z
- **Completed:** 2026-02-13T14:55:41Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- `/team-roster` page with responsive 1/2/3/4-column member grid, team filter chips, and search by name/email
- `/members/[memberId]` profile view page with 2-column layout showing avatar, contact info, teams, and skills
- `getTeamRoster()` query with `!inner` join ensures only serving members (team members) appear in roster
- Debounced search with URL params for shareable/bookmarkable filtered results
- Consistent badge color system across all components (proficiency + preference)

## Task Commits

Each task was committed atomically:

1. **Task 1: Team roster page with search and member cards** - `d81b2f8` (feat)
2. **Task 2: Member profile view page** - `99755c9` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `app/(app)/team-roster/page.tsx` - Server component with search, team filters, responsive member grid
- `components/teams/roster-member-card.tsx` - Clickable member card with avatar, team badges, position chips
- `components/teams/roster-search.tsx` - Debounced search input with URL param updates
- `app/(app)/members/[memberId]/page.tsx` - Server component with getMemberProfile, notFound, back link
- `components/profiles/member-profile-view.tsx` - 2-column profile layout with contact, teams, skills
- `lib/teams/queries.ts` - Added RosterMember type and getTeamRoster() query with !inner join

## Decisions Made
- Used `!inner` join on `team_members` in getTeamRoster to return only serving members (members on at least one team), excluding the full 350+ member list
- Search uses URL params (`?q=...&team=...`) rather than client state, enabling shareable and bookmarkable search results
- All authenticated users can see all profile fields including phone and emergency contact -- added code comment noting this can be restricted to admin/committee/same-team in a future iteration
- Team filter chips are server-rendered anchor tags (not client components) for simplicity and zero JS overhead

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - all UI components use existing server actions and queries from prior plans.

## Next Phase Readiness
- Phase 2 fully complete: all TEAM-01 through TEAM-06 and PROF-01 through PROF-07 requirements addressed
- Team roster enables quick member lookup for scheduling workflows (Phase 3)
- Member profile view provides context when assigning members to positions (Phase 3)
- Navigation already includes "Team Roster" link for admin/committee roles

## Self-Check: PASSED

- 5/5 created files found
- 1/1 modified files found
- 2/2 commits found (d81b2f8, 99755c9)
- pnpm build: passed
- pnpm lint (new files): no errors

---
*Phase: 02-teams-and-member-profiles*
*Completed: 2026-02-13*
