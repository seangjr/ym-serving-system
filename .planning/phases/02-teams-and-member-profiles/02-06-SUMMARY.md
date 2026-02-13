---
phase: 02-teams-and-member-profiles
plan: 06
subsystem: ui
tags: [responsive-table, ux-improvement, position-management, dialog-labels]

# Dependency graph
requires:
  - phase: 02-teams-and-member-profiles (plans 01-04)
    provides: Team roster page, position manager, skill editing dialog
provides:
  - Responsive table/card layout for team roster page
  - Improved skill assignment dialog with clear labels
  - Simplified position forms without quantity_needed
affects: [02-07-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Responsive table (desktop md+) / card (mobile) dual layout for roster pages"
    - "Descriptive dialog labels with helper text for form dropdowns"

key-files:
  created: []
  modified:
    - app/(app)/team-roster/page.tsx
    - components/teams/team-member-list.tsx
    - components/teams/position-manager.tsx
    - lib/teams/schemas.ts
    - lib/teams/actions.ts

key-decisions:
  - "Desktop table uses Link-wrapped rows for member navigation (not onClick with router.push)"
  - "quantityNeeded removed entirely from schemas rather than made optional -- DB column default of 1 handles it"

patterns-established:
  - "Roster table: server-component Table with clickable Link rows and group-hover:underline"
  - "Form helper text: text-xs text-muted-foreground below selects for context"

# Metrics
duration: 4min
completed: 2026-02-13
---

# Phase 2 Plan 6: Teams UX Gap Closure Summary

**Responsive table/card roster layout, "Assign Positions" dialog with descriptive labels, and simplified position forms without quantity field**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-13T15:58:35Z
- **Completed:** 2026-02-13T16:03:23Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Team roster page now shows a full table with Member/Teams/Positions columns on desktop (md+) and card grid on mobile
- "Edit Skills" renamed to "Assign Positions" with explanatory dialog description and labeled dropdowns ("Experience Level" / "Willingness")
- Position create/edit forms simplified to Name + Category only (quantity_needed removed from UI, schemas, and actions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add responsive table layout to team roster page** - `fa05172` (feat)
2. **Task 2: Improve Edit Skills dialog UX and remove quantity_needed from positions** - `a7d95ab` (feat)

## Files Created/Modified
- `app/(app)/team-roster/page.tsx` - Added desktop table layout with RosterTableRow component, kept mobile card grid
- `components/teams/team-member-list.tsx` - Renamed dialog to "Assign Positions", added descriptive labels and helper text for proficiency/preference dropdowns
- `components/teams/position-manager.tsx` - Removed quantity_needed from AddPositionForm, EditPositionForm, and PositionRow display
- `lib/teams/schemas.ts` - Removed quantityNeeded from createPositionSchema and updatePositionSchema
- `lib/teams/actions.ts` - Removed quantity_needed from position insert and update mapping

## Decisions Made
- Desktop table uses `<Link>` wrapping within `<TableCell>` for member navigation rather than `onClick` with `router.push` -- keeps the roster page as a server component
- Removed quantityNeeded entirely from Zod schemas (not just made optional) since the DB column has a default value of 1 and the field is not exposed in the UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 UAT gaps (Gap 3, 4, 6) addressed in this plan
- Ready for remaining gap closure plans (02-07)

## Self-Check: PASSED

All 5 modified files verified on disk. Both task commits (fa05172, a7d95ab) verified in git log.

---
*Phase: 02-teams-and-member-profiles*
*Completed: 2026-02-13*
