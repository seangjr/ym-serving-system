---
phase: 05-availability-management
plan: 02
subsystem: ui
tags: [react, next.js, calendar, react-day-picker, tabs, availability, blackout, recurring-patterns, team-overlay]

# Dependency graph
requires:
  - phase: 05-availability-management
    plan: 01
    provides: "lib/availability module (types, schemas, recurrence, queries, actions), DB tables, sidebar nav"
  - phase: 03-services-and-calendar
    provides: "ServiceCalendar custom DayButton pattern, Calendar component"
  - phase: 02-teams-and-member-profiles
    provides: "fetchAllMembers server action pattern, team_members table structure"
provides:
  - "/availability page with interactive calendar for blackout date management"
  - "Custom AvailabilityDayButton with red (blackout) and hatched amber (recurring) visualization"
  - "BlackoutManager with view/single/range modes for CRUD operations"
  - "RecurringPatternDialog supporting all 4 frequency types"
  - "RecurringPatternList with human-readable descriptions and delete"
  - "TeamOverlayCalendar showing X/Y available counts per date with color coding"
  - "MemberSelector dropdown for team leads to manage other members"
  - "getManageableMembers and getTeamsForOverlay query functions"
  - "fetchTeamAvailability server action wrapper for client components"
affects: [05-03 scheduling-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AvailabilityCalendar context pattern: passing blackoutDates and recurringDates Maps into custom DayButton"
    - "Mode toggle UI: view/single/range segmented button group controlling calendar interaction mode"
    - "Team overlay DayButton: custom DayButton with Tooltip showing availability counts and unavailable member names"
    - "Server component page with parallel data fetching: blackouts, patterns, manageable members, teams"

key-files:
  created:
    - app/(app)/availability/page.tsx
    - app/(app)/availability/availability-calendar.tsx
    - app/(app)/availability/blackout-manager.tsx
    - app/(app)/availability/member-selector.tsx
    - app/(app)/availability/recurring-pattern-dialog.tsx
    - app/(app)/availability/recurring-pattern-list.tsx
    - app/(app)/availability/team-overlay-calendar.tsx
  modified:
    - lib/availability/queries.ts
    - lib/availability/actions.ts

key-decisions:
  - "AvailabilityCalendar renders in two modes (single/range) via conditional Calendar component rendering rather than single component with dynamic mode prop"
  - "Team lead detection uses team_members.role='lead' query at page level rather than a separate cached flag"
  - "fetchTeamAvailability uses dynamic import to avoid server-only import boundary issues in client components"

patterns-established:
  - "Availability calendar visualization: solid red bg for blackouts, hatched amber (repeating-linear-gradient) for recurring patterns"
  - "Mode toggle pattern: segmented button group (view/single/range) controlling component behavior without page navigation"
  - "Team overlay DayButton: showing counts below date number with color-coded text (green/amber/red) based on availability ratio"

# Metrics
duration: 7min
completed: 2026-02-15
---

# Phase 5 Plan 02: Availability UI Summary

**Interactive /availability page with calendar visualization (red blackouts, hatched amber recurring), mode-based blackout CRUD, recurring pattern dialog with 4 frequency types, and team overlay calendar showing X/Y available counts per date**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-15T14:41:50Z
- **Completed:** 2026-02-15T14:49:21Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Built complete /availability page with Tabs UI (My Availability + Team Overview) and role-based authorization for managing other members
- Created custom AvailabilityDayButton following ServiceCalendar pattern with visual distinction: solid red for blackouts, hatched amber gradient for recurring unavailability
- Implemented BlackoutManager with 3 interaction modes (view/single-click/range-select) and inline blackout list with delete
- Built RecurringPatternDialog with react-hook-form supporting all 4 frequency types (weekly, biweekly, monthly, nth_weekday) with live preview
- Created TeamOverlayCalendar with per-date availability counts, color-coded cells, and tooltip showing unavailable member names
- Added getManageableMembers and getTeamsForOverlay queries for member selector and team overlay data

## Task Commits

Each task was committed atomically:

1. **Task 1: Availability page, calendar component, blackout manager, member selector** - `3b0f865` (feat)
2. **Task 2: Recurring pattern dialog, pattern list, and team overlay calendar** - `68fc650` (feat)

## Files Created/Modified
- `app/(app)/availability/page.tsx` - Server component page with role-based data fetching, authorization, and Tabs layout
- `app/(app)/availability/availability-calendar.tsx` - Custom calendar with AvailabilityDayButton showing red/amber visual indicators
- `app/(app)/availability/blackout-manager.tsx` - Client component wrapping calendar with view/single/range modes and CRUD controls
- `app/(app)/availability/member-selector.tsx` - Select dropdown for team leads to switch between managing own vs team member availability
- `app/(app)/availability/recurring-pattern-dialog.tsx` - Dialog form for creating recurring patterns with all 4 frequency types and live preview
- `app/(app)/availability/recurring-pattern-list.tsx` - Card listing active recurring patterns with human-readable descriptions and delete
- `app/(app)/availability/team-overlay-calendar.tsx` - Team calendar showing X/Y available counts per date with color coding and tooltip
- `lib/availability/queries.ts` - Added getManageableMembers and getTeamsForOverlay query functions
- `lib/availability/actions.ts` - Added fetchTeamAvailability server action wrapper

## Decisions Made
- AvailabilityCalendar renders separate Calendar components for single vs range mode rather than dynamic mode prop -- avoids TypeScript union discrimination issues with react-day-picker's mode-dependent selected/onSelect types
- Team lead detection performed at page level via team_members.role='lead' query, not cached -- ensures fresh role data on each page load
- fetchTeamAvailability uses dynamic import (`await import("./queries")`) to cross the server-only import boundary, same pattern as fetchTemplates in Phase 4

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. All components use existing availability queries and actions from Plan 01.

## Next Phase Readiness
- Complete /availability UI ready for user interaction
- Plan 03 (scheduling integration) can now integrate availability checks into the scheduling workflow
- getUnavailableMembersForDate (from Plan 01) ready for scheduling page to show availability conflicts
- Team overlay calendar provides the foundation for scheduling decision support

## Self-Check: PASSED

All 9 files verified present on disk. Both task commits (3b0f865, 68fc650) verified in git log. Build passes with zero TypeScript errors. Biome lint passes on all availability files.

---
*Phase: 05-availability-management*
*Completed: 2026-02-15*
