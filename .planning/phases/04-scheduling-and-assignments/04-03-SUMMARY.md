---
phase: 04-scheduling-and-assignments
plan: 03
subsystem: ui, api
tags: [react, dialog, template, scheduling, dashboard, service-stats, server-actions]

# Dependency graph
requires:
  - phase: 04-scheduling-and-assignments
    plan: 01
    provides: "schedule_templates table, saveTemplate/loadTemplate/deleteTemplate server actions, getTemplates query"
  - phase: 04-scheduling-and-assignments
    plan: 02
    provides: "service detail page with assignment panel, PositionAdder, ServiceDetailActions component"
  - phase: 03-services-and-calendar
    provides: "dashboard page with ServiceStats component, getServiceStats query"
provides:
  - "SaveTemplateDialog for saving service position configurations as named templates"
  - "LoadTemplateDialog for browsing, loading, and deleting templates"
  - "Template buttons integrated into service detail action bar"
  - "Dashboard stats with real unassigned position and pending confirmation counts"
affects: [05-availability, 06-accept-decline]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-action-wrapper-for-client-queries, template-team-filter-ui, contextual-stats-labels]

key-files:
  created:
    - app/(app)/services/[serviceId]/template-dialog.tsx
  modified:
    - app/(app)/services/[serviceId]/service-detail-actions.tsx
    - app/(app)/services/[serviceId]/page.tsx
    - lib/assignments/actions.ts
    - lib/services/queries.ts
    - components/services/service-stats.tsx

key-decisions:
  - "fetchTemplates server action wraps getTemplates query for client component consumption (avoids server-only import in 'use client' module)"
  - "Template list fetched on dialog open rather than passed from page to avoid stale data after save/delete"
  - "Dashboard stats use multi-step query: fetch upcoming service IDs, then count positions and assignments separately"

patterns-established:
  - "Server action wrapper pattern for client-side data fetching: export async function fetchX() { return getX(); }"
  - "Template filter UX: team selector at top, scrollable template list below, selection highlight with primary border"
  - "Contextual stats labels: 'All positions filled' vs 'Positions needing members' based on count"

# Metrics
duration: 4min
completed: 2026-02-14
---

# Phase 4 Plan 3: Template Save/Load Dialogs and Real Dashboard Stats Summary

**Template save/load workflow with team-scoped browsing and dashboard stats showing real unassigned positions and pending confirmations from service_assignments**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-14T07:30:38Z
- **Completed:** 2026-02-14T07:34:57Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built SaveTemplateDialog with name/description/team form using react-hook-form + zodResolver
- Built LoadTemplateDialog with team filter, selectable template list, delete functionality, and position-replace warning
- Integrated Save as Template and Load Template buttons into service detail action bar
- Replaced hardcoded dashboard stats (0/0) with real queries against service_positions and service_assignments tables

## Task Commits

Each task was committed atomically:

1. **Task 1: Build template save/load dialogs and integrate into service detail page** - `b0c0b5e` (feat)
2. **Task 2: Update dashboard stats with real assignment data** - `306cf9c` (feat)

## Files Created/Modified
- `app/(app)/services/[serviceId]/template-dialog.tsx` - SaveTemplateDialog and LoadTemplateDialog client components
- `app/(app)/services/[serviceId]/service-detail-actions.tsx` - Added Save as Template and Load Template buttons with dialog state
- `app/(app)/services/[serviceId]/page.tsx` - Pass teams and teamsWithPositions props to ServiceDetailActions
- `lib/assignments/actions.ts` - Added fetchTemplates server action wrapper for client-side template fetching
- `lib/services/queries.ts` - Updated getServiceStats with real position/assignment count queries
- `components/services/service-stats.tsx` - Updated labels from placeholder text to contextual descriptions

## Decisions Made
- Created `fetchTemplates` server action as a thin wrapper around `getTemplates` query, since client components cannot directly import server-only query functions that use `createClient()` from supabase/server
- Templates are fetched on dialog open via the server action rather than pre-fetched in the page, to ensure fresh data after save/delete operations
- Dashboard stats use a multi-step approach: (1) fetch upcoming service IDs, (2) count total positions, (3) count assignments via inner join on service_positions, (4) subtract for unassigned count -- avoids complex PostgREST limitations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created fetchTemplates server action wrapper**
- **Found during:** Task 1 (template dialog implementation)
- **Issue:** Plan suggested importing `getTemplates` from `lib/assignments/queries.ts` directly in the client component, but `getTemplates` uses `createClient()` from `@/lib/supabase/server` which requires server context (cookies)
- **Fix:** Added `fetchTemplates` server action in `lib/assignments/actions.ts` as a thin wrapper that calls `getTemplates()`
- **Files modified:** lib/assignments/actions.ts, app/(app)/services/[serviceId]/template-dialog.tsx
- **Verification:** `pnpm build` passes, template fetching works through server action
- **Committed in:** b0c0b5e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Server action wrapper necessary for client/server boundary. No scope creep.

## Issues Encountered
None - all planned functionality implemented successfully.

## User Setup Required
None - no external service configuration required. Database migration from Plan 01 must be applied (if not already done).

## Next Phase Readiness
- Phase 4 complete: all three plans (schema, assignment UI, template UI + stats) delivered
- Templates can be saved, browsed/filtered, loaded, and deleted
- Dashboard shows real-time assignment metrics
- Ready for Phase 5 (Availability) or Phase 6 (Accept/Decline)

## Self-Check: PASSED

All 1 created file, 5 modified files, 2 commit hashes, and SUMMARY.md verified on disk.

---
*Phase: 04-scheduling-and-assignments*
*Completed: 2026-02-14*
