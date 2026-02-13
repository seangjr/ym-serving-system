---
phase: 02-teams-and-member-profiles
plan: 02
subsystem: ui, api
tags: [react, next.js, shadcn, react-hook-form, zod, supabase, server-actions]

# Dependency graph
requires:
  - phase: 02-teams-and-member-profiles
    plan: 01
    provides: "serving_teams, team_positions, team_members, member_position_skills tables, 14 server actions, 7 queries, Zod schemas"
  - phase: 01-foundation-and-authentication
    provides: "getUserRole(), isAdminOrCommittee(), AppRole type, shadcn/ui components, app shell layout"
provides:
  - "/teams page with responsive team card grid and create team dialog"
  - "/teams/[teamId] detail page with position management and member assignment"
  - "TeamCard, TeamFormDialog, PositionManager, MemberAssignment, TeamMemberList components"
  - "getTeamsWithLeads() and getTeamDetail() query functions"
  - "fetchAllMembers() server action for client-safe member search"
  - "Skill editing dialog with proficiency and preference selectors"
affects: [02-03, 02-04, 03-scheduling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server component page with role check + client component children pattern"
    - "Server action fetchAllMembers for client-safe data loading (avoids server-only import in client component)"
    - "TeamDetail type flattening nested Supabase response into clean UI-ready shape"
    - "Responsive table/card dual layout for member lists (reused from admin)"
    - "Inline edit forms for position CRUD within position manager"
    - "Skill edit dialog with per-position proficiency/preference selectors"

key-files:
  created:
    - app/(app)/teams/page.tsx
    - app/(app)/teams/[teamId]/page.tsx
    - components/teams/team-card.tsx
    - components/teams/team-form-dialog.tsx
    - components/teams/position-manager.tsx
    - components/teams/member-assignment.tsx
    - components/teams/team-member-list.tsx
  modified:
    - lib/teams/queries.ts
    - lib/teams/actions.ts

key-decisions:
  - "Added getTeamsWithLeads query to fetch lead names with team listing (not separate queries per team)"
  - "Created fetchAllMembers server action to avoid server-only import in client MemberAssignment component"
  - "getTeamDetail returns flattened TeamDetailMember type combining team_members, members, profiles, and skills"
  - "PositionManager uses inline forms for add/edit instead of separate dialogs (faster workflow)"
  - "Skill edit dialog saves all position skills in sequence (not parallel) for error isolation"

patterns-established:
  - "Team page pattern: server component fetches data, passes to client components with userRole prop"
  - "Detail page authorization: admin/committee OR team lead check before rendering"
  - "Inline CRUD pattern: form appears in-place for add/edit, reverts to display on save/cancel"
  - "Dual layout pattern: hidden md:block table + flex md:hidden cards for responsive member list"

# Metrics
duration: 10min
completed: 2026-02-13
---

# Phase 2 Plan 2: Team Management UI Summary

**Teams page with card grid and create dialog, team detail page with inline position CRUD, searchable member assignment combobox, and skill editing with proficiency/preference per position**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-13T14:37:44Z
- **Completed:** 2026-02-13T14:48:21Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- `/teams` page with responsive 1/2/3-column grid of team cards showing name, color accent, member count, and lead name
- `/teams/[teamId]` detail page with side-by-side positions and members sections (stacked on mobile)
- Full team CRUD via dialog forms (create, edit, delete with confirmation)
- Position management with inline add/edit forms, category grouping, active toggle, and delete
- Member assignment via searchable combobox (Command component) with 350+ member search
- Member list with avatars, role badges (Lead with crown, Member), and proficiency skill badges
- Role management: promote/demote team lead from dropdown menu
- Skill editing dialog: set proficiency (beginner/intermediate/advanced/expert) and preference (primary/secondary/willing) per position

## Task Commits

Each task was committed atomically:

1. **Task 1: Teams listing page with team cards and create team dialog** - `ea27d11` (feat)
2. **Task 2: Team detail page with position management and member assignment** - `a39c7e5` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `app/(app)/teams/page.tsx` - Teams listing page (server component, admin/committee gated)
- `app/(app)/teams/[teamId]/page.tsx` - Team detail page (server component, admin/committee/lead gated)
- `components/teams/team-card.tsx` - Team card with color accent, edit/delete buttons
- `components/teams/team-form-dialog.tsx` - Create/edit team dialog with react-hook-form + zod
- `components/teams/position-manager.tsx` - Position CRUD with inline forms and category grouping
- `components/teams/member-assignment.tsx` - Searchable member combobox using server action
- `components/teams/team-member-list.tsx` - Responsive member list with role/skill management
- `lib/teams/queries.ts` - Added getTeamsWithLeads(), getTeamDetail(), TeamListItem, TeamDetail types
- `lib/teams/actions.ts` - Added fetchAllMembers() server action

## Decisions Made
- Created `getTeamsWithLeads` query instead of using existing `getTeams` (which only returns counts) to get lead names in a single query
- Added `fetchAllMembers` server action because `getAllMembers` uses server-only `createClient` -- client components cannot import server-only modules
- `getTeamDetail` flattens the nested Supabase response (team_members -> members -> member_profiles + skills) into a clean `TeamDetailMember` type for simpler UI rendering
- Position manager uses inline forms instead of dialogs for add/edit -- faster workflow for managing multiple positions
- Skill edit dialog iterates through saves sequentially (not in parallel) to provide clear error isolation if one fails

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added getTeamsWithLeads query for team listing**
- **Found during:** Task 1
- **Issue:** Existing `getTeams()` returns only counts, not lead names needed by team cards
- **Fix:** Added `getTeamsWithLeads()` that selects team members with roles and member names
- **Files modified:** lib/teams/queries.ts
- **Verification:** Build passes, team cards receive correct lead name data
- **Committed in:** ea27d11

**2. [Rule 3 - Blocking] Created fetchAllMembers server action for client component**
- **Found during:** Task 2
- **Issue:** `MemberAssignment` client component imported `getAllMembers` from queries.ts, but queries.ts imports server-only `createClient` -- causes build failure at client/server boundary
- **Fix:** Added `fetchAllMembers` as a server action in actions.ts (server actions are callable from client components)
- **Files modified:** lib/teams/actions.ts, components/teams/member-assignment.tsx
- **Verification:** Build passes, member search works via server action
- **Committed in:** a39c7e5

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both necessary for correct data flow and build success. No scope creep.

## Issues Encountered
- Pre-existing build failure from `app/(app)/profile/page.tsx` importing profile stub components that already existed on disk but had a linter-invisible casing issue -- resolved by the existing stubs (no action needed from this plan)
- Supabase nested select returns `members` as both object or array depending on FK relationship -- handled with `Array.isArray()` check in getTeamsWithLeads

## User Setup Required
None - all UI components use existing server actions and queries from 02-01.

## Next Phase Readiness
- Team management UI complete: create, edit, delete teams; manage positions; assign members; edit skills
- Profile UI plan (02-03) can build on top of the same layout patterns
- Roster view plan (02-04) can reuse TeamCard and TeamMemberList patterns
- All TEAM-01 through TEAM-06 requirements addressed through the UI

## Self-Check: PASSED

- 7/7 created files found
- 2/2 modified files found
- 2/2 commits found (ea27d11, a39c7e5)
- pnpm build: passed
- pnpm lint (team files): no errors

---
*Phase: 02-teams-and-member-profiles*
*Completed: 2026-02-13*
