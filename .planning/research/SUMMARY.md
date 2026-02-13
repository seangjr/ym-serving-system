# Project Research Summary

**Project:** YM Serving System
**Domain:** Church worship team scheduling and serving management (Planning Center Services clone)
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

This is a church volunteer scheduling and worship planning application in a well-established domain dominated by Planning Center Services. The research reveals a clear architectural path: a Next.js 16 + React 19 server-first application backed by Supabase (Postgres + Auth + Realtime + Storage) as a unified platform. The recommended approach leverages Server Components for data fetching, Server Actions for mutations, and RLS policies for multi-tenant isolation, following Vercel's documented patterns for secure, performant Next.js applications with multi-role access control.

The core challenge is building a flexible, ministry-agnostic data model that supports per-team role hierarchies (not flat user roles) and handles recurring service scheduling without storing thousands of individual date instances. The table stakes are high: users expect manual and auto-scheduling, availability management, accept/decline workflows, song library integration, and mobile access from day one. The competitive differentiator opportunities lie in smart auto-scheduling with burnout prevention, real-time service flow (Services LIVE feature), and equipment tracking — an area where even Planning Center has gaps.

Critical risks center on foundational schema decisions that are expensive to change later: multi-tenancy (every table needs `org_id` from day one), per-team role model (not flat user roles), recurring event storage (RRULE patterns, not individual rows), and RLS performance (indexed policies with `SECURITY DEFINER` functions). Avoiding these pitfalls in Phase 1 (Foundation) is non-negotiable; recovering from any of them post-launch is a 1-4 week rewrite. The research provides high confidence in stack choices, feature priorities, and architectural patterns based on official Supabase/Next.js documentation, competitive analysis of Planning Center/Elvanto/ChurchTeams, and established multi-tenant SaaS patterns.

## Key Findings

### Recommended Stack

The stack builds on the existing Next.js 16 scaffold with React 19, TypeScript, Tailwind v4, and Biome. The research strongly recommends Supabase as a unified backend platform (Postgres + Auth + Realtime + Storage) rather than stitching together separate services. This gives RLS-enforced multi-tenancy, JWT-based auth with middleware refresh, WebSocket-based live updates, and RLS-secured file storage in one platform.

**Core technologies:**
- **Supabase Platform** (Postgres 15+, Auth, Realtime, Storage): Single backend covering auth, database, files, and real-time — RLS policies enforce multi-role access at the database level, avoiding application-layer permission checks
- **@supabase/ssr** (^0.8.0): Required for Next.js App Router SSR auth, handles token refresh in middleware and cookie management across server/client boundary
- **@fullcalendar/react** (^6.1.20): The scheduling UI core — provides month/week/day views, drag-and-drop event management, and resource scheduling (assign people to time slots)
- **@tanstack/react-query** (^5.90.21): Server state caching for Supabase queries, handles background refetching, optimistic updates for schedule changes, pagination for song library
- **React Hook Form + Zod**: Already installed — uncontrolled forms minimize re-renders for complex scheduling forms, Zod validates both client forms and Server Action inputs
- **shadcn/ui + Radix UI**: Already installed — accessible primitives perfect for scheduling UI (dialogs, selects, tables, calendars)
- **Resend + @react-email/components**: Transactional emails (schedule confirmations, reminders) with React-component templates

**Critical dependencies:**
- `date-fns` (^4.1.0): Already installed — tree-shakeable date utilities for recurring events, timezone handling
- `nuqs` (^2.8.8): Type-safe URL state for shareable schedule views ("share this filtered roster" = URL copy)
- `Zustand` (^5.0.11): Lightweight global state for UI concerns (sidebar state, filters, notification preferences)

**What NOT to use:**
- `@supabase/auth-helpers-nextjs`: DEPRECATED, replaced by `@supabase/ssr`
- Prisma/Drizzle ORM: Breaks RLS by bypassing Postgres policies; Supabase JS client with generated types provides equivalent type safety
- Redux/RTK: Overkill; server state lives in React Query, UI state in Zustand
- Firebase: Vendor lock-in with no SQL access, no migrations, no RLS policies

### Expected Features

Research shows a clear three-tier feature landscape based on competitor analysis (Planning Center, Elvanto, ChurchTeams, Breeze).

**Must have (table stakes) — MVP blockers:**
- Service calendar with recurring events and multiple service types
- Team and position management (custom teams, positions within teams)
- Volunteer scheduling with matrix view (dates × positions)
- Availability and blockout dates (self-service entry, conflict surfacing)
- Accept/decline workflow with status tracking
- Email notifications and reminders
- Song library (title, artist, key, tempo, lyrics, arrangements)
- Service order/flow builder (sequence songs and elements)
- Mobile-responsive web UI (volunteers check schedules on phones)
- User roles and permissions (admin, team lead, member with RLS enforcement)

**Should have (competitive differentiators) — v1.x:**
- Smart auto-scheduling (constraint-based: availability, last-served, workload balancing)
- CCLI SongSelect integration (import songs, auto-report usage for licensing)
- Chord transposition and capo chart generation
- Substitution/swap requests (volunteer-initiated, team lead approved)
- File attachments per service item (chord charts, sheet music, stage plots)
- Serving frequency insights and burnout prevention dashboard
- Real-time service flow (Services LIVE — advance through items in real time during service)

**Defer (v2+) — after product-market fit:**
- Multi-campus/multi-site support (complex data model changes)
- Rehearsal tools (audio player, metronome, looping — consider integrating with existing services)
- Native mobile apps (PWA sufficient for v1; native when 50+ churches and clear mobile-specific needs)
- Background check tracking (important for children's ministry teams)
- Calendar 2-way sync (iCal export sufficient initially)

**Anti-features (deliberately avoid):**
- Full ChMS (donations, attendance, groups, pastoral care) — scope creep; Planning Center won by being best-in-class at scheduling
- Built-in presentation software (ProPresenter/EasyWorship clone) — separate product category with years of effort
- Real-time chat platform — commodity; users already have WhatsApp/Slack
- Donation/tithing management — different compliance requirements; integrate with existing services

### Architecture Approach

The architecture follows Next.js App Router server-first patterns with Supabase multi-tenancy via RLS. All database access routes through two layers: query functions for reads (called in Server Components) and Server Actions for writes (with Zod validation + auth checks). No direct Supabase calls from Client Components. This provides a single enforcement point for auth, validation, and error handling while preventing accidental client-side data leaks.

**Major components:**
1. **Data Access Layer** — `lib/queries/` (reads) and `lib/actions/` (mutations) with Zod validation and `requireRole()` guards; all Supabase access funneled through these layers
2. **Multi-Tenant Foundation** — Organization-scoped via `org_memberships` table mapping users to orgs with roles; RLS uses `has_role_on_org()` function; every table has `org_id` column; role changes take effect immediately without re-issuing tokens
3. **Generic Teams/Positions Model** — Teams and positions are data, not schema; new ministries added by inserting rows, not altering tables; `teams`, `positions`, and `team_memberships` tables with flexible role assignments per team
4. **Supabase Auth + SSR** — Three client variants (browser, server, middleware) following official Supabase SSR pattern; middleware refreshes tokens on every request; no cached auth calls in Server Components
5. **Realtime Subscriptions** — Client-side-only subscriptions for live schedule updates, Services LIVE feature, and notifications; Server Components handle initial data load

**Key patterns:**
- **RLS policies:** Anchor on `auth.uid()` first, use `SECURITY DEFINER` functions for membership lookups to enable query plan caching, index every column referenced in RLS policies
- **Recurring events:** Store RRULE patterns (RFC 5545), not individual date instances; generate concrete instances on read within a date window; only store exceptions (cancellations, overrides)
- **Server Actions flow:** Zod validates input → `requireRole()` checks permissions → Supabase insert/update → `revalidatePath()` → client re-renders with fresh data
- **State management:** React Query for server state (Supabase queries), Zustand for client UI state, nuqs for URL state (shareable filtered views)

### Critical Pitfalls

Research identified six critical pitfalls that must be addressed in foundational phases, plus several moderate/minor issues to monitor.

1. **Recurring Service Scheduling Stored as Individual Rows** — Storing every "Sunday at 9am" as its own row generates 52+ rows/year and makes editing patterns impossibly complex. Solution: Store RRULE patterns in `service_templates` table, generate instances on demand. Must be designed correctly in Phase 1; migrating from per-instance to RRULE is a rewrite.

2. **RLS Policies That Cause Full Table Scans** — Subqueries like `auth.uid() IN (SELECT user_id FROM ...)` force sequential scans. Queries go from 2ms to 500ms+ at 10K rows. Solution: Anchor RLS on `auth.uid()` first, wrap in `SECURITY DEFINER` functions, index all RLS columns (`user_id`, `org_id`), test with 1000+ rows early.

3. **Flat Role Model That Cannot Express Church Hierarchies** — Simple `role ENUM ('admin', 'leader', 'member')` at user level prevents per-team roles (someone leading worship but member of tech). Solution: Design `team_memberships` with per-team roles from day one; build `get_user_role_for_team(team_id)` helper. Phase 1 schema decision affecting every RLS policy.

4. **Ignoring the Decline/Swap Workflow** — Building scheduling as one-way "admin assigns" flow without decline/swap requires manual text chains for the actual logistics. Solution: Model assignment status as state machine from day one (pending → confirmed/declined → swap_requested → swap_confirmed). Build decline flow immediately after basic scheduling.

5. **Server/Client Auth Token Mismatch in Next.js App Router** — Server Components fetch stale sessions while Client Components have valid tokens (or vice versa), causing intermittent auth failures. Solution: Follow Supabase SSR guide exactly, middleware must call `getUser()` on every request, never cache authenticated calls in Server Components.

6. **Multi-Tenancy Afterthought** — Building for single church first, adding `org_id` later requires migrating every table, every RLS policy, every query. Effectively a rewrite. Solution: Add `org_id` to every table from day one, every RLS policy includes org check, create `current_org_id()` helper function.

**Additional warnings:**
- **Security:** Enable RLS on EVERY table in public schema (not just main tables); use `WITH CHECK` clauses on INSERT/UPDATE policies; never expose volunteer contact info (phone/email) to non-leaders
- **Performance:** N+1 queries in schedule views (use nested selects), unindexed RLS columns (index `user_id`, `team_id`, `org_id` on every table), loading full song library on every page (paginate, use full-text search)
- **UX:** Calendar-centric view forces mental translation; default should be service-centric ("Feb 16 - 9am Service" with positions). No bulk scheduling = 20 individual actions to schedule a band for 4 weeks. Mobile-first for volunteer views, desktop-first for admin.

## Implications for Roadmap

Based on research, the roadmap should follow a foundational-first approach with strict dependency ordering. The architecture research provides a clear build sequence, features research shows MVP boundaries, and pitfalls research flags which decisions are expensive to change later.

### Suggested Phase Structure

#### Phase 1: Foundation & Multi-Tenant Auth
**Rationale:** Every feature depends on auth, org isolation, and the role model. The six critical pitfalls must be addressed here — recovering from any of them later is a 1-4 week rewrite. This phase establishes the data model that every subsequent phase builds on.

**Delivers:**
- Supabase project setup, auth configuration, middleware
- Multi-tenant schema: `organizations`, `org_memberships`, `members` tables with `org_id` on every table
- RLS infrastructure: `has_role_on_org()` function, indexed policies, per-team role model via `team_memberships`
- Auth flows: login/signup, session management, role-based access
- Empty state for authenticated dashboard

**Addresses:**
- Multi-tenancy afterthought (Pitfall 6)
- Flat role model (Pitfall 3)
- Server/client auth mismatch (Pitfall 5)
- Foundation for RLS performance (Pitfall 2)

**Avoids:**
- Retrofitting org_id to tables post-launch
- Global role model preventing per-team permissions
- Intermittent auth failures from token mismatch

**Research flag:** LOW — Supabase SSR auth is well-documented with official Next.js guides. Standard patterns apply.

---

#### Phase 2: Team & Position Management
**Rationale:** Scheduling depends on teams and positions existing. The generic teams/positions pattern (not ministry-specific tables) must be built before any scheduling logic. This phase validates the per-team role model works as designed.

**Delivers:**
- `teams`, `positions`, `team_memberships` tables with RLS
- Team CRUD UI (create, edit, delete teams)
- Position management within teams
- Member assignment to teams with qualified positions
- Team leader role assignment and enforcement

**Addresses:**
- Generic teams/positions architecture pattern
- Per-team role hierarchy validation
- Foundation for scheduling assignment logic

**Uses:**
- Server Actions pattern from Phase 1
- RLS policies with per-team role checks
- shadcn/ui components for team management UI

**Avoids:**
- One table per ministry anti-pattern (Pitfall: Anti-Pattern 3)
- Inability to add new ministries without schema migrations

**Research flag:** LOW — Standard CRUD with RLS. Architecture research provides detailed schema and patterns.

---

#### Phase 3: Service Calendar & Recurring Events
**Rationale:** Services are the organizing primitive for scheduling. Recurring event storage must use RRULE patterns from the start (Pitfall 1). This phase is critical — recurring event architecture is hard to change post-launch.

**Delivers:**
- `service_types`, `service_templates` (with RRULE), `services` tables
- Service calendar UI (month/week views via @fullcalendar/react)
- Recurring service templates with RRULE pattern editor
- Service instance generation within date windows (next 8 weeks)
- Exception handling (cancellations, date overrides)

**Addresses:**
- Recurring events stored as rows (Pitfall 1) — use RRULE patterns
- Calendar view foundation for scheduling
- Service templates for weekly/monthly patterns

**Uses:**
- `@fullcalendar/react` for calendar UI
- `date-fns` for RRULE computation and timezone handling
- RLS policies scoped by org_id from Phase 1

**Avoids:**
- Unbounded row generation (52+ rows/year per service type)
- Complex editing of recurring patterns across individual rows
- Memory/query cost growing unbounded over time

**Research flag:** MEDIUM — RRULE implementation requires careful date handling and exception logic. Consider `/gsd:research-phase` if RRULE complexity is unclear during planning.

---

#### Phase 4: Volunteer Scheduling (Manual Assignment)
**Rationale:** Core value proposition. Must include assignment state machine from day one (Pitfall 4) — pending/confirmed/declined/swap states, not just a boolean. This is the highest-complexity table-stakes feature.

**Delivers:**
- `assignments` table with state machine (pending, confirmed, declined, swap_requested, swap_confirmed)
- Schedule matrix view (dates × positions) with assign/unassign
- Assignment status tracking per position
- Conflict detection (cross-team, time-overlap)
- Initial notification triggers (assignment created/changed)

**Addresses:**
- Core scheduling workflow
- Assignment state machine (prevents Pitfall 4)
- Conflict detection to prevent double-booking

**Uses:**
- Server Actions for assign/unassign mutations with Zod validation
- React Query for schedule data caching and optimistic updates
- RLS policies checking team lead permissions for assignments

**Avoids:**
- One-way scheduling flow without decline/swap support (Pitfall 4)
- Silent double-booking without conflict detection

**Research flag:** LOW — Standard assignment logic with state machine. Architecture research provides detailed flow.

---

#### Phase 5: Availability & Blockout Dates
**Rationale:** Enhances scheduling by surfacing conflicts. Must support both recurring patterns ("never available 1st Sunday") and one-time blockouts. Dependency: requires assignments to exist for conflict display.

**Delivers:**
- `availability` table with recurring and one-time patterns
- Self-service availability input UI (member view)
- Availability status display in scheduling matrix
- Conflict warnings when assigning unavailable members
- Recurring availability patterns (weekly, monthly)

**Addresses:**
- Volunteer availability management (table stakes)
- Conflict detection integration
- Foundation for auto-scheduling constraints

**Uses:**
- `date-fns` for recurring pattern computation
- RLS policies: members update own availability, leaders view team availability
- Integration with scheduling matrix from Phase 4

**Avoids:**
- One-time blockouts only (missing recurring patterns like "never on 1st Sunday")
- Scheduling conflicts discovered post-assignment

**Research flag:** LOW — Availability is a standard CRUD feature with date range logic.

---

#### Phase 6: Accept/Decline Workflow & Notifications
**Rationale:** Closes the scheduling loop. Volunteers must confirm/decline assignments, triggering notifications and status updates. This phase makes assignments actionable, not just informational.

**Delivers:**
- Accept/decline actions on assignments (status transitions)
- Email notifications via Resend + React Email templates
- Notification batching (avoid 5 emails at 11pm)
- Follow-up for non-responders (deadline-based)
- "Need replacement" alerts when volunteer declines
- In-app notification history (`notifications` table)

**Addresses:**
- Assignment confirmation workflow (table stakes)
- Notification delivery system
- Foundation for swap workflow

**Uses:**
- Supabase Edge Functions or database webhooks for async notification delivery
- Resend API for transactional emails
- React Email components for email templates (schedule published, assignment notification, reminder)

**Avoids:**
- Synchronous notifications in Server Actions (slow UI responses)
- Spamming volunteers with unbatched notifications
- No "quiet hours" respect

**Research flag:** LOW — Standard notification patterns. Email templates are straightforward with React Email.

---

#### Phase 7: Song Library & Service Order Builder
**Rationale:** Parallel track to scheduling — worship teams need song management. Can build alongside Phases 4-6 since it's independent of assignment logic until service order builder integrates.

**Delivers:**
- `songs` table (title, artist, key, tempo, tags, lyrics, arrangements)
- Song library UI with search and filtering
- `service_items` table linking songs to services
- Service order builder (drag-and-drop song sequence)
- Timestamps and notes per service item
- Per-instance key/arrangement overrides

**Addresses:**
- Song library (table stakes for worship teams)
- Service planning workflow
- Foundation for CCLI integration (v1.x)

**Uses:**
- Full-text search with `tsvector` for song search
- Drag-and-drop UI for service order
- RLS policies: team leads manage songs, members view

**Avoids:**
- Flat song storage (missing arrangements, per-service key overrides)
- Same song in different keys requires duplicate entries

**Research flag:** LOW — Standard CRUD with search. Service order builder is drag-and-drop list reordering.

---

#### Phase 8: Mobile-Responsive UI & My Schedule Views
**Rationale:** Volunteers check schedules on phones. Mobile-first for volunteer views is table stakes. This phase polishes the member-facing experience.

**Delivers:**
- Mobile-responsive layouts for all views
- "My Upcoming Schedule" dashboard (member view)
- Quick confirm/decline actions (one-tap)
- Mobile-optimized service detail view
- PWA manifest and offline basics

**Addresses:**
- Mobile access (table stakes — volunteers check on phones)
- Member-focused UX (separate from admin scheduling views)

**Uses:**
- Tailwind v4 responsive utilities
- shadcn/ui components (already accessible and mobile-friendly)
- PWA configuration for installability

**Avoids:**
- Desktop-only design forcing volunteers to pinch-zoom on phones
- Complex scheduling UI on small screens (admin views stay desktop-first)

**Research flag:** LOW — Responsive design with Tailwind is standard. PWA setup is straightforward.

---

### Phase Ordering Rationale

**Dependency chain:**
1. Auth + Org (Phase 1) → Teams (Phase 2) → Services (Phase 3) → Assignments (Phase 4) → Availability (Phase 5) → Notifications (Phase 6)
2. Song Library (Phase 7) can parallel Phases 4-6 since it's independent until service order builder integrates
3. Mobile polish (Phase 8) comes last to avoid premature optimization before core features stabilize

**Grouping logic:**
- Phases 1-3 establish the data model and avoid all six critical pitfalls
- Phases 4-6 build the scheduling workflow from assignment → availability → confirmation
- Phases 7-8 add worship-specific features and polish member UX

**Pitfall avoidance:**
- Multi-tenancy (Pitfall 6) addressed in Phase 1 before any feature tables exist
- Flat role model (Pitfall 3) addressed in Phase 1-2 via `team_memberships`
- Recurring events (Pitfall 1) addressed in Phase 3 with RRULE patterns
- Auth mismatch (Pitfall 5) addressed in Phase 1 with proper SSR setup
- Assignment state machine (Pitfall 4) designed in Phase 4 schema
- RLS performance (Pitfall 2) prevented by indexing strategy in Phases 1-2

### Research Flags

**Phases likely needing `/gsd:research-phase`:**
- **Phase 3 (Service Calendar):** RRULE pattern storage, computation, and exception handling is complex. If date logic becomes unclear during planning, research iCalendar spec and `rrule.js` usage patterns.
- **Phase 10 (Auto-Scheduling - v1.x):** Constraint satisfaction algorithm for fair workload distribution is a specialized domain. Research constraint solvers, round-robin with preferences, and Planning Center's approach.

**Phases with well-documented patterns (skip research):**
- **Phase 1 (Auth):** Supabase SSR auth is officially documented with Next.js guides
- **Phase 2 (Teams):** Standard CRUD with RLS
- **Phase 4 (Scheduling):** Assignment logic well-covered in architecture research
- **Phase 5 (Availability):** Date range CRUD
- **Phase 6 (Notifications):** Email delivery patterns are standard
- **Phase 7 (Songs):** CRUD with full-text search
- **Phase 8 (Mobile):** Responsive design with Tailwind

### Future Phases (v1.x - v2)

**v1.x additions (post-MVP validation):**
- Phase 9: Substitution/Swap Requests (extends assignment state machine)
- Phase 10: Smart Auto-Scheduling (constraint-based algorithm)
- Phase 11: CCLI SongSelect Integration (song import + auto-reporting)
- Phase 12: Chord Transposition & File Attachments
- Phase 13: Serving Frequency Insights & Burnout Dashboard
- Phase 14: Team Messaging & Announcements

**v2+ (after product-market fit):**
- Phase 15: Real-time Service Flow (Services LIVE with Supabase Realtime)
- Phase 16: Multi-Campus Support (partitioning, shared teams)
- Phase 17: Native Mobile Apps (iOS + Android)
- Phase 18: Rehearsal Tools Integration (MultiTracks, RehearsalMix)
- Phase 19: Background Check Tracking
- Phase 20: Calendar 2-Way Sync

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on official Supabase and Next.js documentation, verified npm package versions, established patterns for Next.js + Supabase apps. All recommended packages have official docs and active maintenance. |
| Features | HIGH | Based on competitive analysis of Planning Center, Elvanto, ChurchTeams, Breeze. Table stakes features are consistent across all competitors. User expectations well-documented in church tech community resources. |
| Architecture | HIGH | Based on official Supabase RLS documentation, Next.js App Router patterns, and verified multi-tenant SaaS architecture guides. Server Actions + RLS pattern is Vercel's recommended approach. |
| Pitfalls | MEDIUM-HIGH | Based on official Supabase RLS performance docs and community postmortems from production Supabase apps. Recurring event pitfall sourced from database design articles (MEDIUM confidence). All six critical pitfalls have clear prevention strategies. |

**Overall confidence:** HIGH

The stack, features, and architecture all have high confidence due to official documentation and established patterns. Pitfalls are slightly lower confidence (MEDIUM-HIGH) because they're based on community experience rather than official guides, but the prevention strategies are well-documented.

### Gaps to Address

**During Phase 3 planning (Recurring Events):**
- **RRULE edge cases:** Research focused on the pattern, not edge cases like DST transitions, leap years, monthly recurrence on 29-31st. Validate RRULE library handling of these during Phase 3 planning.
- **Exception storage:** Architecture research suggests storing exceptions as rows, but the exact schema for "skip this date" vs "override this date" needs detailed design.

**During Phase 10 planning (Auto-Scheduling):**
- **Constraint solver approach:** Research didn't dive into specific algorithms. Planning Center uses proprietary logic. Need to research constraint satisfaction libraries or heuristic approaches for fair rotation during Phase 10.
- **Fairness metrics:** Research identified "last-served date" and "total serves" as inputs but didn't specify the weighting algorithm. Requires domain research or user interviews.

**During v1.x planning (CCLI Integration):**
- **CCLI API access:** Research assumed CCLI SongSelect API partnership is available. Need to validate API access requirements, pricing, and terms before committing to this feature.
- **Auto-reporting logic:** Research mentions "auto-report song usage" but didn't detail reporting format or frequency. Requires CCLI documentation review.

**General validation needs:**
- **Church timezone handling:** Research flagged multi-timezone services for online/multi-campus churches but didn't provide implementation details. All dates stored as UTC is standard, but display logic per user timezone vs church timezone needs clarification.
- **Minor volunteer contact privacy:** Research flagged privacy for minors in youth ministry but didn't specify COPPA compliance requirements. Validate legal requirements for storing minor contact info.

## Sources

### Primary (HIGH confidence)
- **Supabase Official Docs:** RLS documentation, SSR auth for Next.js, Realtime guides, Storage guides
- **Context7 Library:** `@supabase/ssr` usage patterns, custom claims and RBAC
- **Next.js v16 Documentation:** App Router data security, Server Actions patterns
- **npm Registry:** Verified package versions for `@supabase/supabase-js`, `@supabase/ssr`, `supabase` CLI, `@tanstack/react-query`, `@fullcalendar/react`, `nuqs`, `Zustand`, `Resend`, `@react-email/components`
- **Planning Center Services:** Official product pages, feature documentation, blog posts (CCLI auto-reporting, Chat feature, Music Stand)
- **Elvanto:** Official feature pages, help docs (SongSelect integration, worship planning)
- **ChurchTeams:** Official product pages (volunteers, background checks)

### Secondary (MEDIUM confidence)
- **Makerkit:** Supabase RLS best practices for production multi-tenant apps
- **AntStack:** Multi-tenant RLS patterns, RLS performance optimization
- **Bryntum:** FullCalendar vs react-big-calendar comparison
- **nuqs.dev:** URL state management features and framework support
- **Ministry Scheduler Pro Blog:** Church volunteer scheduling best practices
- **GetApp Reviews:** Planning Center user ratings and feature summaries

### Tertiary (LOW confidence, needs validation)
- **Medium articles:** Recurring calendar events database design patterns
- **Redgate Blog:** Recurring events data model concepts
- **Church tech ecosystem articles:** Best Planning Center alternatives, volunteer management software comparisons

---
*Research completed: 2026-02-13*
*Ready for roadmap: yes*
