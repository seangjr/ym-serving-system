# Pitfalls Research

**Domain:** Church worship team scheduling (Planning Center clone)
**Researched:** 2026-02-13
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Recurring Service Scheduling Stored as Individual Rows

**What goes wrong:**
Developers store every instance of a recurring weekly service as its own database row. A single "Every Sunday at 9am" rule generates 52 rows per year per service type. With multiple services, campuses, or time slots, this explodes into thousands of rows. Editing the recurring pattern (e.g., changing rehearsal time) requires updating every future row individually, leading to inconsistencies and slow queries.

**Why it happens:**
It feels simpler to query concrete rows than to compute recurrence on the fly. Early prototypes work fine with a few weeks of data, so the design flaw is invisible until months of data accumulate.

**How to avoid:**
Store recurrence rules using the RRULE format (RFC 5545 / iCalendar spec). Keep a `service_templates` table with RRULE patterns and generate concrete instances on read or via a materialization step. Only store *exceptions* (cancellations, date overrides) as individual rows. Use a library like `rrule.js` on the client for display and a PostgreSQL function or Edge Function for server-side computation.

**Warning signs:**
- Database row count growing linearly with time even when no new service types are added
- "Update all future occurrences" feature feels impossibly complex
- Calendar views require fetching hundreds of rows for a single month

**Phase to address:**
Database schema design (Phase 1 / Foundation). This must be right from the start -- migrating from per-instance to RRULE is a rewrite.

---

### Pitfall 2: RLS Policies That Cause Full Table Scans

**What goes wrong:**
RLS policies that check team membership via subqueries like `auth.uid() IN (SELECT user_id FROM team_members WHERE team_id = target_table.team_id)` force PostgreSQL to execute the subquery for every row in the table. On a table with 10,000+ rows, queries go from 2ms to 500ms+. At scale, they time out entirely. The app feels fast in development with 50 rows but becomes unusable in production.

**Why it happens:**
The "correct" RLS policy reads naturally in the slow direction. Developers write policies that make semantic sense ("is this user in this row's team?") rather than what the query planner can optimize ("what teams is this user in?"). Additionally, missing indexes on columns referenced in RLS policies compound the problem.

**How to avoid:**
1. Always write RLS subqueries anchored on `auth.uid()` first: `team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())`
2. Wrap membership lookups in `SECURITY DEFINER` functions to avoid recursive RLS evaluation and enable query plan caching
3. Index every column referenced in any RLS policy (especially `user_id` and `org_id`/`church_id`)
4. Use Supabase's Performance Advisor to detect unindexed RLS columns
5. Test with realistic data volumes (1000+ rows) early, not just 5 seed records

**Warning signs:**
- Queries are fast in SQL Editor (which bypasses RLS) but slow from the app
- `EXPLAIN ANALYZE` shows sequential scans on large tables
- Response times degrade as data grows even with constant query patterns

**Phase to address:**
Database schema design (Phase 1) for indexes. RLS policy implementation (Phase 2 / Auth). Performance validation should be a gate for every phase.

---

### Pitfall 3: Flat Role Model That Cannot Express Church Hierarchies

**What goes wrong:**
Building a simple `role ENUM ('admin', 'leader', 'member')` at the user level. Churches need *per-team* roles: someone can be a worship leader for the music team but just a member of the tech team. They might lead the 9am service but only volunteer at the 11am. A flat global role forces "all or nothing" access, leading to either over-permissioning (security risk) or under-permissioning (usability nightmare where leaders can't manage their own teams).

**Why it happens:**
Flat roles are the default tutorial pattern. The initial prototype only has one team, so the limitation is invisible. By the time multiple ministries are added, the role model is baked into every RLS policy, every UI permission check, and every API route.

**How to avoid:**
Design a `team_memberships` junction table from day one with columns: `user_id`, `team_id`, `role` (per-team role). RLS policies reference this table, not a user-level role. Build a helper function `get_user_role_for_team(team_id)` that RLS policies call. The global admin role can be a separate flag or a special membership entry.

**Warning signs:**
- RLS policies reference `users.role` instead of a membership table
- Feature requests like "make X a leader of only Team Y" feel impossible
- Permission bugs where team leaders see or edit other teams' data

**Phase to address:**
Data model design (Phase 1). This is a foundational schema decision that affects every subsequent feature.

---

### Pitfall 4: Ignoring the Decline/Swap Workflow

**What goes wrong:**
Building scheduling as a one-way "admin assigns, volunteer sees" flow. In reality, volunteers need to decline assignments, request swaps with specific people, and the system needs to find replacements from eligible, available team members. Without this, the app becomes a notification system that still requires manual text/email chains for the actual scheduling logistics -- exactly the pain point the app was supposed to solve.

**Why it happens:**
The happy path (admin schedules, volunteer confirms) is straightforward to build and demo. Decline/swap is a complex state machine: pending -> confirmed/declined -> swap_requested -> swap_pending -> swap_confirmed. Each transition has different notification rules, permission checks, and deadline constraints. It is easy to defer it as "v2" and then discover it is table-stakes.

**How to avoid:**
Model assignment status as a state machine from day one. Define the states and valid transitions in the schema. Build the decline flow immediately after basic scheduling -- before song library, equipment tracking, or any other secondary feature. Every Planning Center competitor supports this; users will expect it from week one.

**Warning signs:**
- Assignment model has only a boolean `confirmed` field
- No concept of "replacement needed" in the data model
- Users asking "how do I swap with someone?" within the first week

**Phase to address:**
Core scheduling (Phase 2-3). Must be designed in Phase 1 schema, implemented immediately after basic scheduling works.

---

### Pitfall 5: Server/Client Auth Token Mismatch in Next.js App Router

**What goes wrong:**
Supabase auth tokens expire, and in Next.js App Router, Server Components cannot write cookies. If middleware does not refresh tokens, Server Components fetch stale/expired sessions while Client Components may have a valid session (or vice versa). This causes intermittent auth failures: a page loads correctly on first visit but shows "unauthorized" on navigation, or server-rendered content shows public data while client hydration shows authenticated data (hydration mismatch).

**Why it happens:**
The App Router has three execution contexts (Server Components, Client Components, Middleware) each with different cookie access patterns. Developers set up auth in one context and assume it works in all three. Supabase's `@supabase/ssr` package handles this, but it requires creating separate client utilities for each context and properly configuring middleware token refresh.

**How to avoid:**
1. Follow Supabase's official Next.js SSR guide exactly: create `utils/supabase/server.ts`, `utils/supabase/client.ts`, and `utils/supabase/middleware.ts`
2. Middleware MUST call `supabase.auth.getUser()` (not `getSession()`) on every request to refresh tokens
3. Never cache authenticated Supabase calls in Server Components -- always call `cookies()` before creating the client
4. Test auth flows by letting sessions expire (set short expiry in dev) and verifying behavior

**Warning signs:**
- Intermittent "row not found" or empty results in Server Components
- Auth state inconsistency between server-rendered HTML and client hydration
- Login works but subsequent server navigation loses the session

**Phase to address:**
Auth setup (Phase 1-2). Get this right before building any authenticated features.

---

### Pitfall 6: Multi-Tenancy Afterthought

**What goes wrong:**
Building for a single church first, planning to "add multi-tenancy later." Every table, every query, every RLS policy, and every UI component assumes a single organization. Adding `church_id` later requires migrating every table, rewriting every RLS policy, auditing every query for data leakage, and restructuring the entire permission model. This is effectively a rewrite of the data layer.

**Why it happens:**
The immediate user is one church. Multi-tenancy adds complexity to every query (`WHERE church_id = ?`). It feels like premature optimization. But the project description explicitly calls for a "team/ministry-agnostic data model for expansion," which implies multi-org is a requirement.

**How to avoid:**
Add `church_id` (or `org_id`) to every table from day one. Set it via JWT custom claims in Supabase Auth. Every RLS policy includes `church_id = (auth.jwt()->>'church_id')::uuid`. Create a helper function `current_church_id()` that all policies reference. Even if launching with one church, the column and policies cost almost nothing upfront but save months of rewrite later.

**Warning signs:**
- Tables have no `org_id` or `church_id` column
- RLS policies only check `auth.uid()`, never organization membership
- Queries work without any organization scoping

**Phase to address:**
Database schema design (Phase 1). Must be in the foundational schema, not retrofitted.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip conflict detection, rely on manual checking | Ship scheduling faster | Volunteers get double-booked, trust in app erodes, admins still need spreadsheets | Never for MVP -- basic time-overlap detection is table stakes |
| Store songs as plain text (title + key) instead of structured data | Quick song library | No transposition, no CCLI tracking, no chord chart linking, eventual data migration | Acceptable for Phase 1 if schema has the right columns even if UI is minimal |
| Use Supabase `service_role` key in Server Actions for convenience | Bypass RLS complexity during development | Security disaster: any server-side bug exposes all data, no per-user audit trail | Never in production code. Only in admin seed scripts |
| Client-side-only availability checking | Simpler architecture | Race conditions when two leaders schedule the same person simultaneously | Acceptable for single-leader churches; must add DB constraints before multi-admin |
| Single notification channel (email only) | Faster implementation | Church volunteers are 18-70 years old; many prefer SMS or push. Low adoption | Acceptable for Phase 1 if notification system is abstracted for channel addition |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Realtime (live schedule updates) | Subscribing in Server Components; creating subscriptions that never unsubscribe on unmount | Realtime subscriptions belong in Client Components only. Use `useEffect` cleanup. Combine with `router.refresh()` to re-fetch server data after realtime events |
| Supabase Auth + Next.js Middleware | Not refreshing tokens in middleware, causing stale sessions in Server Components | Middleware must call `supabase.auth.getUser()` on every request. Use `@supabase/ssr` package's `createServerClient` with cookie handlers |
| CCLI SongSelect (song licensing) | Building a custom song database instead of integrating with CCLI where churches already track licenses | Design song schema to accommodate CCLI song numbers and license data. Even without API integration, the data model should support it |
| Email/SMS notifications (Resend, Twilio) | Sending notifications synchronously in Server Actions, causing slow UI responses | Use Supabase Edge Functions or database webhooks (pg_net) for async notification delivery. Queue notifications, don't send inline |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries in schedule view (load service, then each position, then each assignment, then each person) | Schedule page takes 2-5 seconds to load | Use Supabase's nested select syntax or database views that join schedule data. Design API to return full schedule in one query | 50+ assignments per service (medium church) |
| Unindexed RLS policy columns | All authenticated queries slow down proportionally to table size | Index `user_id`, `team_id`, `church_id` on every table. Run `EXPLAIN ANALYZE` on key queries through the client SDK (not SQL Editor) | 1,000+ rows in any RLS-protected table |
| Loading full song library on every scheduling page | Initial page load grows with song count over months/years | Paginate song lists. Use search with `tsvector` full-text index instead of `LIKE '%query%'`. Lazy-load song details | 500+ songs (2-3 years of active use) |
| Materializing all future recurring services | Memory and query cost grows unbounded over time | Generate recurring instances on demand within a date window (e.g., next 8 weeks). Never materialize more than needed for the current view | Any church after 6 months of use |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| RLS enabled on main tables but not on related tables (e.g., `song_arrangements`, `equipment_assignments`) | Attackers query unprotected tables to infer schedule data, member contact info | Enable RLS on EVERY table in the public schema. Use Supabase's Security Advisor to detect tables with RLS disabled |
| Exposing volunteer contact info (phone, email) to all authenticated users | Privacy violation, especially for minors in youth ministry teams | RLS policy: only team leaders and admins see contact details. Regular members see names only. Separate `profiles_public` and `profiles_private` or column-level policies via views |
| INSERT policies without `WITH CHECK` clause | Users can insert rows with arbitrary `user_id` or `church_id`, accessing other organizations' data | Every INSERT and UPDATE policy must have `WITH CHECK` matching the `USING` clause. Test by attempting cross-tenant inserts |
| Storing CCLI credentials or API keys in client-accessible Supabase columns | License keys exposed to any authenticated user | Store sensitive integration credentials in Supabase Vault or environment variables, never in regular tables |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Calendar-centric scheduling view only | Church admins think in terms of "this Sunday's lineup," not calendar grids. Forces mental translation between calendar dates and service structure | Default view should be service-centric: "Feb 16 - 9am Service" with positions listed. Calendar view is secondary |
| No bulk scheduling (one assignment at a time) | Scheduling a 5-position band for 4 weeks = 20 individual actions. Admins abandon the app | Build bulk assign: select people, select date range, assign to recurring positions in one action |
| Confirmation workflow that blocks the whole schedule | One unconfirmed volunteer prevents publishing the schedule | Allow partial publishing. Show confirmed vs. pending status per position. Let admins set deadlines after which unconfirmed slots auto-open for swaps |
| Desktop-only design | Volunteers check schedules on their phones (often right before service). Leaders make last-minute changes from the parking lot | Mobile-first for volunteer views (my schedule, confirm/decline). Desktop-first for admin views (full schedule grid, bulk operations) |
| No "my upcoming schedule" summary | Volunteers must dig through full church calendar to find their assignments | Prominent dashboard showing "Your next 4 weeks" with confirm/decline actions front and center |

## "Looks Done But Isn't" Checklist

- [ ] **Scheduling:** Often missing timezone handling -- churches with online/multi-campus services span timezones. Verify all dates stored as UTC with timezone-aware display
- [ ] **Conflict detection:** Often missing cross-team conflicts -- a person on both worship and tech teams could be scheduled for overlapping services. Verify conflicts check across ALL team memberships, not just within one team
- [ ] **Notifications:** Often missing "quiet hours" and frequency caps -- sending 5 confirmation emails at 11pm will get the app uninstalled. Verify notification batching and time-window respect
- [ ] **Availability:** Often missing recurring availability patterns -- "I'm never available on the 1st Sunday" vs one-time blackout dates. Verify both recurring and one-time availability blocking
- [ ] **Song library:** Often missing key/arrangement per-service -- the same song in different keys for different worship leaders. Verify songs are linked to services with per-instance key/arrangement overrides
- [ ] **Permissions:** Often missing "view-only" role -- church staff who need to see schedules but not edit them (e.g., senior pastor). Verify read-only access role exists beyond admin/leader/member
- [ ] **Data export:** Often missing entirely -- churches need to print schedules, export to bulletin software. Verify PDF/print view of weekly schedule

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Flat role model (no per-team roles) | HIGH | Add `team_memberships` table, migrate existing role data, rewrite all RLS policies, update all permission checks in UI. Expect 1-2 weeks |
| Recurring events stored as rows | HIGH | Design RRULE schema, write migration to extract patterns from existing rows, rewrite calendar/scheduling queries. Expect 2-3 weeks |
| Missing multi-tenancy (`church_id`) | VERY HIGH | Add column to every table, backfill data, rewrite every RLS policy, audit every query for data leakage. Expect 3-4 weeks and high regression risk |
| RLS performance issues | MEDIUM | Add indexes, rewrite policies to use `SECURITY DEFINER` functions, test with `EXPLAIN ANALYZE`. Expect 3-5 days |
| Auth token mismatch | LOW | Follow official Supabase SSR guide, refactor client creation utilities, add middleware. Expect 1-2 days |
| No decline/swap workflow | MEDIUM-HIGH | Add state machine to assignment model, build swap UI, add notification triggers. Expect 1-2 weeks. Harder if existing data has no status tracking |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Recurring events as rows | Phase 1: Schema Design | RRULE column exists in service_templates; no unbounded row generation |
| RLS full table scans | Phase 1: Schema + Phase 2: Auth/RLS | `EXPLAIN ANALYZE` on key queries shows index scans, not seq scans, with 1000+ test rows |
| Flat role model | Phase 1: Schema Design | `team_memberships` table exists with per-team role column; no `role` column on `users` |
| Missing decline/swap workflow | Phase 2-3: Scheduling Core | Assignment model has status enum with at least: pending, confirmed, declined, swap_requested |
| Server/Client auth mismatch | Phase 1-2: Auth Setup | Session persists across server navigation; expired tokens auto-refresh via middleware; no hydration mismatches |
| Multi-tenancy afterthought | Phase 1: Schema Design | Every table has `church_id`; every RLS policy includes church_id check; `current_church_id()` helper function exists |
| Unprotected related tables | Phase 2: RLS Implementation | Supabase Security Advisor shows 0 tables with RLS disabled in public schema |
| Contact info exposure | Phase 2: Auth/Permissions | Non-leader users cannot see email/phone of other members via any query path |
| N+1 schedule queries | Phase 3: Scheduling UI | Schedule page loads in <500ms with 20+ assignments (verified via browser DevTools) |
| No bulk scheduling | Phase 3: Scheduling UI | Admin can assign a person to a position across 4+ weeks in a single action |

## Sources

- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- HIGH confidence, official docs
- [Supabase RLS Best Practices: Production Patterns for Multi-Tenant Apps](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) -- MEDIUM confidence
- [Supabase Row Level Security Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security) -- MEDIUM confidence
- [Setting up Server-Side Auth for Next.js (Supabase Docs)](https://supabase.com/docs/guides/auth/server-side/nextjs) -- HIGH confidence, official docs
- [Using Realtime with Next.js (Supabase Docs)](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) -- HIGH confidence, official docs
- [Recurring Events Database Design (Redgate)](https://www.red-gate.com/blog/again-and-again-managing-recurring-events-in-a-data-model) -- MEDIUM confidence
- [Recurring Calendar Events Database Design (Medium)](https://medium.com/@aureliadotlim/recurring-calendar-events-database-design-dc872fb4f2b5) -- LOW confidence
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) -- MEDIUM confidence
- [Optimizing RLS Performance with Supabase](https://www.antstack.com/blog/optimizing-rls-performance-with-supabase/) -- MEDIUM confidence
- [Supabase RLS: The #1 Mistake That Exposes Your Database](https://vibeappscanner.com/blog/supabase-rls-complete-guide) -- MEDIUM confidence
- [The Complete Guide to Scheduling Church Volunteers (2026)](https://ministryschedulerpro.com/blog/the-complete-guide-to-scheduling-church-volunteers) -- MEDIUM confidence, domain reference
- [13 Best Planning Center Alternatives (2026)](https://theleadpastor.com/tools/best-planning-center-alternatives/) -- LOW confidence, landscape reference

---
*Pitfalls research for: Church worship team scheduling (Planning Center clone)*
*Researched: 2026-02-13*
