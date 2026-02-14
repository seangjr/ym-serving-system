---
phase: 04-scheduling-and-assignments
plan: 02
subsystem: ui
tags: [react, combobox, base-ui, collapsible, assignment, scheduling, conflict-dialog, position-management]

# Dependency graph
requires:
  - phase: 04-scheduling-and-assignments
    plan: 01
    provides: "service_positions, service_assignments tables; lib/assignments module with queries/actions/types"
  - phase: 03-services-and-calendar
    provides: "service detail page at /services/[serviceId]"
  - phase: 02-teams-and-member-profiles
    provides: "serving_teams, team_positions, team_members tables and queries"
provides:
  - "AssignmentPanel component with team/category grouping and Collapsible sections"
  - "AssignmentSlot component with combobox assignment, status badges, conflict warnings"
  - "ConflictDialog for scheduling conflict confirmation with force-assign"
  - "PositionAdder and InlinePositionAdder for per-service position management"
  - "Service detail page now renders full assignment UI replacing Phase 4 placeholder"
affects: [04-03-template-ui, 05-availability, 06-accept-decline]

# Tech tracking
tech-stack:
  added: []
  patterns: [combobox-object-values-for-filtering, inline-position-adder-per-team, collapsible-category-grouping, useTransition-server-actions]

key-files:
  created:
    - app/(app)/services/[serviceId]/assignment-panel.tsx
    - app/(app)/services/[serviceId]/assignment-slot.tsx
    - app/(app)/services/[serviceId]/conflict-dialog.tsx
    - app/(app)/services/[serviceId]/position-adder.tsx
  modified:
    - app/(app)/services/[serviceId]/page.tsx
    - lib/assignments/queries.ts
    - lib/assignments/types.ts

key-decisions:
  - "Combobox uses object values {value, label} for automatic base-ui search filtering on member names"
  - "InlinePositionAdder per team card plus standalone PositionAdder for adding to any team"
  - "Status badge colours: amber for pending, green for confirmed, red for declined"
  - "Conflict warning uses persistent AlertTriangle icon with Tooltip on assigned slots"

patterns-established:
  - "base-ui Combobox with object values: use { value, label } shape for automatic text filtering"
  - "Inline per-team-card position adder pattern: InlinePositionAdder inside CardContent"
  - "Position removal with conditional confirmation: immediate for unassigned, AlertDialog for assigned"
  - "Notes input with debounced save via useRef timeout"

# Metrics
duration: 7min
completed: 2026-02-14
---

# Phase 4 Plan 2: Assignment UI with Combobox Slots, Conflict Detection, and Position Management Summary

**Full assignment panel with team/category grouping, combobox-per-slot member assignment with conflict warnings, status badges, position add/remove, and per-assignment notes**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-14T07:20:24Z
- **Completed:** 2026-02-14T07:27:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Replaced Phase 4 placeholder with complete assignment panel on service detail page
- Built AssignmentSlot with two states: unassigned (dashed border + combobox) and assigned (member name + status badge + conflict icon)
- Created ConflictDialog for scheduling conflict confirmation with force-assign option
- Implemented inline per-team PositionAdder and standalone PositionAdder with category-grouped position selection
- Position removal with conditional confirmation: immediate for unassigned, AlertDialog warning for assigned positions

## Task Commits

Each task was committed atomically:

1. **Task 1: Build AssignmentPanel and AssignmentSlot components** - `c621972` (feat)
2. **Task 2: Build PositionAdder and position removal with assignment warnings** - `d1d950b` (feat)

## Files Created/Modified
- `app/(app)/services/[serviceId]/assignment-panel.tsx` - Main panel with team cards, Collapsible category groups, inline position adder
- `app/(app)/services/[serviceId]/assignment-slot.tsx` - Individual slot with combobox assignment, status badges, notes, unassign, remove
- `app/(app)/services/[serviceId]/conflict-dialog.tsx` - AlertDialog for scheduling conflict confirmation
- `app/(app)/services/[serviceId]/position-adder.tsx` - Standalone and inline position adder with category-grouped select
- `app/(app)/services/[serviceId]/page.tsx` - Updated to fetch assignment data and render AssignmentPanel
- `lib/assignments/queries.ts` - Added getTeamsForAssignment query
- `lib/assignments/types.ts` - Added TeamForAssignment interface

## Decisions Made
- Used base-ui Combobox with object values `{ value, label, hasConflict }` instead of string IDs -- enables automatic search filtering by member name via the `label` field
- Created two PositionAdder variants: InlinePositionAdder (single-team, inside team card) and PositionAdder (multi-team, standalone) for different contexts
- Status badge colours follow plan specification: amber-pending, green-confirmed, red-declined with dark mode variants
- Persistent conflict warning uses AlertTriangle icon with Tooltip (not just in combobox dropdown)
- Notes input uses debounced save (500ms timeout via useRef) rather than explicit save button

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Combobox textValue prop type error**
- **Found during:** Task 1 (AssignmentSlot component)
- **Issue:** base-ui ComboboxItem does not have a `textValue` prop; using string values for member IDs prevented search filtering
- **Fix:** Changed to object values `{ value, label, hasConflict }` which base-ui automatically uses for filtering
- **Files modified:** app/(app)/services/[serviceId]/assignment-slot.tsx
- **Verification:** `pnpm build` passes, search filtering works via label field
- **Committed in:** c621972 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** API adaptation necessary for base-ui Combobox compatibility. No scope creep.

## Issues Encountered
None - all planned functionality implemented successfully.

## User Setup Required
None - no external service configuration required. Database migration from Plan 01 must be applied.

## Next Phase Readiness
- Assignment UI complete, ready for Plan 03 (template management UI)
- All server actions from Plan 01 consumed by the new UI components
- Template save/load/delete actions available for Plan 03 integration

## Self-Check: PASSED

All 4 created files, 3 modified files, 2 commit hashes, and SUMMARY.md verified on disk.

---
*Phase: 04-scheduling-and-assignments*
*Completed: 2026-02-14*
