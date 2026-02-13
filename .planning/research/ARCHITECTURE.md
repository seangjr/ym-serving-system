# Architecture Research

**Domain:** Church worship team scheduling (Planning Center clone)
**Researched:** 2026-02-13
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Schedule │  │   Team   │  │  Service  │  │  Admin/Settings  │    │
│  │  Views   │  │ Manager  │  │ Planner   │  │    Dashboard     │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬──────────┘    │
│       │              │             │                │               │
├───────┴──────────────┴─────────────┴────────────────┴───────────────┤
│                     Data Access Layer (Server)                       │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │ Server Actions│  │  Query Fns     │  │   Auth Middleware      │  │
│  │ (mutations)   │  │  (reads)       │  │   (session + roles)    │  │
│  └───────┬───────┘  └───────┬────────┘  └──────────┬─────────────┘  │
│          │                  │                      │                │
├──────────┴──────────────────┴──────────────────────┴────────────────┤
│                        Supabase Platform                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Postgres │  │   Auth   │  │ Realtime │  │     Storage      │    │
│  │ + RLS    │  │  + JWT   │  │  (live)  │  │  (files/media)   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Schedule Views | Display/manage weekly service schedules, assignments, availability | Server Components with Suspense boundaries; Client Components for drag-drop interactions |
| Team Manager | CRUD for teams, positions, members, and role assignments | Server Actions for mutations, Server Components for lists |
| Service Planner | Build service orders (songs, elements, notes, times) | Client Component with optimistic updates; Supabase Realtime for collaboration |
| Admin Dashboard | Org settings, user management, permissions, reporting | Server Components, protected by admin role check |
| Server Actions | All write operations (create, update, delete) | `"use server"` functions with Zod validation + auth checks |
| Query Functions | All read operations with org-scoped data access | Async functions called in Server Components, using server Supabase client |
| Auth Middleware | Session refresh, route protection, role injection | Next.js middleware + Supabase SSR auth helpers |
| Postgres + RLS | Data storage with row-level security enforcing org/role isolation | Policies using `auth.uid()` and custom claims via membership table |
| Realtime | Live updates for schedule changes, notifications | Supabase Realtime channels scoped per organization |
| Storage | Song sheets, chord charts, media attachments | Supabase Storage with RLS policies matching org membership |

## Recommended Project Structure

```
app/
├── (auth)/                    # Auth route group (no layout chrome)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── callback/route.ts      # OAuth/magic-link callback
├── (dashboard)/               # Main app with sidebar layout
│   ├── layout.tsx             # Sidebar nav, org switcher, user menu
│   ├── page.tsx               # Dashboard home / upcoming services
│   ├── schedule/              # Service scheduling
│   │   ├── page.tsx           # Weekly/monthly calendar view
│   │   └── [serviceId]/
│   │       └── page.tsx       # Single service plan detail
│   ├── teams/                 # Team management
│   │   ├── page.tsx           # All teams list
│   │   └── [teamId]/
│   │       └── page.tsx       # Team detail + members
│   ├── people/                # Member directory
│   │   └── page.tsx
│   ├── songs/                 # Song library
│   │   ├── page.tsx
│   │   └── [songId]/page.tsx
│   ├── my/                    # Personal views (any role)
│   │   ├── schedule/page.tsx  # My upcoming assignments
│   │   └── availability/page.tsx
│   └── settings/              # Org admin settings
│       ├── page.tsx
│       ├── teams/page.tsx
│       └── members/page.tsx
├── api/                       # Route handlers (webhooks, cron)
│   └── webhooks/
├── globals.css
└── layout.tsx                 # Root layout (fonts, providers)

lib/
├── supabase/
│   ├── client.ts              # Browser Supabase client
│   ├── server.ts              # Server Component/Action client
│   └── middleware.ts          # Middleware client for session refresh
├── actions/                   # Server Actions (all mutations)
│   ├── schedule.ts
│   ├── teams.ts
│   ├── members.ts
│   ├── songs.ts
│   └── availability.ts
├── queries/                   # Server-side read functions
│   ├── schedule.ts
│   ├── teams.ts
│   ├── members.ts
│   └── songs.ts
├── validators/                # Zod schemas for all entities
│   ├── schedule.ts
│   ├── teams.ts
│   └── members.ts
├── types/                     # TypeScript types (inferred from Zod + Supabase)
│   └── database.ts            # Generated via `supabase gen types`
└── utils/
    ├── auth.ts                # Auth helpers (getUser, requireAuth, requireRole)
    └── dates.ts               # Date/recurrence utilities

components/
├── ui/                        # shadcn/ui primitives
├── schedule/                  # Schedule-specific components
├── teams/                     # Team-specific components
└── shared/                    # Org switcher, role badge, etc.
```

### Structure Rationale

- **`app/(dashboard)/`**: Route group applies the authenticated sidebar layout to all main app pages without affecting the URL structure.
- **`lib/actions/` + `lib/queries/`**: Hard separation between reads and writes. Server Actions handle mutations with Zod validation; query functions are called directly in Server Components. This is the "Data Access Layer" pattern recommended by the Next.js team.
- **`lib/supabase/`**: Three client variants (browser, server, middleware) following Supabase's official SSR pattern. Each uses the correct cookie strategy for its runtime context.
- **`lib/validators/`**: Zod schemas are the single source of truth for shapes. TypeScript types are inferred via `z.infer<>`. Runtime validation in Server Actions catches bad data before it hits the database.
- **`components/`**: Domain-grouped components alongside shadcn/ui primitives. Keeps UI logic close to its feature.

## Architectural Patterns

### Pattern 1: Data Access Layer (Server Actions + Query Functions)

**What:** All database access goes through two layers: query functions for reads (called in Server Components) and Server Actions for writes. No direct Supabase calls from Client Components.
**When to use:** Every data interaction in the app.
**Trade-offs:** More boilerplate per feature, but provides a single enforcement point for auth checks, validation, and error handling. Prevents accidental client-side data leaks.

**Example:**
```typescript
// lib/queries/schedule.ts
import { createClient } from "@/lib/supabase/server";

export async function getUpcomingServices(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(`
      id, name, service_date, service_type_id,
      assignments(id, position_id, member_id, status,
        members(id, first_name, last_name),
        positions(id, name)
      )
    `)
    .eq("org_id", orgId)
    .gte("service_date", new Date().toISOString())
    .order("service_date", { ascending: true });

  if (error) throw error;
  return data;
}
```

```typescript
// lib/actions/schedule.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/utils/auth";

const AssignSchema = z.object({
  serviceId: z.string().uuid(),
  positionId: z.string().uuid(),
  memberId: z.string().uuid(),
});

export async function assignMember(input: z.infer<typeof AssignSchema>) {
  const parsed = AssignSchema.parse(input);
  await requireRole(["admin", "team_lead"]);

  const supabase = await createClient();
  const { error } = await supabase.from("assignments").insert({
    service_id: parsed.serviceId,
    position_id: parsed.positionId,
    member_id: parsed.memberId,
    status: "pending",
  });

  if (error) throw error;
}
```

### Pattern 2: Organization-Scoped Multi-Tenancy via Membership Table

**What:** Every data table has an `org_id` column. A central `org_memberships` table maps users to organizations with roles. RLS policies use a `has_role_on_org()` function to check membership. No custom JWT claims needed for basic access -- the membership table is the source of truth.
**When to use:** All org-scoped data access.
**Trade-offs:** Slightly slower than JWT-claim-based checks (requires a subquery), but far more flexible: role changes take effect immediately without re-issuing tokens. For a church app with <10K users this is the right trade-off.

**Example:**
```sql
-- Core membership function (security definer = runs with table owner privileges)
create or replace function public.has_role_on_org(
  target_org_id uuid,
  required_role text default null
) returns boolean
language sql security definer stable
set search_path = ''
as $$
  select exists(
    select 1 from public.org_memberships
    where user_id = (select auth.uid())
      and org_id = target_org_id
      and (required_role is null or role = required_role)
  );
$$;

-- RLS policy on services table
create policy "org members can view services"
  on public.services for select to authenticated
  using (public.has_role_on_org(org_id));

-- RLS policy: only admin/team_lead can insert
create policy "leads can create services"
  on public.services for insert to authenticated
  with check (public.has_role_on_org(org_id, 'admin')
    or public.has_role_on_org(org_id, 'team_lead'));
```

### Pattern 3: Generic Teams/Positions (Ministry-Agnostic Schema)

**What:** Teams and positions are data, not schema. A `teams` table stores any ministry (Worship, AV, Ushers, Kids, etc.). A `positions` table stores roles within a team (Vocalist, Drummer, Camera Operator). A `team_memberships` table links members to teams with optional position qualifications. New ministries are added by inserting rows, not altering tables.
**When to use:** The entire scheduling domain.
**Trade-offs:** Requires careful UI to manage the flexible structure. Worth it because churches constantly add/rename/reorganize teams.

**Example:**
```sql
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id),
  name text not null,              -- "Worship Team", "AV Team", "Ushers"
  description text,
  color text,                      -- UI color for calendar
  created_at timestamptz default now()
);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,              -- "Lead Vocals", "Drums", "Camera 1"
  quantity_needed int default 1,   -- How many per service
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  role text not null default 'member', -- 'leader' | 'member'
  qualified_positions uuid[],     -- position IDs this person can fill
  created_at timestamptz default now(),
  unique(team_id, member_id)
);
```

## Data Flow

### Request Flow (Read)

```
[Browser]
    ↓ (navigate to /schedule)
[Next.js Middleware]
    ↓ (refresh Supabase auth token via cookies)
[Server Component: app/(dashboard)/schedule/page.tsx]
    ↓ (call getUpcomingServices(orgId))
[Query Function: lib/queries/schedule.ts]
    ↓ (Supabase server client with user's session cookie)
[Supabase Postgres]
    ↓ (RLS evaluates: does user belong to this org?)
[Filtered rows returned]
    ↓
[Server Component renders HTML]
    ↓
[Browser receives streamed HTML + RSC payload]
```

### Mutation Flow (Write)

```
[Client Component: "Assign Member" button click]
    ↓ (call Server Action)
[Server Action: lib/actions/schedule.ts]
    ↓ (1. Zod validates input)
    ↓ (2. requireRole() checks user's org role)
    ↓ (3. Supabase insert with server client)
[Supabase Postgres]
    ↓ (RLS policy: has_role_on_org(org_id, 'team_lead'))
[Row inserted]
    ↓
[Server Action returns / revalidatePath()]
    ↓
[Client Component re-renders with fresh data]
```

### Realtime Flow (Live Updates)

```
[Supabase Realtime]
    ↓ (Postgres change on 'assignments' table, filtered by org_id)
[Client Component subscribes to channel]
    ↓ (on INSERT/UPDATE/DELETE callback)
[Local state updated / optimistic UI reconciled]
```

### Key Data Flows

1. **Scheduling flow:** Admin creates a service (date, type) -> adds positions needed -> assigns members to positions -> members receive notification -> members confirm/decline -> schedule updates in real time.
2. **Availability flow:** Member sets recurring or one-off availability -> scheduling UI shows availability status per member -> auto-schedule suggests members based on availability + qualifications + rotation fairness.
3. **Song planning flow:** Leader adds songs to a service order -> members see setlist with keys, tempos, attachments -> song usage history tracked for repetition awareness.
4. **Notification flow:** Assignment created/changed -> Supabase database trigger or Edge Function fires -> sends email/push via external service (Resend, FCM) -> notification record stored for in-app display.

## Supabase Schema Design

### Core Entity Relationship

```
organizations
  ├── org_memberships (user_id, role: admin|team_lead|member)
  ├── teams
  │     ├── positions
  │     └── team_memberships (member_id, qualified_positions[])
  ├── members (profile data, linked to auth.users)
  ├── service_types ("Sunday Morning", "Wednesday Night")
  ├── services (date, service_type_id)
  │     ├── assignments (position_id, member_id, status)
  │     └── service_items (song_id | custom element, order)
  ├── songs (title, artist, key, tempo, attachments)
  ├── availability (member_id, date_range, available: bool)
  ├── announcements (title, body, target_team_id?)
  └── notifications (user_id, type, payload, read_at)
```

### RLS Strategy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| organizations | Owner or member | Authenticated (creates own) | Admin only | Admin only |
| org_memberships | Member of org | Admin only | Admin only | Admin (not self) |
| teams | Member of org | Admin / team_lead | Admin / team_lead | Admin |
| positions | Member of org | Admin / team_lead | Admin / team_lead | Admin / team_lead |
| members | Member of org | Admin | Admin / self | Admin |
| services | Member of org | Admin / team_lead | Admin / team_lead | Admin |
| assignments | Member of org | Admin / team_lead | Admin / team_lead / self (status only) | Admin / team_lead |
| availability | Member of org | Self | Self | Self |
| songs | Member of org | Admin / team_lead | Admin / team_lead | Admin |
| notifications | Self only | System (service_role) | Self (mark read) | Self |

### Performance-Critical Index Strategy

```sql
-- Every org-scoped table needs this
create index idx_services_org_id on services(org_id);
create index idx_teams_org_id on teams(org_id);
create index idx_members_org_id on members(org_id);

-- Membership lookups (used in every RLS policy)
create index idx_org_memberships_user_org on org_memberships(user_id, org_id);
create index idx_team_memberships_team_member on team_memberships(team_id, member_id);

-- Schedule queries (frequent, date-range filtered)
create index idx_services_org_date on services(org_id, service_date);
create index idx_assignments_service on assignments(service_id);
create index idx_assignments_member on assignments(member_id);

-- Availability lookups
create index idx_availability_member_date on availability(member_id, date_start, date_end);
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-500 users (single church) | Monolith is perfect. Single Supabase project, no caching needed. RLS handles everything. |
| 500-5K users (multi-church) | Add connection pooling (Supavisor, enabled by default). Consider materialized views for schedule summary dashboards. Add Supabase Edge Functions for notification fan-out. |
| 5K-50K users (platform) | Partition large tables by org_id. Move notification delivery to a queue (Supabase Edge Functions + pg_cron). Consider read replicas for reporting queries. Cache hot schedule data at the edge. |

### Scaling Priorities

1. **First bottleneck:** RLS policy evaluation on `org_memberships` joins. Fix with proper indexes on `(user_id, org_id)` and using `(select auth.uid())` cached form in policies.
2. **Second bottleneck:** Notification fan-out on large teams. Fix by moving to async delivery via Edge Functions + queue table rather than synchronous triggers.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Supabase Mutations

**What people do:** Call `supabase.from('services').insert(...)` directly from Client Components.
**Why it's wrong:** Bypasses server-side validation, exposes mutation logic to the client, makes auth checks rely entirely on RLS (which silently fails rather than returning helpful errors), and prevents revalidation of server-rendered data.
**Do this instead:** Route all mutations through Server Actions. Use RLS as a safety net, not the primary authorization mechanism.

### Anti-Pattern 2: Role in JWT Custom Claims (for Mutable Roles)

**What people do:** Store org role in `app_metadata` or custom JWT claims, then check claims in RLS policies.
**Why it's wrong:** Role changes require token refresh or re-login to take effect. In a church context, admins promote team leads frequently -- stale JWTs mean new permissions don't apply until the user logs out and back in.
**Do this instead:** Use the `org_memberships` table as the role source of truth. Check membership in RLS policies via the `has_role_on_org()` function. Role changes are instant.

### Anti-Pattern 3: One Table Per Ministry

**What people do:** Create `worship_team`, `av_team`, `ushers` as separate tables with different schemas.
**Why it's wrong:** Every new ministry requires schema migration, new RLS policies, new query functions, and new UI components. Impossible to build a generic scheduling interface.
**Do this instead:** Use the generic `teams` + `positions` + `team_memberships` pattern. All ministries share the same schema. The UI renders dynamically based on team/position data.

### Anti-Pattern 4: Over-Relying on Supabase Realtime for State

**What people do:** Subscribe to Realtime for all data and keep everything in client state.
**Why it's wrong:** Initial page load requires fetching everything client-side (slow). Realtime subscriptions multiply with table count. Server Components become useless.
**Do this instead:** Use Server Components for initial data load. Add Realtime subscriptions only for truly live features (active service editing, live notifications). Most scheduling data is read-heavy and changes infrequently.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Email notifications (Resend) | Supabase Edge Function triggered by DB webhook | Batch notifications per service to avoid spam |
| Push notifications (FCM/APNs) | Edge Function → Firebase Admin SDK | Store device tokens in `user_devices` table |
| Calendar sync (iCal/Google) | API route generating .ics feed per user | Read-only export; filter by user's assignments |
| File uploads (chord charts, PDFs) | Supabase Storage with org-scoped buckets | RLS on storage matches org membership |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Server Components ↔ Supabase | Server Supabase client (cookies-based) | Always call `cookies()` before Supabase calls |
| Client Components ↔ Server | Server Actions (mutations), props from Server Components (reads) | Never pass Supabase client to client |
| Middleware ↔ Auth | Supabase middleware client | Refreshes token on every request; sets updated cookies |
| Realtime ↔ Client | Browser Supabase client subscribing to channels | Scoped by org_id; use RLS-enabled channels |
| Edge Functions ↔ Postgres | Service role client (bypasses RLS) | For system operations: notifications, cron jobs |

## Build Order (Dependency Chain)

Based on the architecture above, components should be built in this order:

1. **Auth + Org foundation** (no other feature works without this)
   - Supabase project setup, auth configuration
   - `organizations`, `org_memberships`, `members` tables + RLS
   - Login/signup flows, middleware, session management
   - `has_role_on_org()` function

2. **Teams + Positions** (scheduling depends on these)
   - `teams`, `positions`, `team_memberships` tables + RLS
   - Team CRUD UI, position management, member assignment to teams

3. **Services + Scheduling** (core value prop, depends on teams)
   - `service_types`, `services`, `assignments` tables + RLS
   - Service creation, assignment UI, schedule views (weekly/monthly)
   - Member confirmation/decline flow

4. **Availability** (enhances scheduling, depends on members + services)
   - `availability` table + RLS
   - Availability input UI, schedule integration

5. **Songs + Service Planning** (enriches services, can parallel with #4)
   - `songs`, `service_items` tables + RLS
   - Song library, service order builder

6. **Notifications + Realtime** (enhances everything, depends on assignments existing)
   - `notifications` table, Edge Functions for delivery
   - Realtime subscriptions for schedule changes
   - Email/push integration

7. **Files + Media** (enhances songs/services, can parallel with #6)
   - Supabase Storage configuration
   - File upload UI, attachment to songs/services

8. **Announcements + Polish** (depends on org + teams)
   - `announcements` table + RLS
   - Dashboard widgets, reporting, calendar export

## Sources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- HIGH confidence
- [Supabase Custom Claims and RBAC](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/custom-claims-and-role-based-access-control-rbac.mdx) -- HIGH confidence (Context7)
- [Supabase RLS Best Practices: Production Patterns (Makerkit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) -- MEDIUM confidence
- [Next.js + Supabase: What I'd Do Differently](https://catjam.fi/articles/next-supabase-what-do-differently) -- MEDIUM confidence
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- HIGH confidence
- [Multi-Tenant Applications with RLS on Supabase (AntStack)](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) -- MEDIUM confidence
- [Next.js v16 App Router Documentation](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/02-guides/data-security.mdx) -- HIGH confidence (Context7)
- [Planning Center Services](https://www.planningcenter.com/services) -- Feature reference

---
*Architecture research for: Church worship team scheduling system*
*Researched: 2026-02-13*
