---
phase: 05-availability-management
plan: 01
subsystem: database, api
tags: [supabase, postgres, rls, zod, date-fns, recurrence, availability, server-actions]

# Dependency graph
requires:
  - phase: 04-scheduling-and-assignments
    provides: "canManageTeamAssignments auth pattern, server action structure, getUserRole, createAdminClient"
  - phase: 03-services-and-calendar
    provides: "generateRecurringDates pattern in lib/services/recurrence.ts, date-fns usage patterns"
provides:
  - "member_blackout_dates and member_recurring_unavailability database tables with RLS"
  - "lib/availability module: types, schemas, recurrence, queries, actions"
  - "getUnavailableMembersForDate batch query for scheduling integration"
  - "expandRecurringPatterns for team overlay calendar"
  - "Sidebar nav with Availability item for all roles"
affects: [05-02 availability-ui, 05-03 scheduling-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Recurring pattern matching (weekly, biweekly, monthly, nth_weekday) via pure functions"
    - "canManageForMember auth pattern: self always, admin/committee always, team lead for shared-team members"
    - "Batch unavailability check: two queries (blackouts + recurring) then app-level pattern matching"

key-files:
  created:
    - supabase/migrations/00008_availability.sql
    - lib/availability/types.ts
    - lib/availability/schemas.ts
    - lib/availability/recurrence.ts
    - lib/availability/queries.ts
    - lib/availability/actions.ts
  modified:
    - lib/auth/roles.ts

key-decisions:
  - "canManageForMember: separated from canManageTeamAssignments since availability auth checks member-level (not service-position-level)"
  - "Recurring pattern end_date boundary checks done in both matchesRecurringPattern and query-level filters for defense in depth"
  - "Sidebar nav: Availability placed after Team Roster (admin) and after My Schedule (member) with CalendarOff icon"

patterns-established:
  - "Pure recurrence module: matchesRecurringPattern and expandRecurringPatterns have zero server/DB deps, importable in client components"
  - "Availability auth pattern: canManageForMember checks self, admin/committee, then team lead via team_members join"

# Metrics
duration: 4min
completed: 2026-02-15
---

# Phase 5 Plan 01: Availability Schema & Lib Module Summary

**Two availability tables (blackout dates + recurring patterns) with RLS, complete lib/availability module (types, schemas, recurrence, queries, actions), and sidebar nav update**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-15T14:35:25Z
- **Completed:** 2026-02-15T14:39:15Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created member_blackout_dates and member_recurring_unavailability tables with CHECK constraints, indexes, RLS SELECT policies, and updated_at trigger
- Built pure recurrence matching module supporting weekly, biweekly, monthly, and nth_weekday patterns with 184-day expansion safety cap
- Implemented 6 query functions including getUnavailableMembersForDate (batch check for scheduling) and getTeamAvailability (overlay calendar)
- Implemented 5 server actions with Zod validation and canManageForMember authorization (self/admin/committee/team-lead)
- Added Availability sidebar nav item with CalendarOff icon for admin, committee, and member roles

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration and lib/availability module (types, schemas, recurrence)** - `8a77c14` (feat)
2. **Task 2: Query functions, server actions, and sidebar nav update** - `76c8afc` (feat)

## Files Created/Modified
- `supabase/migrations/00008_availability.sql` - Two availability tables with RLS, indexes, constraints, and trigger
- `lib/availability/types.ts` - TypeScript interfaces: BlackoutDate, RecurringPattern, UnavailableMember, TeamDateAvailability, RecurringFrequency
- `lib/availability/schemas.ts` - Zod schemas: addBlackoutSchema, addBlackoutRangeSchema, createRecurringPatternSchema, deleteBlackoutSchema, deleteRecurringPatternSchema
- `lib/availability/recurrence.ts` - Pure functions: matchesRecurringPattern, expandRecurringPatterns, getNthOccurrenceInMonth, isLastOccurrenceInMonth
- `lib/availability/queries.ts` - Query functions: getMyBlackouts, getMyRecurringPatterns, getMemberBlackouts, getMemberRecurringPatterns, getUnavailableMembersForDate, getTeamAvailability
- `lib/availability/actions.ts` - Server actions: addBlackoutDate, addBlackoutRange, deleteBlackout, createRecurringPattern, deleteRecurringPattern
- `lib/auth/roles.ts` - Added Availability nav item to ADMIN_NAV_ITEMS and MEMBER_NAV_ITEMS

## Decisions Made
- Separated canManageForMember from canManageTeamAssignments: availability auth checks at member-level (not service-position-level), with simpler team lead check via team_members join
- Recurring pattern end_date boundary checks done in both matchesRecurringPattern (pure function) and query-level filters for defense in depth
- Sidebar nav: Availability placed after Team Roster (admin/committee) and after My Schedule (member), grouping scheduling-related items together

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migration file ready to apply via `supabase db push`.

## Next Phase Readiness
- lib/availability module complete -- Plan 02 (availability UI) can build page components using these queries and actions
- getUnavailableMembersForDate ready for Plan 03 (scheduling integration) to extend getEligibleMembers
- expandRecurringPatterns ready for team overlay calendar in Plan 02

---
*Phase: 05-availability-management*
*Completed: 2026-02-15*
