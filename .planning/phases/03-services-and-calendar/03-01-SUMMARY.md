---
phase: 03-services-and-calendar
plan: 01
subsystem: database, api
tags: [supabase, postgres, rls, zod, date-fns, recurrence, server-actions]

# Dependency graph
requires:
  - phase: 01-foundation-and-authentication
    provides: "Auth infrastructure (getUserRole, isAdmin, isAdminOrCommittee, createAdminClient, createClient)"
  - phase: 02-teams-and-member-profiles
    provides: "members table FK target for created_by columns"
provides:
  - "service_types table with 4 seeded types (sunday-morning, sunday-evening, wednesday, special-event)"
  - "services table with date, time, rehearsal, recurrence, and cancellation fields"
  - "service_recurrence_patterns table for weekly/biweekly/monthly generation"
  - "Zod validation schemas for all service inputs"
  - "RLS-protected query functions for month-range, upcoming, by-ID, types, and stats"
  - "Role-authorized server actions for full service CRUD, duplication, recurring generation, and type management"
  - "Pure recurring date generation utility (generateRecurringDates)"
affects: [03-02, 03-03, 04-assignments, 06-notifications, 07-setlists]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Service module pattern (schemas + queries + actions + utility)", "Recurring date generation with safety cap", "Snake_case DB mapping in update actions"]

key-files:
  created:
    - supabase/migrations/00005_services.sql
    - lib/services/schemas.ts
    - lib/services/queries.ts
    - lib/services/actions.ts
    - lib/services/recurrence.ts
  modified: []

key-decisions:
  - "service_recurrence_patterns table created before services table to enable FK reference"
  - "Rehearsal fields reset to null on duplicateService (each duplicated service gets its own rehearsal schedule)"
  - "Service type management restricted to admin-only (not committee) to prevent proliferation"
  - "updateServiceTypeSchema added as serviceTypeSchema.partial().extend({ id }) for consistent partial-update pattern"

patterns-established:
  - "Service module follows lib/teams/ pattern: schemas.ts + queries.ts + actions.ts + domain utility"
  - "Date fields use DATE type (not TIMESTAMPTZ) for single-timezone church operations"
  - "Time fields use TIME type for service start/end and rehearsal times"
  - "Recurring date generation capped at 52 instances for safety"

# Metrics
duration: 3min
completed: 2026-02-14
---

# Phase 3 Plan 1: Services Data Foundation Summary

**Database schema (3 tables with RLS + seeds) and complete lib/services module with Zod schemas, query functions, 8 server actions, and recurring date generation capped at 52 instances**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-14T01:48:25Z
- **Completed:** 2026-02-14T01:51:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- SQL migration with service_types (4 seeded), services, and service_recurrence_patterns tables with RLS, indexes, and updated_at trigger
- Complete lib/services/ module with schemas, queries, actions, and recurrence utility following established lib/teams/ patterns
- Role-based authorization: admin/committee for service CRUD, admin-only for service type management
- Recurring date generation supporting weekly, biweekly, and monthly patterns with 52-instance safety cap

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for service_types, services, and service_recurrence_patterns** - `1c88302` (feat)
2. **Task 2: Service module -- Zod schemas, query functions, server actions, and recurrence logic** - `a929674` (feat)

## Files Created/Modified
- `supabase/migrations/00005_services.sql` - 3 tables, 4 seed types, RLS, indexes, updated_at trigger
- `lib/services/schemas.ts` - Zod schemas: serviceTypeSchema, createServiceSchema, updateServiceSchema, createRecurringSchema, duplicateServiceSchema + types
- `lib/services/queries.ts` - 5 query functions: getServicesByMonth, getUpcomingServices, getServiceById, getServiceTypes, getServiceStats
- `lib/services/actions.ts` - 8 server actions: createService, updateService, deleteService, duplicateService, createRecurringServices, createServiceType, updateServiceType, deleteServiceType
- `lib/services/recurrence.ts` - generateRecurringDates with weekly/biweekly/monthly support

## Decisions Made
- Created service_recurrence_patterns table before services table so the FK reference works without ALTER TABLE
- Rehearsal fields are reset to null on duplicateService -- each duplicated service should get its own rehearsal schedule
- Service type management restricted to admin-only (not committee) to prevent type proliferation
- Added updateServiceTypeSchema as a partial extension of serviceTypeSchema for consistent update patterns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. The SQL migration should be applied to Supabase via `supabase db push` or the Supabase dashboard.

## Next Phase Readiness
- Data layer is complete and ready for Phase 3 Plan 2 (Calendar UI) and Plan 3 (Service management pages)
- All query functions and server actions are exported and ready for UI consumption
- Service stats include placeholders for Phase 4 (unassignedPositions, pendingConfirmations)
- TODO comment in duplicateService marks future Phase 4 (assignments) and Phase 7 (setlist) copy behavior

## Self-Check: PASSED

All 5 created files verified. Both task commits (1c88302, a929674) found in git log.

---
*Phase: 03-services-and-calendar*
*Completed: 2026-02-14*
