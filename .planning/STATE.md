# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Team leaders can schedule members to positions for upcoming services, and team members can see their assignments, confirm/decline, and manage their availability.
**Current focus:** Phase 2 - Teams & Member Profiles

## Current Position

Phase: 2 of 10 (Teams & Member Profiles)
Plan: 1 of 4 in current phase
Status: Executing
Last activity: 2026-02-13 -- Completed 02-01 schema & data layer (5 tables, 14 actions, 7 queries)

Progress: [████████████] 12%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 4min
- Total execution time: 0.42 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-and-authentication | 5/5 | 20min | 4min |
| 02-teams-and-member-profiles | 1/4 | 5min | 5min |

**Recent Trend:**
- Last 5 plans: 01-02 (4min), 01-03 (3min), 01-04 (5min), 01-05 (4min), 02-01 (5min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 10-phase comprehensive roadmap derived from 84 v1 requirements across 14 categories
- [Roadmap]: Phase 1 includes app shell (sidebar, dark mode, responsive) alongside auth to enable visual progress early
- [Roadmap]: Multi-tenant schema foundation (org_id on every table) built into Phase 1 per research pitfall guidance
- [01-01]: Used NEXT_PUBLIC_SUPABASE_ANON_KEY (not PUBLISHABLE_KEY) for env var naming -- wider compatibility
- [01-01]: Added /update-password to middleware allow-list for password reset flow completeness
- [01-01]: Error redirects go to /login?error=... rather than separate error pages
- [01-02]: Used useActionState (React 19) for inline form error display instead of redirect-based error handling
- [01-02]: useSearchParams extracted into Suspense-wrapped ErrorToast component for static prerendering compatibility
- [01-02]: Sonner Toaster added to root layout for global toast notification support
- [01-03-rework]: Reworked role infrastructure to align with ym-attend-4 pattern (DB queries via members/assignments/roles, not JWT claims)
- [01-03-rework]: Removed custom_access_token_hook, app_role enum, user_roles table -- shared Supabase project already has roles/members/assignments
- [01-03-rework]: Added Committee role insert migration for serving team leads
- [01-03-rework]: getUserRole() is now async, takes SupabaseClient, returns { role, memberId } -- queries DB instead of parsing JWT
- [01-03-rework]: Admin role gets dedicated "Admin" nav item with Shield icon in sidebar
- [01-03-rework]: Added service role admin client (lib/supabase/admin.ts) for bypassing RLS in server-side role queries
- [01-04]: Used API routes (not server actions) for password reset flow -- enables fetch-based client interaction with JSON responses
- [01-04]: 3-step OTP flow: request code -> verify code -> set password, with reset token as bridge between steps 2 and 3
- [01-04]: Dev mode returns OTP code in API response when RESEND_API_KEY is not set for local testing
- [01-04]: Removed old Supabase built-in reset flow (resetPasswordForEmail) in favor of custom OTP
- [01-05-rework]: Admin panel uses shared roles/assignments tables instead of wrong user_roles approach
- [01-05-rework]: getUsers() joins members+assignments+roles, derives highestServingRole (admin/committee/member)
- [01-05-rework]: updateUserRole() only manages Admin/Committee assignments, preserves other roles (Zone Leader, CG Leader)
- [01-05-rework]: Mobile card + desktop table responsive layout for user role management
- [02-01]: Zod v4 uses .issues not .errors on ZodError -- fixed across all action files
- [02-01]: Position categories are free-form text with CHECK constraints, not Postgres enums (ministry-agnostic)
- [02-01]: Team lead authorization checks team_members.role per-team, not global roles table
- [02-01]: Profile upsert pattern handles 350+ existing members with no profile rows
- [02-01]: Avatars bucket is public for simplified URL handling (no signed URLs)

### Pending Todos

None yet.

### Blockers/Concerns

- Research flagged RRULE recurring event implementation as MEDIUM complexity -- may need `/gsd:research-phase` during Phase 3 planning
- REQUIREMENTS.md stated 67 requirements but actual count is 84 -- corrected in traceability update

## Session Continuity

Last session: 2026-02-13
Stopped at: Completed 02-01 schema & data layer (teams, positions, membership, skills, profiles)
Resume file: None
