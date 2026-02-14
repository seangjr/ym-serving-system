# Phase 5: Availability Management - Research

**Researched:** 2026-02-14
**Domain:** Member availability management (blackout dates, recurring patterns), calendar UI, scheduling integration with availability warnings
**Confidence:** HIGH

## Summary

Phase 5 adds member availability management to the serving system. Members can declare when they are unavailable -- both one-time blackout dates (single day or date ranges) and recurring patterns (weekly, biweekly, monthly) -- and the scheduling system surfaces these as soft warnings during assignment. The phase touches three areas: (1) database schema for storing availability data, (2) a dedicated `/availability` page with an interactive calendar for managing blackout dates and recurring patterns, and (3) integration with the existing Phase 4 assignment workflow to show availability warnings in the combobox dropdown and confirmation dialog.

The existing codebase provides all infrastructure needed. The `react-day-picker` v9 (already installed at ^9.13.1) supports `mode="multiple"` for clicking individual dates and `mode="range"` for selecting date ranges, with `modifiers` and `modifiersClassNames` for visual styling of unavailable dates. The `date-fns` library (already installed at ^4.1.0) provides all date arithmetic needed for recurring pattern expansion (`addWeeks`, `addMonths`, `getDay`, `isSameDay`). The existing `generateRecurringDates()` function in `lib/services/recurrence.ts` provides a proven pattern for expanding recurrence rules into concrete dates. The conflict dialog and soft-block pattern from Phase 4 (`ConflictDialog` component, `assignMember` server action with `forceAssign` flag) provide the exact UI pattern for availability warnings -- the same "Assign anyway?" flow applies.

**Primary recommendation:** Create two new tables (`member_blackout_dates` for one-time blackouts and `member_recurring_unavailability` for recurring patterns). Expand recurring patterns into concrete dates at query time using application-level logic (matching the existing `recurrence.ts` approach). Integrate availability checks into the existing `getEligibleMembers()` query to pre-compute `isUnavailable` alongside the existing `hasConflict` flag, and modify the `assignMember()` server action to check availability and return an unavailability warning (similar to the existing conflict flow). Build the `/availability` page as a new sidebar item using the existing `ServiceCalendar` pattern with a custom `DayButton` that shows unavailable dates.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Blackout date entry
- Both calendar click (single dates) and date range picker (multi-day blocks like vacations)
- Full day only -- no partial-day (AM/PM) granularity
- Optional free-text reason field visible to team leads (e.g. "Family vacation", "Exams")
- Dedicated /availability page in the sidebar nav (not buried in profile)

#### Availability calendar
- Everyone can view availability -- members see teammates' availability (read-only), not just their own
- Individual member view: calendar with unavailable dates highlighted (on /availability page)
- Team overlay view: calendar showing "X/Y available" count per date for team leads when scheduling
- Both views available: individual for managing own dates, team overlay for leads referencing during scheduling

#### Scheduling warnings
- Soft block: unavailable members can be assigned, but require explicit "Assign anyway?" confirmation
- Warnings appear in both places: warning icon/label in the assignment combobox dropdown + confirmation dialog after selection
- Unavailable members keep same alphabetical sort position in dropdown (just with warning icon, not moved to bottom or hidden)
- Service detail page shows an availability banner at top: "3 members unavailable on this date" with expandable list of who and why

#### Recurring patterns
- Members and team leads can both set recurring patterns (leads can set on behalf of their team members)

### Claude's Discretion
- Recurring pattern types (weekly, biweekly, monthly, nth-day-of-month) -- pick what fits church scheduling context
- Whether recurring patterns have optional or required end dates
- Visual distinction between recurring vs one-time unavailability on calendar
- Calendar visual style for unavailable dates (shaded cells, dots, hatching -- consistent with existing service calendar)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.95.3 | Database queries for availability CRUD, team member lookups | Already installed; all query/action patterns use this |
| `@supabase/ssr` | ^0.8.0 | Server-side Supabase client | Already installed; used in server actions and server components |
| `react-day-picker` | ^9.13.1 | Calendar component for availability page (multiple/range selection modes, custom DayButton, modifiers) | Already installed; used by ServiceCalendar and dashboard. Supports `mode="multiple"`, `mode="range"`, `disabled` dates, `modifiers`, `modifiersClassNames` |
| `date-fns` | ^4.1.0 | Date arithmetic for recurring pattern expansion (`addWeeks`, `addMonths`, `getDay`, `isSameDay`, `isWithinInterval`, `eachDayOfInterval`, `format`, `parseISO`) | Already installed; used throughout codebase |
| `react-hook-form` | ^7.71.1 | Recurring pattern form, reason text input | Already installed; established form pattern |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for forms | Already installed |
| `zod` | ^4.3.6 | Schema validation for availability data | Already installed; used in all server actions |
| `lucide-react` | ^0.563.0 | Icons (CalendarOff, CalendarX, Clock, Repeat, AlertTriangle, ChevronDown, Trash2, Plus, Eye, Users) | Already installed |
| `sonner` | ^2.0.7 | Toast notifications for availability CRUD feedback | Already installed |
| `radix-ui` | ^1.4.3 | Collapsible for expandable unavailability banner, AlertDialog for delete confirmation, Tabs for view switching | Already installed |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Calendar | (installed) | Base calendar component that `react-day-picker` renders through | Availability calendar views |
| shadcn/ui Card | (installed) | Container for calendar and pattern list | Page layout |
| shadcn/ui AlertDialog | (installed) | Confirmation for "Assign anyway?" when member unavailable | Scheduling integration |
| shadcn/ui Badge | (installed) | Unavailability indicator badges | Calendar and dropdown |
| shadcn/ui Collapsible | (installed) | Expandable unavailability banner on service detail | Banner expansion |
| shadcn/ui Tabs | (installed) | Switch between "My Availability" and "Team Overview" views | Availability page |
| shadcn/ui Select | (installed) | Team/member selector for team overlay view | Team lead overlay |
| shadcn/ui Tooltip | (installed) | Hover to see reason for unavailability | Calendar and dropdown |
| shadcn/ui Dialog | (installed) | Recurring pattern creation/edit dialog | Pattern management |
| shadcn/ui Textarea | (installed) | Reason text field for blackout dates | Blackout entry |

### No New Dependencies Required
All libraries needed for Phase 5 are already installed. No `pnpm add` commands needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Application-level recurring expansion | Postgres `generate_series` + date arithmetic | App-level is simpler to test/debug, matches existing `recurrence.ts` pattern. Postgres-level would be faster for large date ranges but adds SQL complexity for patterns like "nth day of month." |
| Two tables (blackouts + recurring) | Single table with `is_recurring` flag | Two tables is cleaner -- blackouts have `start_date`/`end_date` while recurring patterns have `frequency`/`day_of_week`/`end_date`. Different schemas, different concerns. |
| Storing expanded dates in a materialized table | Expanding on-the-fly per query | On-the-fly is simpler and avoids stale data. Church scheduling looks at most 2-3 months ahead -- the expansion is trivial (max ~50 dates per pattern). Materialization adds complexity without meaningful performance benefit at this scale. |
| Custom calendar component | `react-day-picker` with custom DayButton | react-day-picker already handles month navigation, keyboard nav, a11y, date range selection, and custom day rendering. The existing `ServiceCalendar` proves this pattern works. |

## Architecture Patterns

### Recommended Project Structure (Phase 5 additions)
```
app/
  (app)/
    availability/
      page.tsx                      # NEW: /availability page (sidebar nav item)
      availability-calendar.tsx     # NEW: client component wrapping calendar with state
      blackout-manager.tsx          # NEW: client component for adding/deleting blackout dates
      recurring-pattern-dialog.tsx  # NEW: dialog for creating/editing recurring patterns
      recurring-pattern-list.tsx    # NEW: list of active recurring patterns
      team-overlay-calendar.tsx     # NEW: team view calendar showing X/Y counts
    services/
      [serviceId]/
        page.tsx                    # UPDATED: add availability banner
        assignment-slot.tsx         # UPDATED: add unavailability warning alongside conflict warning
        availability-banner.tsx     # NEW: "3 members unavailable" expandable banner

lib/
  availability/
    actions.ts                      # Server Actions: addBlackoutDate, addBlackoutRange,
                                    #   deleteBlackout, createRecurringPattern,
                                    #   updateRecurringPattern, deleteRecurringPattern,
                                    #   addBlackoutForMember (team lead on behalf)
    queries.ts                      # Query functions: getMyBlackouts, getMyRecurringPatterns,
                                    #   getMemberAvailability, getTeamAvailability,
                                    #   getUnavailableMembersForDate,
                                    #   expandRecurringPatterns (date expansion)
    schemas.ts                      # Zod schemas for availability data validation
    types.ts                        # TypeScript types for availability data
    recurrence.ts                   # Recurring pattern expansion logic
                                    #   (weekly, biweekly, monthly, nth-weekday-of-month)

supabase/
  migrations/
    00008_availability.sql          # member_blackout_dates, member_recurring_unavailability tables
```

### Pattern 1: Blackout Dates Table (One-Time Unavailability)
**What:** Stores individual blackout date entries. A single row can represent a single date OR a date range (vacation block). Full-day granularity only (DATE type, not TIMESTAMPTZ).
**When to use:** When a member clicks a date or selects a date range on the calendar.
**Schema:**
```sql
-- Source: Project-specific design following existing schema conventions
create table public.member_blackout_dates (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  start_date date not null,
  end_date date not null,      -- same as start_date for single-day blackouts
  reason text,                 -- optional, visible to team leads
  created_by uuid references public.members(id) on delete set null,
                               -- NULL = self, or team lead who set it
  created_at timestamptz not null default now(),
  -- Prevent duplicate overlapping blackouts for same member
  -- enforced at application level, not DB constraint
  -- (overlapping ranges are merged or rejected)
  constraint blackout_date_order check (end_date >= start_date)
);

create index idx_blackout_member_dates
  on public.member_blackout_dates (member_id, start_date, end_date);
```

### Pattern 2: Recurring Unavailability Table
**What:** Stores recurring unavailability patterns (e.g., "every Wednesday", "every other Sunday", "first Saturday of month"). Patterns are stored as rules and expanded to concrete dates at query time.
**When to use:** When a member sets a repeating unavailability pattern.
**Schema:**
```sql
create table public.member_recurring_unavailability (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  frequency text not null
    check (frequency in ('weekly', 'biweekly', 'monthly', 'nth_weekday')),
  day_of_week int not null check (day_of_week between 0 and 6),
                               -- 0=Sunday, 6=Saturday (JS convention)
  nth_occurrence int check (nth_occurrence between 1 and 5),
                               -- Only for 'nth_weekday': 1=first, 2=second, etc.
                               -- 5 = last occurrence
  start_date date not null,    -- pattern starts from this date
  end_date date,               -- NULL = no end date (ongoing)
  reason text,                 -- optional, visible to team leads
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recurring_member
  on public.member_recurring_unavailability (member_id);
```

### Pattern 3: Availability Query Integration (Extending getEligibleMembers)
**What:** The existing `getEligibleMembers()` function in `lib/assignments/queries.ts` already pre-computes conflict data per member. Phase 5 adds a parallel `isUnavailable` flag with the reason, using the same pre-computation strategy to avoid N+1 queries.
**When to use:** Every time the assignment combobox opens on a service detail page.
**Approach:**
```typescript
// Extend EligibleMember type
export interface EligibleMember {
  id: string;
  fullName: string;
  hasConflict: boolean;
  conflictDetails: { ... } | null;
  isUnavailable: boolean;                      // NEW
  unavailabilityReason: string | null;         // NEW
  positionIds: string[];
}

// In getEligibleMembers(), after fetching team members:
// 1. Get target service date
// 2. Query member_blackout_dates for members where service_date
//    falls within [start_date, end_date]
// 3. Expand member_recurring_unavailability patterns for service_date
// 4. Merge into unavailability map: memberId -> reason
```

### Pattern 4: Availability Warning in Assignment Flow (Soft Block)
**What:** Extends the existing conflict detection flow in `assignMember()` to also check availability. When a member is unavailable, the action returns an `{ unavailable: UnavailabilityInfo }` response (parallel to the existing `{ conflict: ConflictInfo }` response). The UI shows an "Assign anyway?" dialog, same pattern as scheduling conflicts.
**When to use:** When assigning an unavailable member.
**Flow:**
```
1. User selects member in combobox (warning icon visible)
2. Client calls assignMember() server action
3. Server checks: conflict? unavailable? both?
4. If unavailable && !forceAssign: return { unavailable: { reason, dates } }
5. Client shows "Assign anyway?" dialog (reuse ConflictDialog pattern)
6. User confirms -> calls assignMember() with forceAssign: true
7. Assignment created, revalidatePath()
```

### Pattern 5: Availability Calendar (Custom DayButton)
**What:** A custom `DayButton` component (same pattern as `ServiceDayButton` in `service-calendar.tsx`) that visually distinguishes unavailable dates on the calendar. Uses `react-day-picker` modifiers and custom styling.
**When to use:** The `/availability` page calendar view.
**Example:**
```tsx
// Source: Extends existing ServiceCalendar pattern
const AvailabilityCalendarContext = React.createContext<{
  blackoutDates: Set<string>;      // "YYYY-MM-DD" format
  recurringDates: Set<string>;     // expanded recurring dates
}>({ blackoutDates: new Set(), recurringDates: new Set() });

function AvailabilityDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const { blackoutDates, recurringDates } = React.useContext(
    AvailabilityCalendarContext
  );

  const dateKey = format(day.date, "yyyy-MM-dd");
  const isBlackout = blackoutDates.has(dateKey);
  const isRecurring = recurringDates.has(dateKey);
  const isUnavailable = isBlackout || isRecurring;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "...", // base calendar styles
        isBlackout && "bg-red-100 dark:bg-red-900/30",       // one-time
        isRecurring && !isBlackout && "bg-orange-100 dark:bg-orange-900/30 [background-image:repeating-linear-gradient(...)]", // recurring (hatched)
        className,
      )}
      {...props}
    >
      {props.children}
      {isUnavailable && (
        <span className="size-1.5 rounded-full bg-red-500" />
      )}
    </Button>
  );
}
```

### Pattern 6: Team Overlay Calendar (X/Y Available Counts)
**What:** For team leads, shows availability counts per date. Instead of individual member names, each date cell shows "X/Y available" where Y is total team members and X is those without blackouts/recurring unavailability on that date.
**When to use:** Team lead scheduling reference and the `/availability` page "Team Overview" tab.
**Approach:**
```typescript
// Server component queries for team overlay:
async function getTeamAvailability(teamId: string, month: Date) {
  // 1. Get all team members
  // 2. Get all blackout dates for team members in the month range
  // 3. Get all recurring patterns for team members
  // 4. Expand recurring patterns for the month range
  // 5. Build map: dateString -> { total, available, unavailableMembers[] }
  return availabilityMap;
}
```

### Anti-Patterns to Avoid
- **Storing expanded recurring dates in the database:** This creates stale data that must be kept in sync. Expand on-the-fly -- church scheduling rarely looks more than 3 months ahead.
- **Blocking assignment when member is unavailable:** User explicitly chose soft block. Always allow with confirmation, never prevent.
- **Querying availability per-member per-slot:** Same N+1 pitfall as Phase 4 conflict detection. Pre-compute all unavailability data for all team members on the service date in a single query batch.
- **Using TIMESTAMPTZ for blackout dates:** User chose full-day granularity. DATE type is correct. Church operates in single timezone (per MEMORY.md).
- **Making availability visible only to the member themselves:** User decided everyone can view teammates' availability. Team leads need this for scheduling decisions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar with date click/range selection | Custom calendar grid | `react-day-picker` v9 with `mode="multiple"` or `mode="range"` | Month navigation, keyboard nav, a11y, range selection all handled. Already used in project. |
| Recurring date expansion | Custom loop with manual date math | `date-fns` (`addWeeks`, `addMonths`, `setDay`, `getDay`) + proven `recurrence.ts` pattern | Edge cases: month boundaries, leap years, DST. date-fns handles them. |
| Confirmation dialog for unavailable members | Custom modal | shadcn/ui `AlertDialog` (same pattern as `ConflictDialog`) | Accessible, keyboard navigable, consistent with existing UX. |
| Visual distinction for unavailable dates | Manual CSS class toggling | `react-day-picker` `modifiers` + `modifiersClassNames` | Built-in modifier system handles per-day styling cleanly. |
| Team member count aggregation | Client-side counting | Server-side query with GROUP BY or application-level aggregation | Keeps client lightweight; data arrives ready to display. |

**Key insight:** Phase 5 is architecturally similar to Phase 4's conflict detection -- the same "pre-compute warnings, show in combobox, confirm before assignment" pattern applies. The main new work is the `/availability` page UI and the database schema for storing availability data. The scheduling integration is a well-understood extension of existing patterns.

## Common Pitfalls

### Pitfall 1: N+1 Queries When Checking Availability for All Team Members
**What goes wrong:** For each eligible member in the assignment combobox, a separate query checks their blackout dates and recurring patterns. With 20 team members, that is 40+ DB queries per service detail page load.
**Why it happens:** Naive implementation queries availability per-member.
**How to avoid:** Pre-fetch ALL blackout dates and recurring patterns for ALL team members on the service date in two batch queries (one for blackouts, one for recurring patterns). Build an in-memory map `memberId -> isUnavailable`. This is the same strategy used for conflict detection in `getEligibleMembers()`.
**Warning signs:** Slow service detail page loads, multiple Supabase queries in waterfall.

### Pitfall 2: Recurring Pattern Expansion Generating Excessive Dates
**What goes wrong:** A pattern with no end date could theoretically expand to thousands of dates if the query range is large.
**Why it happens:** Unbounded expansion without a safety cap.
**How to avoid:** Always cap expansion to a reasonable window -- the existing `MAX_INSTANCES = 52` pattern in `recurrence.ts` works. For availability queries, expand only within the queried month range (at most 31 days). For the team overlay, expand for the visible month only. Never expand more than 6 months ahead.
**Warning signs:** Slow availability calendar rendering, memory spikes.

### Pitfall 3: Overlapping Blackout Date Ranges
**What goes wrong:** A member adds a blackout for "Feb 10-15" and another for "Feb 13-18". Two overlapping ranges complicate queries and display.
**Why it happens:** No uniqueness constraint on date ranges (can't easily express "no overlapping ranges" in SQL without exclusion constraints).
**How to avoid:** At the application level, when adding a new blackout range, merge overlapping ranges. When the new range overlaps with existing ones, extend the existing range or merge multiple ranges into one. This keeps the data clean and avoids double-counting in availability queries.
**Warning signs:** Member appearing unavailable for duplicate reasons, confusing availability calendar display.

### Pitfall 4: Team Lead Setting Availability for Wrong Team's Members
**What goes wrong:** A team lead for Worship sets unavailability for a Sound team member they shouldn't manage.
**Why it happens:** Insufficient authorization check in the "set on behalf of" server action.
**How to avoid:** When `created_by != member_id` (team lead acting on behalf), verify the team lead has `team_members.role = 'lead'` for a team that the target member also belongs to. Use the existing `canManageTeamAssignments()` authorization pattern from Phase 4.
**Warning signs:** Members seeing blackout dates they didn't create, team leads seeing "unauthorized" errors for their own team members.

### Pitfall 5: Stale Availability Data After Adding/Removing Blackouts
**What goes wrong:** After adding a blackout date, the availability calendar or assignment combobox shows old data.
**Why it happens:** Server actions update the DB but the page is not revalidated.
**How to avoid:** Call `revalidatePath('/availability')` and `revalidatePath('/services/[serviceId]')` in every availability server action. Same pattern as all existing server actions in the codebase.
**Warning signs:** Blackout dates appear only after manual page refresh.

### Pitfall 6: Biweekly Pattern Drift
**What goes wrong:** A "biweekly" pattern (every other Wednesday) starts drifting because the start_date reference point is lost.
**Why it happens:** Biweekly expansion from a fixed `start_date` must count weeks correctly. If the expansion starts from the wrong reference point, it selects the wrong weeks.
**How to avoid:** Always expand biweekly patterns from the original `start_date` forward, counting by adding 2 weeks at a time. When checking if a specific date matches, compute `weeksDiff = differenceInWeeks(targetDate, startDate)` and check `weeksDiff % 2 === 0`. Same approach used in `generateRecurringDates()`.
**Warning signs:** Biweekly pattern matching on the wrong alternating week.

## Claude's Discretion Recommendations

### Recurring Pattern Types
**Recommendation:** Four pattern types, covering the church scheduling context:

| Frequency | Description | Church Use Case |
|-----------|-------------|-----------------|
| `weekly` | Same day every week | "I'm unavailable every Wednesday" (midweek commitment) |
| `biweekly` | Same day every other week | "I can only serve every other Sunday" (shared custody, alternating commitments) |
| `monthly` | Same day-of-month | "I'm unavailable on the 1st of every month" (monthly commitment) |
| `nth_weekday` | Nth occurrence of weekday in month | "I'm unavailable every 2nd Saturday" (regular family event) |

The `nth_weekday` type uses the `nth_occurrence` column (1-5, where 5 = last). Combined with `day_of_week`, this covers patterns like "first Sunday of every month" or "last Saturday of every month" -- common in church scheduling contexts.

**Implementation:**
```typescript
// Expanding nth_weekday pattern for a given month
function getNthWeekdayOfMonth(
  year: number,
  month: number,    // 0-indexed
  dayOfWeek: number, // 0=Sun, 6=Sat
  nth: number,       // 1-5, where 5=last
): Date | null {
  if (nth === 5) {
    // Last occurrence: start from end of month, go backward
    const lastDay = endOfMonth(new Date(year, month));
    let current = lastDay;
    while (getDay(current) !== dayOfWeek) {
      current = subDays(current, 1);
    }
    return current;
  }
  // 1st-4th: start from first day, find nth occurrence
  const firstDay = startOfMonth(new Date(year, month));
  let count = 0;
  let current = firstDay;
  while (current.getMonth() === month) {
    if (getDay(current) === dayOfWeek) {
      count++;
      if (count === nth) return current;
    }
    current = addDays(current, 1);
  }
  return null; // month doesn't have this many occurrences
}
```

### End Dates for Recurring Patterns
**Recommendation:** Optional end dates. Recurring patterns can be ongoing (no end date) or time-bounded. This fits the church context:

- Ongoing: "I'm unavailable every Wednesday indefinitely" (regular outside commitment)
- Time-bounded: "I'm unavailable every other Sunday until June 2026" (temporary arrangement)

When `end_date` is NULL, the pattern expands up to the query window's end. The UI shows "No end date" as the default, with an optional date picker to set one.

### Visual Distinction: Recurring vs One-Time
**Recommendation:** Two visual treatments on the availability calendar:

| Type | Visual | Rationale |
|------|--------|-----------|
| One-time blackout | Solid red/rose background (`bg-red-100 dark:bg-red-900/30`) + small red dot | Definitive, manually set. Solid background = explicit block. |
| Recurring pattern | Diagonal hatching pattern (CSS `repeating-linear-gradient`) over orange/amber background (`bg-amber-50 dark:bg-amber-900/20`) + small orange dot | Repeating nature conveyed by the pattern. Amber differentiates from red. |
| Both (overlap) | Red takes precedence (solid red background) | One-time is more specific than a pattern. |

This creates clear visual distinction while remaining accessible. The hatching pattern is achievable with pure CSS:
```css
background-image: repeating-linear-gradient(
  45deg,
  transparent,
  transparent 3px,
  rgba(251, 146, 60, 0.15) 3px,
  rgba(251, 146, 60, 0.15) 6px
);
```

### Calendar Visual Style
**Recommendation:** Consistent with the existing service calendar approach:

- The availability calendar uses the same `Calendar` base component from shadcn/ui
- Custom `DayButton` component (same pattern as `ServiceDayButton` in `service-calendar.tsx`) with availability-specific styling
- Service dots (colored dots for services) remain visible alongside availability shading, so members can see both their services and their unavailability on the same calendar
- Past dates are dimmed (`opacity-50`) and not interactive (can't add blackouts for past dates)
- Today is highlighted with the existing `today` modifier styling

## Code Examples

Verified patterns from the existing codebase and official documentation:

### Blackout Date Server Action (follows established pattern)
```typescript
// Source: Follows lib/assignments/actions.ts pattern
"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { addBlackoutSchema } from "./schemas";

export async function addBlackoutDate(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  const parsed = addBlackoutSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const targetMemberId = parsed.data.memberId ?? callerId;
  if (!targetMemberId) return { error: "Not authenticated." };

  // If setting for someone else, verify team lead authorization
  if (targetMemberId !== callerId) {
    if (!isAdminOrCommittee(role)) {
      // Check team lead access (same pattern as canManageTeamAssignments)
      const admin = createAdminClient();
      const { data: sharedTeam } = await admin
        .from("team_members")
        .select("team_id")
        .eq("member_id", targetMemberId)
        .in("team_id",
          await admin.from("team_members")
            .select("team_id")
            .eq("member_id", callerId)
            .eq("role", "lead")
            .then(r => (r.data ?? []).map(t => t.team_id))
        );
      if (!sharedTeam || sharedTeam.length === 0) {
        return { error: "Unauthorized. Only team leads can set availability for their team members." };
      }
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("member_blackout_dates").insert({
    member_id: targetMemberId,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate ?? parsed.data.startDate,
    reason: parsed.data.reason || null,
    created_by: callerId !== targetMemberId ? callerId : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/availability");
  return { success: true };
}
```

### Availability Check Query (extends getEligibleMembers pattern)
```typescript
// Source: Extends existing lib/assignments/queries.ts pattern
export async function getUnavailableMembersForDate(
  memberIds: string[],
  serviceDate: string,
): Promise<Map<string, string | null>> {
  // Returns map of memberId -> reason (null if no reason given)
  const unavailableMap = new Map<string, string | null>();
  const supabase = await createClient();

  // 1. Check one-time blackout dates
  const { data: blackouts } = await supabase
    .from("member_blackout_dates")
    .select("member_id, reason")
    .in("member_id", memberIds)
    .lte("start_date", serviceDate)
    .gte("end_date", serviceDate);

  for (const b of blackouts ?? []) {
    unavailableMap.set(b.member_id, b.reason);
  }

  // 2. Check recurring patterns
  const { data: patterns } = await supabase
    .from("member_recurring_unavailability")
    .select("member_id, frequency, day_of_week, nth_occurrence, start_date, end_date, reason")
    .in("member_id", memberIds)
    .lte("start_date", serviceDate);
    // end_date filter applied in app code (NULL = no end)

  const targetDate = parseISO(serviceDate);

  for (const p of patterns ?? []) {
    if (p.end_date && serviceDate > p.end_date) continue;
    if (matchesRecurringPattern(targetDate, p)) {
      if (!unavailableMap.has(p.member_id)) {
        unavailableMap.set(p.member_id, p.reason);
      }
    }
  }

  return unavailableMap;
}
```

### Recurring Pattern Matcher
```typescript
// Source: Extends existing lib/services/recurrence.ts pattern
import {
  differenceInWeeks,
  getDate,
  getDay,
  getMonth,
  getYear,
  parseISO,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
} from "date-fns";

interface RecurringPattern {
  frequency: "weekly" | "biweekly" | "monthly" | "nth_weekday";
  day_of_week: number;
  nth_occurrence: number | null;
  start_date: string;
  end_date: string | null;
}

export function matchesRecurringPattern(
  date: Date,
  pattern: RecurringPattern,
): boolean {
  const startDate = parseISO(pattern.start_date);

  // Check day of week matches
  if (getDay(date) !== pattern.day_of_week) return false;

  switch (pattern.frequency) {
    case "weekly":
      return true; // same day of week, always matches

    case "biweekly": {
      const weeksDiff = differenceInWeeks(date, startDate);
      return weeksDiff >= 0 && weeksDiff % 2 === 0;
    }

    case "monthly": {
      // Same day of month as start_date
      return getDate(date) === getDate(startDate);
    }

    case "nth_weekday": {
      if (pattern.nth_occurrence === null) return false;
      // Check if date is the nth occurrence of this weekday in its month
      const nth = getNthOccurrenceInMonth(date);
      if (pattern.nth_occurrence === 5) {
        // "5" means last occurrence
        return isLastOccurrenceInMonth(date);
      }
      return nth === pattern.nth_occurrence;
    }

    default:
      return false;
  }
}

function getNthOccurrenceInMonth(date: Date): number {
  const dayOfMonth = getDate(date);
  return Math.ceil(dayOfMonth / 7);
}

function isLastOccurrenceInMonth(date: Date): boolean {
  const nextWeek = addDays(date, 7);
  return getMonth(nextWeek) !== getMonth(date);
}
```

### Availability Banner Component (Service Detail Page)
```tsx
// Source: New component following existing Card + Collapsible patterns
"use client";

import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface UnavailableMember {
  memberId: string;
  memberName: string;
  reason: string | null;
}

interface AvailabilityBannerProps {
  unavailableMembers: UnavailableMember[];
  totalMembers: number;
}

export function AvailabilityBanner({
  unavailableMembers,
  totalMembers,
}: AvailabilityBannerProps) {
  if (unavailableMembers.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30">
        <span className="font-medium">
          {unavailableMembers.length} member{unavailableMembers.length > 1 ? "s" : ""} unavailable on this date
        </span>
        <ChevronDown className="ml-auto size-4 transition-transform [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border border-amber-200/50 bg-amber-50/50 px-4 py-2 dark:border-amber-900/30 dark:bg-amber-900/10">
        <ul className="flex flex-col gap-1">
          {unavailableMembers.map((m) => (
            <li key={m.memberId} className="flex items-center gap-2 text-sm">
              <span className="font-medium">{m.memberName}</span>
              {m.reason && (
                <span className="text-muted-foreground">-- {m.reason}</span>
              )}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### RLS Policies for Availability Tables
```sql
-- Source: Follows established pattern from 00003, 00005, 00006 migrations

-- member_blackout_dates: everyone can read (need for team overlay and scheduling)
alter table public.member_blackout_dates enable row level security;
create policy "Authenticated users can view blackout dates"
  on public.member_blackout_dates for select
  to authenticated
  using (true);
-- Mutations go through server actions using createAdminClient()

-- member_recurring_unavailability: same pattern
alter table public.member_recurring_unavailability enable row level security;
create policy "Authenticated users can view recurring unavailability"
  on public.member_recurring_unavailability for select
  to authenticated
  using (true);
-- Mutations go through server actions using createAdminClient()
```

## Claude's Discretion Recommendations Summary

| Area | Recommendation | Confidence |
|------|---------------|------------|
| Recurring pattern types | `weekly`, `biweekly`, `monthly`, `nth_weekday` (4 types) | HIGH -- covers all common church scheduling patterns |
| End dates | Optional (NULL = ongoing) | HIGH -- both ongoing and time-bounded patterns are common |
| Visual distinction | Solid red for one-time, hatched amber for recurring | MEDIUM -- hatching pattern is distinctive but may need refinement during implementation |
| Calendar visual style | Same base as ServiceCalendar, red/amber shading, dots for unavailability, dimmed past dates | HIGH -- consistent with existing visual patterns |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard block on unavailability | Soft block with confirmation dialog | User decision (2026-02-14) | Members can always be assigned if needed, with explicit acknowledgment |
| Availability in profile page | Dedicated /availability page | User decision (2026-02-14) | Quick access, not buried in settings |
| Individual-only visibility | Team-wide visibility | User decision (2026-02-14) | Team leads can see who's available when scheduling |
| `react-day-picker` v8 single mode only | v9 with `mode="multiple"` and `mode="range"` | react-day-picker v9 (already installed) | Supports both single-click and range selection natively |

**Deprecated/outdated:**
- None. Phase 5 is new functionality, no existing availability features to deprecate.

## Open Questions

1. **Availability page: member selector for team leads**
   - What we know: Team leads can set availability on behalf of their team members. The UI needs a way to select which member they're managing.
   - What's unclear: Should the member selector be a dropdown at the top of the availability page, or a separate flow (e.g., navigate from team roster)?
   - Recommendation: Dropdown at the top of the `/availability` page. When a team lead or admin visits, they see their own availability by default plus a "Managing: [My Availability v]" dropdown to switch to a team member. Regular members only see their own view (no dropdown). This keeps navigation simple -- one page, one selector.

2. **Sidebar navigation placement**
   - What we know: `/availability` needs its own sidebar nav item. The current nav has Services, Teams, Team Roster, Songs, Announcements, Equipment, Reports, Files (for admin/committee).
   - What's unclear: Where in the nav order should it appear? Between which items?
   - Recommendation: Place "Availability" after "Team Roster" and before "Songs" in the admin/committee nav. For members, add it after "My Schedule" and before "Songs". Use the `CalendarOff` icon from lucide-react (calendar with X). This groups scheduling-related items (Services, Teams, Roster, Availability) together.

3. **Team overlay: which teams does a team lead see?**
   - What we know: Team leads see "X/Y available" per date. They lead specific teams.
   - What's unclear: Does a team lead see only their own team(s) or all teams?
   - Recommendation: Team leads see a team selector dropdown filtered to their led teams. Admin/committee can select any team. The team overlay shows data for one team at a time (not aggregated across all teams), since the count "X/Y available" only makes sense within a single team context.

4. **Availability data for the combobox: real-time or pre-computed?**
   - What we know: The existing combobox pre-computes conflict data server-side in `getEligibleMembers()`.
   - What's unclear: Should availability also be pre-computed in the same server-side query, or fetched lazily when the combobox opens?
   - Recommendation: Pre-compute in the same `getEligibleMembers()` call. This adds one batch query for blackouts and one for recurring patterns per team (not per member). For a service with 3 teams, that is 6 additional queries total -- acceptable. This keeps the combobox instant with no loading state.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- All patterns verified by reading actual source files:
  - `lib/assignments/queries.ts` -- `getEligibleMembers()` pattern for pre-computing conflict data per member
  - `lib/assignments/actions.ts` -- `assignMember()` pattern with `forceAssign` for confirmed conflicts, `canManageTeamAssignments()` authorization helper
  - `lib/services/recurrence.ts` -- `generateRecurringDates()` pattern for expanding recurrence rules, `MAX_INSTANCES` safety cap
  - `components/services/service-calendar.tsx` -- `ServiceCalendarContext` + custom `ServiceDayButton` pattern for per-day custom rendering
  - `components/ui/calendar.tsx` -- Base shadcn/ui Calendar component wrapping `react-day-picker` v9
  - `app/(app)/services/[serviceId]/conflict-dialog.tsx` -- Soft-block confirmation dialog pattern
  - `app/(app)/services/[serviceId]/assignment-slot.tsx` -- Combobox with warning icons, conflict/force-assign flow
  - `lib/auth/roles.ts` -- Navigation items (`ADMIN_NAV_ITEMS`, `MEMBER_NAV_ITEMS`, `getNavItems()`)
  - `supabase/migrations/00003_serving_teams.sql` -- Schema conventions (RLS, indexes, triggers, CHECK constraints)
  - `supabase/migrations/00006_assignments.sql` -- Schema conventions for Phase 4 tables
- **Context7: react-day-picker** (`/gpbl/react-day-picker`) -- `mode="multiple"` for multi-select, `mode="range"` for date range selection, `modifiers` + `modifiersClassNames` for custom day styling, `disabled` prop for preventing selection of past dates

### Secondary (MEDIUM confidence)
- **Context7: date-fns** (`/date-fns/date-fns`) -- `differenceInWeeks`, `getDay`, `addWeeks`, `addMonths`, `eachDayOfInterval` functions verified. v4 API stable.

### Tertiary (LOW confidence)
- None. All findings verified against existing codebase patterns or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and used in Phases 1-4. No new dependencies.
- Architecture: HIGH -- All patterns (server actions, queries, schemas, RLS, calendar components, conflict dialogs) are direct extensions of established Phase 3/4 patterns. Schema design follows existing conventions.
- Pitfalls: HIGH -- Identified from codebase analysis (N+1 queries, stale data, biweekly drift, authorization) with proven mitigation strategies from existing code.
- Claude's Discretion areas: HIGH -- Recurring pattern types and visual styles are well-reasoned for church scheduling context. Hatching pattern CSS is MEDIUM (may need visual tuning).

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable domain; no external library changes expected)
