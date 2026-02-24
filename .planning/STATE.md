# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Team leaders can schedule members to positions for upcoming services, and team members can see their assignments, confirm/decline, and manage their availability.
**Current focus:** Phase 7 - Song Library & Setlists

## Current Position

Phase: 7 of 10 (Song Library & Setlists)
Plan: 1 of 3 completed in current phase
Status: In Progress
Last activity: 2026-02-24 -- Completed 07-01 songs & setlists data layer

Progress: [██████████████████████████████████████████████████████████░░] 59%

## Performance Metrics

**Velocity:**
- Total plans completed: 27
- Average duration: 4min
- Total execution time: 1.87 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-and-authentication | 5/5 | 20min | 4min |
| 02-teams-and-member-profiles | 7/7 | 31min | 4min |
| 03-services-and-calendar | 3/3 | 11min | 4min |
| 04-scheduling-and-assignments | 3/3 | 17min | 6min |
| 05-availability-management | 3/3 | 17min | 6min |
| 06-accept-decline-and-notifications | 5/5 | 16min | 3min |
| 07-song-library-setlists | 1/3 | 3min | 3min |

**Recent Trend:**
- Last 5 plans: 06-03 (2min), 06-04 (4min), 06-04-redo (4min), 06-05 (2min), 07-01 (3min)
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
- [02-02]: Added getTeamsWithLeads query to fetch lead names with team listing (single query, not N+1)
- [02-02]: Created fetchAllMembers server action to avoid server-only import in client MemberAssignment component
- [02-02]: getTeamDetail returns flattened TeamDetailMember type combining members, profiles, and skills
- [02-02]: PositionManager uses inline forms for add/edit instead of dialogs (faster workflow)
- [02-02]: Skill edit dialog saves sequentially for error isolation
- [02-03]: Position skills fetched via dedicated getOwnPositionSkills query (lightweight profile query)
- [02-03]: Position preferences read-only -- skill levels managed by team leads per TEAM-06
- [02-03]: Added created_at to OwnProfile for join date fallback when joined_serving_at is null
- [02-04]: getTeamRoster uses !inner join on team_members to return only serving members (not all 350+)
- [02-04]: Search uses URL params (?q=, ?team=) for shareable/bookmarkable results
- [02-04]: All authenticated users can view all profile fields -- noted for future privacy restriction
- [02-04]: Team filter chips are server-rendered anchor tags for zero JS overhead
- [02-05]: Layers icon used for Teams nav to differentiate from Users icon on Team Roster
- [02-05]: My Profile placed in user dropdown (personal items) rather than sidebar nav (feature items)
- [02-07]: Personal info fields (phone, emergency contact, birthdate) read/written from shared members table, not member_profiles
- [02-07]: member_profiles retains only serving-specific fields: avatar_url, joined_serving_at, notification prefs
- [02-07]: SelectContent position="popper" with max-h-48 for fixed dropdown height
- [02-06]: Desktop roster table uses Link-wrapped rows for navigation (server component compatible)
- [02-06]: quantityNeeded removed entirely from position schemas -- DB column default of 1 handles it
- [03-01]: service_recurrence_patterns table created before services table to enable FK reference without ALTER TABLE
- [03-01]: Rehearsal fields reset to null on duplicateService -- each duplicated service gets its own rehearsal schedule
- [03-01]: Service type management restricted to admin-only (not committee) to prevent type proliferation
- [03-01]: Date fields use DATE type (not TIMESTAMPTZ) -- church operates in single timezone
- [03-02]: ServiceCalendar uses React context (ServiceCalendarContext) to pass services into custom DayButton
- [03-02]: Dashboard page is server component; DashboardCalendar and DashboardActions are thin client wrappers for state
- [03-02]: Service list items Link-wrapped for future /services/[id] navigation
- [03-02]: Edit dialog in ServiceList managed via local state (editingService) rather than URL params
- [03-03]: Split button pattern for dashboard actions -- primary Create Service + dropdown for recurring/types
- [03-03]: ServiceTypeManager uses inline forms (matching PositionManager pattern) for consistency
- [03-03]: Service detail page is server component with thin client wrapper for action buttons
- [03-03]: AlertDialog used for delete confirmations instead of window.confirm (accessible, consistent)
- [04-01]: canManageTeamAssignments() helper: admin/committee always allowed, team lead for own team only
- [04-01]: Conflict detection uses single query for same-date assignments, then application-level time overlap filter
- [04-01]: Templates store JSON snapshot of positions (positionId, positionName, category, count) for resilience
- [04-01]: Supabase FK joins cast through 'as unknown as' to handle array vs object return type ambiguity
- [04-02]: base-ui Combobox uses object values {value, label} for automatic search filtering by member name
- [04-02]: InlinePositionAdder per team card plus standalone PositionAdder for adding to any team
- [04-02]: Status badge colours: amber-pending, green-confirmed, red-declined with dark mode variants
- [04-02]: Notes input uses debounced save (500ms timeout via useRef) rather than explicit save button
- [04-03]: fetchTemplates server action wraps getTemplates query for client component consumption (server-only import boundary)
- [04-03]: Template list fetched on dialog open via server action rather than pre-fetched in page to ensure fresh data
- [04-03]: Dashboard stats use multi-step query: fetch upcoming IDs, count positions, count assignments, subtract for unassigned
- [05-01]: canManageForMember: separated from canManageTeamAssignments since availability auth checks member-level (not service-position-level)
- [05-01]: Recurring pattern end_date boundary checks done in both matchesRecurringPattern and query-level filters for defense in depth
- [05-01]: Sidebar nav: Availability placed after Team Roster (admin) and after My Schedule (member) with CalendarOff icon
- [05-02]: AvailabilityCalendar renders separate Calendar components for single vs range mode (avoids react-day-picker union type issues)
- [05-02]: Team lead detection via team_members.role='lead' query at page level, not cached flag
- [05-02]: fetchTeamAvailability uses dynamic import to cross server-only import boundary
- [05-03]: Conflict check takes precedence over unavailability in assignMember; forceAssign=true bypasses both checks
- [05-03]: Unavailable members keep alphabetical sort position in combobox (not hidden or reordered)
- [05-03]: UnavailabilityDialog follows ConflictDialog visual pattern (amber action button, AlertDialog) for consistency
- [06-01]: Provider pattern for notifications -- InAppProvider now, extensible for Email/Telegram/WhatsApp later
- [06-01]: createNotification wraps provider.send in try/catch so notification failures never break calling actions
- [06-01]: getMyAssignments uses !inner joins to filter by service_date >= today for upcoming-only schedule
- [06-01]: getPendingSwapsForTeamLead uses admin client to bypass RLS and find swaps across team lead's teams
- [06-02]: Confirm is 1 tap (no dialog), decline opens AlertDialog confirmation per user decision
- [06-02]: AssignmentResponseButtons use optimistic state via useState + useTransition for instant visual feedback
- [06-02]: Status badge reuses Phase 4 color convention: amber-pending, green-confirmed, red-declined
- [06-02]: Active state on buttons: confirmed shows solid green check, declined shows solid red X
- [06-03]: Optimistic UI updates for markAsRead/markAllRead with revert on error
- [06-03]: Notification failures in assignMember/unassignMember wrapped in try/catch (never break assignment flow)
- [06-03]: Sticky header bar with backdrop-blur for bell icon placement (consistent across all pages)
- [06-03]: NotificationContextProvider only rendered when memberId exists (graceful fallback for edge cases)
- [06-05]: pg_cron extension CREATE wrapped in DO block with exception handling for graceful fallback
- [06-05]: API route authenticates via CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY Bearer token
- [06-05]: generate_service_reminders uses SECURITY DEFINER to bypass RLS for cross-member notification inserts
- [06-04]: Pre-arranged swap model: target member selected at creation, no in-system acceptance from target
- [06-04]: Race condition protection on swap approval: atomic UPDATE WHERE status='pending' with rowCount check
- [06-04]: Swap button on assignment card; "Swap Pending" badge replaces button when active swap exists
- [06-04]: fetchTeamMembersForSwap uses dynamic import to cross server-only boundary (consistent with fetchTeamAvailability)
- [07-01]: Tags stored as text[] with GIN index rather than separate tags table -- simpler for expected scale
- [07-01]: No UNIQUE constraint on (service_id, song_id) in setlist_items -- allows same song twice in a setlist
- [07-01]: Song links stored as jsonb array of {label, url} objects for flexibility (YouTube, chord charts)
- [07-01]: Sort order re-numbered sequentially after removal to prevent gaps in setlist ordering

### Pending Todos

None yet.

### Blockers/Concerns

- Research flagged RRULE recurring event implementation as MEDIUM complexity -- may need `/gsd:research-phase` during Phase 3 planning
- REQUIREMENTS.md stated 67 requirements but actual count is 84 -- corrected in traceability update

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 07-01-PLAN.md (songs & setlists data layer)
Resume file: None
