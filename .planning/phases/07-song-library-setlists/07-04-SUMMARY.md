---
phase: 07-song-library-setlists
plan: 04
subsystem: ui
tags: [react, optimistic-ui, dnd-kit, sorting, popover, radix-ui]

# Dependency graph
requires:
  - phase: 07-song-library-setlists
    provides: "Song table, filter chips, setlist panel and item row components"
provides:
  - "Stable fixed-width song table with client-side sorting on 4 columns"
  - "Compact Filters popover replacing space-wasting inline filter chips"
  - "Optimistic UI for setlist drag-reorder and key/tempo override/reset"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "table-fixed layout with max-w constraints for stable column widths"
    - "SortableHeader sub-component with null->asc->desc->null cycling"
    - "Popover-based filter UI with Select dropdowns and active badges"
    - "Optimistic local state (useState + useEffect sync) for list reordering"
    - "onOptimisticUpdate callback pattern for parent-child optimistic updates"

key-files:
  created:
    - "app/(app)/songs/song-filters.tsx"
  modified:
    - "app/(app)/songs/song-table.tsx"
    - "app/(app)/songs/page.tsx"
    - "app/(app)/services/[serviceId]/setlist-panel.tsx"
    - "app/(app)/services/[serviceId]/setlist-item-row.tsx"

key-decisions:
  - "Nulls-last sorting for artist/key/tempo columns (nulls always sort to bottom regardless of direction)"
  - "Radix Select with __all__ sentinel value for clearing filter (Radix Select cannot have empty string value)"
  - "Optimistic update via parent callback rather than useOptimistic (simpler for multi-field updates)"

patterns-established:
  - "SortableHeader: reusable clickable column header with sort direction icon cycling"
  - "Optimistic list reorder: setLocalItems before startTransition, revert items on error"
  - "onOptimisticUpdate callback: child notifies parent of field changes for immediate local state update"

requirements-completed: [SONG-02, SONG-03, SONG-04]

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 7 Plan 4: Gap Closure Summary

**Fixed song table column widths with client-side sorting, compact popover-based filters, and optimistic UI for setlist operations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-27T06:52:49Z
- **Completed:** 2026-02-27T06:56:40Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Song table uses table-fixed layout with max-w constraints and truncation on Title/Artist/Tags columns -- no more shifting as data varies
- Four sortable columns (Title, Artist, Key, Tempo) with clickable headers cycling through asc/desc/none with appropriate icons
- Filters button with popover replaces inline chips, reducing vertical space from ~60-80px to a single row alongside the search bar
- Active filters displayed as removable Badge components with X icon below the Filters button
- Setlist drag-and-drop reorder updates visually before server confirms, reverts on error
- Key/tempo overrides and resets reflect instantly via onOptimisticUpdate callback pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Stabilize song table columns and add client-side sorting** - `b03c57b` (feat)
2. **Task 2: Replace inline filter chips with compact Filters popover** - `d95fb57` (feat)
3. **Task 3: Add optimistic UI to setlist operations** - `4d53630` (feat)

## Files Created/Modified
- `app/(app)/songs/song-table.tsx` - Added table-fixed, max-w constraints, SortableHeader, useMemo sorting
- `app/(app)/songs/song-filters.tsx` - New client component with Popover, Select dropdowns, active badges
- `app/(app)/songs/page.tsx` - Replaced FilterChips import with SongFilters, same-row layout
- `app/(app)/services/[serviceId]/setlist-panel.tsx` - Added localItems state, optimistic drag reorder, handleOptimisticUpdate callback
- `app/(app)/services/[serviceId]/setlist-item-row.tsx` - Added onOptimisticUpdate prop, optimistic key/tempo/reset handlers with revert

## Decisions Made
- Used nulls-last sorting: null values always appear at the bottom regardless of sort direction (better UX for incomplete data)
- Used `__all__` sentinel value for Select "All Keys"/"All Tags" option since Radix Select does not support empty string values
- Chose parent callback pattern (onOptimisticUpdate) over React 19 useOptimistic hook because multi-field partial updates are simpler with direct state mutation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 UAT issues from Phase 7 tests are resolved
- Phase 7 (Song Library & Setlists) gap closure complete
- Ready to proceed to Phase 8

## Self-Check: PASSED

All 5 modified/created files verified on disk. All 3 task commits verified in git log.

---
*Phase: 07-song-library-setlists*
*Completed: 2026-02-27*
