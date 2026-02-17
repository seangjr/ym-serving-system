---
phase: 06-accept-decline-and-notifications
plan: 05
subsystem: database, api
tags: [supabase, postgres, pg_cron, reminders, notifications, cron, api-route]

# Dependency graph
requires:
  - phase: 06-accept-decline-and-notifications
    plan: 01
    provides: notifications table, notification types, createNotification pattern
  - phase: 04-scheduling-and-assignments
    provides: service_assignments, service_positions tables
  - phase: 02-teams-and-member-profiles
    provides: member_profiles table with reminder_days_before preference
provides:
  - generate_service_reminders() SQL function for daily reminder generation
  - pg_cron schedule for automated daily execution at 8 AM UTC
  - POST /api/reminders API route for manual/external cron trigger
affects: []

# Tech tracking
tech-stack:
  added: [pg_cron]
  patterns: [SQL function with API route fallback for cron-unavailable environments]

key-files:
  created:
    - supabase/migrations/00010_reminder_cron.sql
    - app/api/reminders/route.ts
  modified:
    - .env.local.example

key-decisions:
  - "pg_cron extension CREATE wrapped in DO block with exception handling for graceful fallback"
  - "API route authenticates via CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY Bearer token"
  - "generate_service_reminders uses SECURITY DEFINER to bypass RLS for cross-member notification inserts"

patterns-established:
  - "Cron fallback pattern: SQL function for core logic + API route for environments without pg_cron"
  - "External cron auth: CRON_SECRET env var for Vercel Cron / GitHub Actions integration"

requirements-completed: [NOTF-05]

# Metrics
duration: 2min
completed: 2026-02-17
---

# Phase 6 Plan 05: Reminder System Summary

**Daily reminder generation via SQL function with pg_cron scheduling and authenticated API route fallback for per-member configurable reminder_days_before**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T15:47:19Z
- **Completed:** 2026-02-17T15:50:13Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- generate_service_reminders() SQL function that creates reminder notifications based on each member's configured reminder_days_before preference
- Duplicate prevention via NOT EXISTS check on notifications table (same assignment never reminded twice)
- Skips declined assignments and cancelled services
- pg_cron scheduled at 8 AM UTC daily with graceful fallback when extension unavailable
- POST /api/reminders API route authenticated via CRON_SECRET or service role key for external cron services

## Task Commits

Each task was committed atomically:

1. **Task 1: Reminder SQL function and pg_cron schedule** - `3f6ee20` (feat)
2. **Task 2: API route fallback for reminder generation** - `ddfd19e` (feat)

## Files Created/Modified
- `supabase/migrations/00010_reminder_cron.sql` - generate_service_reminders() function + pg_cron schedule with graceful fallback
- `app/api/reminders/route.ts` - POST endpoint for triggering reminders via external cron or manual invocation
- `.env.local.example` - Added CRON_SECRET env var documentation

## Decisions Made
- pg_cron CREATE EXTENSION and schedule wrapped in exception-handling DO block so migration succeeds when pg_cron is not available (local dev, hobby Supabase plans)
- API route accepts either CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY as Bearer token for flexible deployment (Vercel Cron, GitHub Actions, manual testing)
- Function uses SECURITY DEFINER to bypass RLS for inserting notifications across members
- Cache-Control: no-store on all API responses to prevent caching of cron trigger results

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

For external cron integration (optional):
- Set `CRON_SECRET` environment variable (generate with `openssl rand -hex 32`)
- Configure external cron service to POST to `/api/reminders` with `Authorization: Bearer $CRON_SECRET`
- pg_cron handles this automatically on Supabase Pro plans -- no manual cron setup needed

## Next Phase Readiness
- Reminder system is the final plan in Phase 6
- All notification infrastructure complete: foundation (06-01), accept/decline (06-02), bell UI (06-03), swap requests (06-04), reminders (06-05)
- Phase 6 fully delivered

## Self-Check: PASSED

- supabase/migrations/00010_reminder_cron.sql: FOUND
- app/api/reminders/route.ts: FOUND
- 06-05-SUMMARY.md: FOUND
- Commit 3f6ee20: FOUND
- Commit ddfd19e: FOUND

---
*Phase: 06-accept-decline-and-notifications*
*Completed: 2026-02-17*
