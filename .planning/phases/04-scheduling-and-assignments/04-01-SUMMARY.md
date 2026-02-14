---
phase: 04-scheduling-and-assignments
plan: 01
subsystem: database, api
tags: [supabase, postgres, rls, zod, server-actions, assignments, scheduling, conflict-detection, templates]

# Dependency graph
requires:
  - phase: 03-services-and-calendar
    provides: "services table, service detail page"
  - phase: 02-teams-and-member-profiles
    provides: "serving_teams, team_positions, team_members tables and queries"
provides:
  - "service_positions table for per-service position slots"
  - "service_assignments table with status state machine (pending/confirmed/declined)"
  - "schedule_templates table for reusable position configurations"
  - "lib/assignments/ module with schemas, types, queries, and server actions"
  - "Conflict detection for overlapping service times"
affects: [04-02-assignment-ui, 04-03-template-ui, 05-availability, 06-accept-decline]

# Tech tracking
tech-stack:
  added: []
  patterns: [team-lead-authorization-per-team, conflict-detection-query, template-json-snapshot, as-unknown-as-casting-for-supabase-fk-joins]

key-files:
  created:
    - supabase/migrations/00006_assignments.sql
    - lib/assignments/schemas.ts
    - lib/assignments/types.ts
    - lib/assignments/queries.ts
    - lib/assignments/actions.ts
  modified: []

key-decisions:
  - "Team lead authorization checks team_members.role per-team, not global roles"
  - "Conflict detection uses single query for same-date assignments, then application-level time overlap filter"
  - "Templates store JSON snapshot of positions (positionId, positionName, category, count) for resilience"
  - "Supabase FK joins cast through 'as unknown as' to handle array vs object return type ambiguity"

patterns-established:
  - "canManageTeamAssignments() helper: admin/committee always allowed, team lead for own team only"
  - "Conflict detection with null end_time fallback: end_time ?? calculateEndTime(start_time, duration_minutes ?? 120)"
  - "Template save: group by position_id with counts; template load: expand counts into individual service_position rows"

# Metrics
duration: 6min
completed: 2026-02-14
---

# Phase 4 Plan 1: Assignment Database Schema and Server-Side Module Summary

**Three assignment tables (service_positions, service_assignments, schedule_templates) with full server-side API including conflict detection, team-lead authorization, and template save/load**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-14T07:11:08Z
- **Completed:** 2026-02-14T07:17:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created 3 new database tables with RLS, indexes, and updated_at triggers
- Built complete lib/assignments/ module: 8 Zod schemas, 6 TypeScript interfaces, 5 query functions, 8 server actions
- Conflict detection handles overlapping service times with null end_time fallback (default 120 minutes)
- Team-lead authorization pattern: admin/committee always allowed, leads for own team only

## Task Commits

Each task was committed atomically:

1. **Task 1: Create assignment database migration** - `eea9ba8` (feat)
2. **Task 2: Create lib/assignments module** - `78e8c7d` (feat)

## Files Created/Modified
- `supabase/migrations/00006_assignments.sql` - service_positions, service_assignments, schedule_templates with RLS, indexes, triggers
- `lib/assignments/schemas.ts` - 8 Zod validation schemas for assignment/position/template operations
- `lib/assignments/types.ts` - 6 TypeScript interfaces (ServicePositionWithAssignment, TeamAssignmentGroup, EligibleMember, ConflictInfo, TemplateListItem, TemplateDetail)
- `lib/assignments/queries.ts` - 5 query functions: getServiceAssignments, getEligibleMembers, getMemberConflicts, getTemplates, getTemplateById
- `lib/assignments/actions.ts` - 8 server actions: assignMember, unassignMember, updateAssignmentNote, addServicePosition, removeServicePosition, saveTemplate, loadTemplate, deleteTemplate

## Decisions Made
- Team lead authorization uses canManageTeamAssignments() helper that checks team_members.role via admin client -- consistent with Phase 2 team lead pattern
- Conflict detection fetches all same-date assignments in a single query (not N+1 per member) then filters for time overlap in application code -- handles PostgREST filter limitations
- When end_time is null, calculateEndTime() derives it from start_time + duration_minutes (default 120 minutes) -- per RESEARCH.md Pitfall 4
- Supabase FK join results need `as unknown as` casting because PostgREST type inference returns arrays for some joins -- consistent fix across queries.ts and actions.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type casts for Supabase FK joins**
- **Found during:** Task 2 (lib/assignments module)
- **Issue:** Supabase `select()` with FK joins returns `as unknown[]` (array) for some relationships, but code expected single object. TypeScript strict mode rejected direct `as` casts.
- **Fix:** Used `as unknown as` pattern for all Supabase FK join type casts (team_positions, serving_teams, service_assignments, members)
- **Files modified:** lib/assignments/queries.ts, lib/assignments/actions.ts
- **Verification:** `pnpm build` passes, `npx biome check lib/assignments/` clean
- **Committed in:** 78e8c7d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type cast fix necessary for TypeScript compilation. No scope creep.

## Issues Encountered
- `supabase db push` could not run (Supabase CLI not authenticated). Migration SQL verified by inspection against existing migration patterns (00003, 00005). Push deferred to user.

## User Setup Required
Migration needs to be pushed to Supabase: `supabase db push` (requires `supabase login` first).

## Next Phase Readiness
- Database schema and server-side module ready for Plan 02 (assignment UI) and Plan 03 (template UI)
- All server actions follow established patterns and are ready for client consumption
- No new dependencies needed

---
*Phase: 04-scheduling-and-assignments*
*Completed: 2026-02-14*
