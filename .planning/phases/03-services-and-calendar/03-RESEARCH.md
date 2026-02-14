# Phase 3: Services & Calendar - Research

**Researched:** 2026-02-14
**Domain:** Service CRUD, calendar month view with color-coded events, recurring service patterns, service duplication, Supabase schema design
**Confidence:** HIGH

## Summary

Phase 3 introduces the core scheduling entity -- "services" -- with CRUD operations, a calendar month view for the dashboard, recurring service patterns, and service duplication. The technical challenge has three parts: (1) designing a Supabase schema for services with configurable types and optional recurrence patterns, (2) building a custom calendar month view using the already-installed `react-day-picker` v9 (with custom `Day`/`DayButton` components to render color-coded service indicators), and (3) implementing recurring service generation (weekly, biweekly, monthly) that materializes individual service instances from a pattern.

The existing codebase provides clear patterns to follow: server actions in `lib/{domain}/actions.ts` with Zod v4 validation, query functions in `lib/{domain}/queries.ts`, schemas in `lib/{domain}/schemas.ts`, and components in `components/{domain}/`. The admin client (`createAdminClient()`) bypasses RLS for mutations while RLS-protected reads use the anon-key client. All Phase 3 libraries are already installed -- `date-fns` v4.1.0 for date manipulation, `react-day-picker` v9.13.1 for the calendar component, `react-hook-form` + `zod` for forms, and `shadcn/ui` for Card, Dialog, Badge, Table, and Select components.

**Primary recommendation:** Use a **materialized instances** approach for recurring services -- store a recurrence pattern (frequency, interval, day-of-week, end date) in a `service_recurrence_patterns` table, then generate individual `services` rows when the pattern is created. This is simpler than on-demand generation (no RRULE parsing at runtime, individual services can be edited/deleted independently, assignments attach to real service rows). Use `date-fns` for all date generation logic (no need for the `rrule` library for the simple weekly/biweekly/monthly patterns required). Store service types in a `service_types` table (configurable, not enum) to satisfy SERV-08. The calendar view should use `react-day-picker` v9 with a custom `DayButton` component to render colored dots for services on each day.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.95.3 | Database queries for services | Already installed; used in all existing query/action patterns |
| `@supabase/ssr` | ^0.8.0 | Server-side Supabase client | Already installed; used in server actions and server components |
| `date-fns` | ^4.1.0 | Date manipulation, recurring date generation, formatting | Already installed; `addWeeks`, `addMonths`, `eachWeekOfInterval`, `startOfMonth`, `endOfMonth`, `format`, `isSameDay`, `isSameMonth` |
| `react-day-picker` | ^9.13.1 | Calendar month view component | Already installed; shadcn/ui Calendar wraps this. v9 supports custom `Day`/`DayButton` components for rendering event indicators |
| `react-hook-form` | ^7.71.1 | Service creation/edit form state | Already installed; established pattern in profiles/teams |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for react-hook-form | Already installed |
| `zod` | ^4.3.6 | Schema validation for service data | Already installed; used in all server actions |
| `lucide-react` | ^0.563.0 | Icons (Calendar, Clock, Copy, Plus, ChevronLeft, ChevronRight, etc.) | Already installed |
| `sonner` | ^2.0.7 | Toast notifications for CRUD feedback | Already installed |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Card | (installed) | Stats cards on dashboard, service list items | Dashboard layout: upcoming services count, unassigned positions, pending confirmations |
| shadcn/ui Dialog | (installed) | Create/edit service modal | Service CRUD forms |
| shadcn/ui Select | (installed) | Service type selection, recurrence pattern dropdowns | Form fields for type, frequency |
| shadcn/ui Badge | (installed) | Service type color indicators, status badges | Color-coded type badges in calendar and list views |
| shadcn/ui Table | (installed) | Upcoming services list (desktop) | Desktop view of services list |
| shadcn/ui Calendar | (installed) | Base component wrapping react-day-picker | Starting point for service calendar (needs customization) |
| shadcn/ui Popover | (installed) | Date picker popover for service date selection | Service creation form date field |
| shadcn/ui Tabs | (installed) | Calendar/list view toggle on dashboard | Switch between calendar and upcoming list views |

### No New Dependencies Required
All libraries needed for Phase 3 are already installed. No `pnpm add` commands needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom date-fns recurring logic | `rrule` library (2.8.1) | rrule is 687KB, last published 2 years ago, and overkill for weekly/biweekly/monthly patterns. date-fns `addWeeks`/`addMonths` is simpler and already installed. Only consider rrule if RFC 5545 iCal export is needed (v2 feature). |
| Materialized service instances | Pattern-only with runtime generation | Pattern-only is elegant but complex: assignments need to reference real service rows, each instance needs independent editing, and Phase 4/6/7 all FK to services. Materializing instances upfront is simpler for this use case. |
| Custom calendar grid (`div` grid) | `react-day-picker` with custom components | Custom grid gives more control but duplicates date math, keyboard nav, and a11y that react-day-picker handles. Customize via `components` prop instead. |
| Postgres enum for service types | Separate `service_types` table | SERV-08 requires configurable types. Enum requires migrations to add types; a table allows runtime configuration. |
| `react-big-calendar` or `@fullcalendar/react` | `react-day-picker` (already installed) | These are full calendar frameworks (30-100KB+). The requirement is a simple month view with dots -- react-day-picker with custom components is lighter and already installed. |

## Architecture Patterns

### Recommended Project Structure (Phase 3 additions)
```
app/
  (app)/
    dashboard/
      page.tsx                    # Services dashboard (calendar + upcoming list + stats)
    services/
      new/
        page.tsx                  # Create service page (or use dialog on dashboard)
      [serviceId]/
        page.tsx                  # Service detail page (preparation for Phase 4 assignments)
        edit/
          page.tsx                # Edit service (or dialog)

lib/
  services/
    actions.ts                    # Server Actions: createService, updateService, deleteService,
                                  #   duplicateService, createRecurringServices, createServiceType,
                                  #   updateServiceType, deleteServiceType
    queries.ts                    # Query functions: getServices, getServicesByMonth, getServiceById,
                                  #   getUpcomingServices, getServiceTypes, getServiceStats
    schemas.ts                    # Zod schemas for service validation
    recurrence.ts                 # Pure date-fns logic for generating recurring dates
    constants.ts                  # Default service types, recurrence options

components/
  services/
    service-calendar.tsx          # Month view calendar with color-coded service dots
    service-list.tsx              # Upcoming services list with stats
    service-stats.tsx             # Stats cards (upcoming count, unassigned, pending)
    service-form-dialog.tsx       # Create/edit service dialog
    service-type-manager.tsx      # Admin UI for configuring service types
    recurring-service-dialog.tsx  # Create recurring services dialog
    duplicate-service-dialog.tsx  # Duplicate service to new date dialog
```

### Pattern 1: Materialized Recurring Services
**What:** When admin creates a recurring pattern (e.g., "every Sunday morning for 3 months"), generate individual `services` rows immediately. Store the pattern metadata in `service_recurrence_patterns` for reference and future regeneration.
**When to use:** Always for this app -- assignments (Phase 4), setlists (Phase 7), and notifications (Phase 6) all FK to individual service rows.
**Example:**
```typescript
// lib/services/recurrence.ts
import { addWeeks, addMonths, eachWeekOfInterval, startOfMonth, endOfMonth } from "date-fns";

type RecurrenceFrequency = "weekly" | "biweekly" | "monthly";

interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate: Date;
  dayOfWeek?: number; // 0=Sun, 1=Mon, ...
}

export function generateRecurringDates(pattern: RecurrencePattern): Date[] {
  const dates: Date[] = [];
  let current = pattern.startDate;

  while (current <= pattern.endDate) {
    dates.push(new Date(current));
    switch (pattern.frequency) {
      case "weekly":
        current = addWeeks(current, 1);
        break;
      case "biweekly":
        current = addWeeks(current, 2);
        break;
      case "monthly":
        current = addMonths(current, 1);
        break;
    }
  }

  return dates;
}
```

### Pattern 2: Custom Calendar Day with Service Indicators
**What:** Extend shadcn/ui Calendar's `DayButton` component to render colored dots below the date number, representing services on that day.
**When to use:** Dashboard calendar month view (SERV-02, SERV-09).
**Example:**
```typescript
// Source: react-day-picker v9 custom components API (https://daypicker.dev/guides/custom-components)
import { type DayButtonProps } from "react-day-picker";
import { isSameDay } from "date-fns";

interface ServiceDot {
  date: Date;
  color: string;
  typeLabel: string;
}

function ServiceDayButton(
  props: DayButtonProps & { services: ServiceDot[] }
) {
  const dayServices = props.services?.filter((s) =>
    isSameDay(s.date, props.day.date)
  ) ?? [];

  return (
    <button {...props}>
      <span>{props.day.date.getDate()}</span>
      {dayServices.length > 0 && (
        <div className="flex gap-0.5 justify-center mt-0.5">
          {dayServices.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="size-1.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
```

### Pattern 3: Server Action with Admin Client (Established Pattern)
**What:** All service mutations use `createAdminClient()` to bypass RLS, with role checking via `getUserRole()`.
**When to use:** All create/update/delete operations.
**Example:**
```typescript
// lib/services/actions.ts -- follows exact pattern from lib/teams/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceSchema } from "./schemas";

export async function createService(
  data: unknown,
): Promise<{ success: true; serviceId: string } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = createServiceSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid service data." };
  }

  const admin = createAdminClient();
  const { data: service, error } = await admin
    .from("services")
    .insert({ /* ... mapped fields ... */ })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true, serviceId: service.id };
}
```

### Pattern 4: Month-Scoped Queries for Calendar
**What:** Query services for a specific month range to populate the calendar, rather than fetching all services.
**When to use:** Calendar view data loading.
**Example:**
```typescript
// lib/services/queries.ts
import { startOfMonth, endOfMonth } from "date-fns";

export async function getServicesByMonth(year: number, month: number) {
  const supabase = await createClient();
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));

  const { data, error } = await supabase
    .from("services")
    .select(`
      id, title, service_date, start_time, end_time, duration_minutes,
      service_types(id, name, color)
    `)
    .gte("service_date", start.toISOString().split("T")[0])
    .lte("service_date", end.toISOString().split("T")[0])
    .order("service_date")
    .order("start_time");

  if (error) throw error;
  return data ?? [];
}
```

### Anti-Patterns to Avoid
- **Storing recurrence as RRULE string only:** Without materializing instances, assignments and setlists cannot FK to services. Always create real service rows.
- **Postgres enum for service types:** Requires a migration to add new types. Use a `service_types` table instead for runtime configuration (SERV-08).
- **Fetching all services for calendar:** Always scope queries by month range. The app could have hundreds of services within a year.
- **Building a fully custom calendar grid:** Reinvents date math, keyboard navigation, and accessibility. Use react-day-picker's custom components instead.
- **Storing times as full `timestamptz`:** Service dates should be `date` (no timezone) and times should be `time` (local church time). The church operates in a single timezone.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar month grid layout | Custom CSS grid with date math | `react-day-picker` v9 with custom `DayButton` | Handles month boundaries, outside days, keyboard nav, a11y, RTL |
| Date arithmetic (add weeks/months) | Manual `Date` manipulation | `date-fns` `addWeeks`, `addMonths`, `addDays` | Edge cases: month boundaries, leap years, DST transitions |
| Month start/end boundaries | Manual calculation | `date-fns` `startOfMonth`, `endOfMonth` | Handles varying month lengths, leap years |
| Date formatting | `Date.toLocaleDateString()` | `date-fns` `format` | Consistent formatting across browsers, timezone-safe |
| Form validation | Manual field checks | `zod` schemas + `react-hook-form` | Type-safe, reusable, error message generation |
| Color-coded type indicators | Inline color logic | `service_types` table with `color` column | Single source of truth, admin-configurable |

**Key insight:** The "calendar with colored events" requirement looks complex but decomposes into two simple parts: (1) a standard react-day-picker month view with custom DayButton rendering, and (2) a Supabase query filtered by month range. The real complexity is in the data model -- getting the service/type/recurrence schema right so Phase 4 (assignments) and Phase 7 (setlists) can build on it cleanly.

## Common Pitfalls

### Pitfall 1: Timezone Confusion in Service Dates
**What goes wrong:** Storing service dates as `timestamptz` causes dates to shift when displayed in different timezones or when Supabase returns UTC timestamps that get offset by the browser.
**Why it happens:** Church services happen at a local date+time, not a UTC instant. A "Sunday March 3" service is always March 3 regardless of timezone.
**How to avoid:** Use `date` (not `timestamptz`) for the service date column, and `time` (not `timestamptz`) for start/end times. Parse dates carefully in JavaScript -- `new Date("2026-03-03")` in some environments interprets as UTC midnight, which can be "March 2" locally. Use `date-fns` `parseISO` or construct dates explicitly.
**Warning signs:** Services appearing on the wrong day in the calendar; dates shifting by one day.

### Pitfall 2: react-day-picker v9 Component API Changes
**What goes wrong:** Using v8 API patterns (like `DayContent`, `onSelect` with `SelectSingleEventHandler`) that changed in v9.
**Why it happens:** Many tutorials and examples online are for v8. The project has v9.13.1 installed. The shadcn/ui Calendar component already wraps v9 correctly.
**How to avoid:** Reference the v9 docs at `daypicker.dev/guides/custom-components`. In v9, customize via `components={{ Day: CustomDay, DayButton: CustomDayButton }}`. The `Day` component controls the `<td>` wrapper; `DayButton` controls the interactive button inside. For service indicators (dots below the date), customize `DayButton`.
**Warning signs:** TypeScript errors about missing or changed props; components not rendering.

### Pitfall 3: Recurring Pattern Edits Breaking Existing Services
**What goes wrong:** Admin edits a recurring pattern (e.g., changes time from 10am to 9am) and expects all future instances to update, but materialized instances are already independent rows.
**Why it happens:** Materialized instances are detached from the pattern after creation. No automatic sync.
**How to avoid:** When editing a recurring pattern, offer three options: (1) edit this instance only, (2) edit all future instances (re-generate from pattern), (3) edit all instances. Store `recurrence_pattern_id` FK on each service for traceability. Clearly communicate to the user that editing a pattern can regenerate instances.
**Warning signs:** Users confused about why changing a pattern doesn't update existing services.

### Pitfall 4: Duplicate Service Missing Relationship Copies
**What goes wrong:** SERV-07 says "copies assignments and setlist" but the duplicate function only copies the service row, missing FK relationships.
**Why it happens:** Phase 3 creates the service table but assignments (Phase 4) and setlists (Phase 7) don't exist yet.
**How to avoid:** Design the `duplicateService` action to be extensible -- copy the service row now, and in Phase 4/7, extend it to also copy assignments and setlist items. Add a TODO comment in the action for future phases. For Phase 3, duplicate copies: title, type, time, duration, rehearsal date, notes.
**Warning signs:** N/A until Phase 4/7 -- just document the extension point.

### Pitfall 5: Stats Cards Showing Stale Data
**What goes wrong:** Dashboard stats (upcoming services, unassigned positions, pending confirmations) show stale counts after a service is created/deleted.
**Why it happens:** Server components cache aggressively. If `revalidatePath` misses the dashboard, stats are stale.
**How to avoid:** Call `revalidatePath("/dashboard")` in all service mutation actions. For stats that depend on assignments (Phase 4), the counts will be 0/placeholder until Phase 4 is implemented -- design the UI to handle this gracefully (show "N/A" or hide the card).
**Warning signs:** Creating a service but the "upcoming services" count doesn't update.

## Code Examples

Verified patterns from official sources and existing codebase:

### Database Schema: Services Table
```sql
-- Migration: 00005_services
-- Creates service_types, services, service_recurrence_patterns tables

-- 1. Service types (configurable, not enum) -- SERV-08
create table public.service_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,          -- e.g., 'sunday-morning', 'wednesday'
  label text not null,                -- e.g., 'Sunday Morning', 'Wednesday'
  color text not null default '#6366f1', -- hex color for calendar dots
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed default service types
insert into public.service_types (name, label, color, sort_order) values
  ('sunday-morning', 'Sunday Morning', '#6366f1', 1),
  ('sunday-evening', 'Sunday Evening', '#8b5cf6', 2),
  ('wednesday', 'Wednesday', '#22c55e', 3),
  ('special-event', 'Special Event', '#f59e0b', 4);

-- 2. Services -- SERV-01, SERV-06
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  service_date date not null,
  start_time time not null,
  end_time time,                       -- estimated end time (SERV-06)
  duration_minutes int,                -- alternative to end_time
  service_type_id uuid references public.service_types(id) on delete set null,
  rehearsal_date date,                 -- SERV-06
  rehearsal_time time,
  rehearsal_notes text,                -- SERV-06
  notes text,
  recurrence_pattern_id uuid,          -- FK added after pattern table exists
  is_cancelled boolean not null default false,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_date on public.services(service_date);
create index idx_services_type on public.services(service_type_id);

-- 3. Recurrence patterns -- SERV-05
create table public.service_recurrence_patterns (
  id uuid primary key default gen_random_uuid(),
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  day_of_week int check (day_of_week between 0 and 6), -- 0=Sunday
  service_type_id uuid references public.service_types(id) on delete set null,
  start_date date not null,
  end_date date not null,
  start_time time not null,
  end_time time,
  duration_minutes int,
  title_template text,                 -- e.g., 'Sunday Morning Service'
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Add FK from services to patterns
alter table public.services
  add constraint fk_services_recurrence_pattern
  foreign key (recurrence_pattern_id)
  references public.service_recurrence_patterns(id)
  on delete set null;

-- 4. RLS policies
alter table public.service_types enable row level security;
create policy "Authenticated users can view service types"
  on public.service_types for select
  to authenticated using (true);

alter table public.services enable row level security;
create policy "Authenticated users can view services"
  on public.services for select
  to authenticated using (true);

alter table public.service_recurrence_patterns enable row level security;
create policy "Authenticated users can view recurrence patterns"
  on public.service_recurrence_patterns for select
  to authenticated using (true);

-- 5. updated_at trigger for services
create trigger set_services_updated_at
  before update on public.services
  for each row
  execute function public.update_updated_at_column();
```

### Zod Schema: Service Validation
```typescript
// lib/services/schemas.ts
import { z } from "zod";

export const serviceTypeSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Lowercase with hyphens"),
  label: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color"),
});

export const createServiceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM").optional(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
  serviceTypeId: z.string().uuid().optional(),
  rehearsalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rehearsalTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  rehearsalNotes: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string().uuid(),
});

export const createRecurringSchema = z.object({
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
  serviceTypeId: z.string().uuid().optional(),
  titleTemplate: z.string().min(1).max(200),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
```

### Recurring Date Generation (Pure date-fns)
```typescript
// lib/services/recurrence.ts
import { addWeeks, addMonths, parseISO, isBefore, isEqual } from "date-fns";

export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly";

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export function generateRecurringDates(config: RecurrenceConfig): Date[] {
  const dates: Date[] = [];
  const start = parseISO(config.startDate);
  const end = parseISO(config.endDate);
  let current = start;

  while (isBefore(current, end) || isEqual(current, end)) {
    dates.push(new Date(current));
    switch (config.frequency) {
      case "weekly":
        current = addWeeks(current, 1);
        break;
      case "biweekly":
        current = addWeeks(current, 2);
        break;
      case "monthly":
        current = addMonths(current, 1);
        break;
    }
  }

  return dates;
}
```

### Controlled Calendar Month View
```typescript
// Source: react-day-picker v9 docs (https://daypicker.dev/docs/navigation)
import { useState } from "react";
import { DayPicker } from "react-day-picker";

export function ServiceCalendar({ services }: { services: ServiceDot[] }) {
  const [month, setMonth] = useState(new Date());

  return (
    <DayPicker
      mode="single"
      month={month}
      onMonthChange={setMonth}
      modifiers={{
        hasService: services.map((s) => s.date),
      }}
      modifiersClassNames={{
        hasService: "has-service",
      }}
      components={{
        DayButton: (props) => <ServiceDayButton {...props} services={services} />,
      }}
    />
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-day-picker v8 `DayContent` | v9 `Day`/`DayButton` custom components | v9 (late 2024) | Component API changed; use `components` prop with new component names |
| RRULE string storage only | Materialized instances + pattern reference | Industry practice | Simpler assignment/setlist FK; independent instance editing |
| Postgres enum for types | Configurable types table | N/A (design choice) | Avoids migration for new types; admin UI for configuration |
| `date-fns` v3 | `date-fns` v4 (installed) | v4 (2024) | ESM-first, tree-shakeable; same function names, import from `"date-fns"` |
| `new Date("YYYY-MM-DD")` | `parseISO("YYYY-MM-DD")` from date-fns | Ongoing best practice | Avoids timezone-dependent parsing inconsistencies across browsers |

**Deprecated/outdated:**
- `react-day-picker` v8 API: `DayContentProps`, `SelectSingleEventHandler` are gone in v9. Use v9 `DayButtonProps`, `components` prop.
- `rrule` library (2.8.1): Not deprecated, but last published 2 years ago and overkill for this use case. Only needed if RFC 5545 iCal export is required (deferred to v2 per REQUIREMENTS.md).

## Open Questions

1. **Service detail page scope in Phase 3**
   - What we know: SERV-01 through SERV-09 define service creation and dashboard views. Phase 4 adds assignment UI on the service detail page.
   - What's unclear: Should Phase 3 create a basic service detail page (`/services/[serviceId]`) as a scaffold for Phase 4, or is the dashboard calendar + list sufficient?
   - Recommendation: Create a basic detail page showing service info (date, time, type, notes, rehearsal). This gives Phase 4 a page to add the assignment UI to, and provides a natural click-through target from the calendar/list.

2. **Dashboard layout: calendar and list coexistence**
   - What we know: SERV-02 requires calendar month view; SERV-03 requires upcoming services list; SERV-04 requires stats cards. All on the dashboard.
   - What's unclear: Should calendar and list be side-by-side (desktop) or tabbed? How does mobile layout work?
   - Recommendation: Desktop -- stats cards on top, then a two-column layout (calendar left, upcoming list right). Mobile -- stats cards, then tabs to switch between calendar and list views. This follows the common dashboard pattern and keeps all info accessible.

3. **Recurring pattern date boundaries**
   - What we know: Admin creates a recurring pattern with start/end date.
   - What's unclear: What's a reasonable maximum end date? Should there be a "generate forever" option?
   - Recommendation: Cap at 1 year (52 weekly instances max = ~52 rows). Provide a "Extend recurring services" action to generate the next batch. This prevents accidental creation of thousands of services.

4. **Stats cards data availability**
   - What we know: SERV-04 requires "unassigned positions" and "pending confirmations" stats.
   - What's unclear: Assignments don't exist until Phase 4. How should these stats appear in Phase 3?
   - Recommendation: Show "upcoming services" count (available now) and placeholder/disabled cards for "unassigned positions" and "pending confirmations" with a "Coming soon" or simply 0. Alternatively, only show the stats cards that have real data.

## Sources

### Primary (HIGH confidence)
- `/date-fns/date-fns` (Context7) - date manipulation API: `addWeeks`, `addMonths`, `format`, `parseISO`, `startOfMonth`, `endOfMonth`
- `/websites/daypicker_dev` (Context7) - react-day-picker v9 custom components, modifiers, controlled month navigation, DayButton API
- Existing codebase patterns: `lib/teams/actions.ts`, `lib/teams/queries.ts`, `lib/teams/schemas.ts`, `supabase/migrations/00003_serving_teams.sql`

### Secondary (MEDIUM confidence)
- [react-day-picker v9 custom components guide](https://daypicker.dev/guides/custom-components) - Day/DayButton customization API
- [react-day-picker v9 navigation docs](https://daypicker.dev/docs/navigation) - Controlled month state with `month`/`onMonthChange`
- [rrule.js GitHub](https://github.com/jkbrzt/rrule) - API for weekly/biweekly/monthly rules (considered but not recommended for this use case)
- [Thoughtbot: Recurring Events and PostgreSQL](https://thoughtbot.com/blog/recurring-events-and-postgresql) - Pattern-based vs instance-based storage tradeoffs
- [HN discussion on recurring events](https://news.ycombinator.com/item?id=18477975) - Materialized instances + pattern reference as industry consensus

### Tertiary (LOW confidence)
- [rrule npm package](https://www.npmjs.com/package/rrule) - Version 2.8.1, 687KB unpacked, last published 2+ years ago
- Shadcn/ui calendar examples from community - Various implementations of event calendars with color indicators (not verified against specific versions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed; no new dependencies. Verified date-fns and react-day-picker APIs via Context7.
- Architecture: HIGH - Follows exact patterns established in Phase 1/2 (actions/queries/schemas/components structure). Schema design follows Supabase migration patterns from `00003_serving_teams.sql`.
- Pitfalls: HIGH - Timezone handling, react-day-picker v8->v9 API changes, and recurring pattern materialization are well-documented challenges with clear solutions.
- Recurring events: MEDIUM - Decision to use materialized instances over pattern-only is a design choice backed by industry consensus but not validated against this specific use case at scale. For a single-church app with <200 services/year, this approach is well within safe bounds.

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days - stable libraries, no expected breaking changes)
