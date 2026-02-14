# Phase 4: Scheduling & Assignments - Research

**Researched:** 2026-02-14
**Domain:** Service assignment scheduling UI, conflict detection, reusable templates, Supabase schema for assignments with state machine
**Confidence:** HIGH

## Summary

Phase 4 delivers the core value of the entire application: team leads and admins assign members to positions on services. This requires (1) a new `service_assignments` database table with a status state machine (pending/confirmed/declined/unassigned), per-service position slots via a `service_positions` join table, and a `schedule_templates` table for reusable configurations; (2) an assignment UI on the service detail page (`/services/[serviceId]`) with combobox-per-slot assignment, position grouping by category, and inline position add/remove; (3) conflict detection that compares overlapping service times (not same-day) with a confirmation dialog for intentional double-booking; and (4) template save/load for quickly replicating team configurations across services.

The existing codebase provides all patterns needed. Server actions follow the established `lib/{domain}/actions.ts` pattern with `createAdminClient()` for mutations and Zod validation. The service detail page (`app/(app)/services/[serviceId]/page.tsx`) already has a Phase 4 assignment placeholder card ready to be replaced. The shadcn/ui Combobox component (`@base-ui/react` Combobox primitive, already installed at v1.1.0) supports search filtering, keyboard navigation, and custom item rendering. The Collapsible component (Radix UI, already installed) can group positions by category. No new dependencies are required -- all libraries are already installed.

**Primary recommendation:** Create three new tables (`service_positions`, `service_assignments`, `schedule_templates`) with a migration that also enables the `btree_gist` extension for future exclusion constraints. Use the existing `team_positions` table as the source of available positions. Build the assignment UI as a client component on the service detail page, with the combobox using `Combobox.useFilter` for search and custom items showing member names with conflict warning icons. Conflict detection should be a server-side query at assignment time that checks for overlapping `start_time`/`end_time` ranges on the same `service_date`, returning conflict details for the confirmation dialog.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Assignment Interface
- Combobox/dropdown per position slot (not drag-and-drop) -- mobile-friendly, works across all devices
- Dropdown shows eligible members with **name + availability indicator** (warning icon if assigned to an overlapping service)
- No skill/proficiency filtering -- skills were removed from the system; eligible = member is on the team
- Assigned slot displays: **member name + status badge** (pending/confirmed/declined) -- compact, no avatars
- Per-assignment **notes supported** -- optional text field visible to the assigned member (e.g., "play cajon instead of drums")

#### Conflict & Warning Display
- Conflict = **overlapping service times only** (not same-day; morning + evening on same day is fine)
- When assigning a conflicting member: **confirmation dialog** -- "John is assigned as Drummer on Evening Service (5:00 PM). Assign anyway?"
- Dialog shows: conflicting **service name + position + time**
- After confirmed conflict: **persistent warning badge** stays on the slot so others can see the double-booking

#### Position Grouping & Roster Layout
- **Two-level hierarchy**: Team > Position Category (e.g., Worship Team > Vocals, Worship Team > Instruments)
- Position categories **expanded by default** (not collapsed)
- Unassigned slots: **dashed outline + "Assign" button** -- clearly visible empty state
- Team leads can **add/remove positions inline** on the scheduling page (per-service, not globally)
- Adding positions: **select from team's existing positions** (dropdown, not free-text)
- Can add **multiples of the same position** (e.g., 2 Vocalists, 3 Backup Singers)

### Claude's Discretion
- Template workflow (save/load team configurations) -- how templates are named, browsed, and applied
- Combobox search/filter behaviour and keyboard navigation
- Mobile-specific layout adaptations for the scheduling grid
- Status badge colour scheme (pending/confirmed/declined/unassigned)
- How position removal works when a member is already assigned

### Deferred Ideas (OUT OF SCOPE)
- Skill/proficiency system was removed -- stale references in roadmap success criteria and earlier phase docs need cleanup (housekeeping, not a phase)
- Accept/decline workflow -- Phase 6
- Availability/blackout dates affecting the dropdown -- Phase 5
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.95.3 | Database queries for assignments, conflict checks | Already installed; used in all query/action patterns |
| `@supabase/ssr` | ^0.8.0 | Server-side Supabase client | Already installed; used in server actions and server components |
| `@base-ui/react` | ^1.1.0 | Combobox primitive for member assignment dropdowns | Already installed; shadcn/ui Combobox wraps this. Supports `useFilter`, custom items, keyboard nav |
| `radix-ui` | ^1.4.3 | Collapsible primitive for position category grouping | Already installed; Collapsible, AlertDialog, Tooltip components |
| `react-hook-form` | ^7.71.1 | Assignment notes form, template name form | Already installed; established pattern |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver | Already installed |
| `zod` | ^4.3.6 | Schema validation for assignment/template data | Already installed; used in all server actions |
| `lucide-react` | ^0.563.0 | Icons (AlertTriangle, Plus, Minus, Save, Upload, UserPlus, ChevronDown, etc.) | Already installed |
| `sonner` | ^2.0.7 | Toast notifications for assignment CRUD feedback | Already installed |
| `date-fns` | ^4.1.0 | Time comparison for conflict detection | Already installed |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Combobox | (installed) | Member assignment per-slot dropdown | Core assignment interaction |
| shadcn/ui Collapsible | (installed) | Position category expand/collapse | Position grouping (expanded by default per user decision) |
| shadcn/ui AlertDialog | (installed) | Conflict confirmation dialog | When assigning a member with overlapping service |
| shadcn/ui Badge | (installed) | Assignment status badges (pending/confirmed/declined) | Status display on each slot |
| shadcn/ui Card | (installed) | Team/category grouping cards | Service assignment layout |
| shadcn/ui Dialog | (installed) | Template save/load dialog | Template workflow UI |
| shadcn/ui Select | (installed) | Position selection dropdown for adding positions | Adding positions from team's existing list |
| shadcn/ui Tooltip | (installed) | Conflict warning details on hover | Persistent warning badge hover info |
| shadcn/ui Separator | (installed) | Visual separation between teams/categories | Layout structure |
| shadcn/ui Textarea | (installed) | Per-assignment notes field | Notes input for each assignment |

### No New Dependencies Required
All libraries needed for Phase 4 are already installed. No `pnpm add` commands needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Combobox per slot | Drag-and-drop (dnd-kit) | User locked: combobox chosen for mobile-friendliness. Drag-and-drop impractical on phones with vertical scrolling. |
| Server-side conflict check | Client-side pre-fetch of all assignments | Server-side is more reliable (no stale data), returns authoritative conflict info. Client can display cached warnings but server validates. |
| `service_positions` join table | Direct reference to `team_positions` | Join table needed because a service can have multiple instances of the same position (e.g., 2 Vocalists) and positions can be added/removed per-service without affecting the team's global position list. |
| `btree_gist` extension for overlaps | Application-level time comparison | Extension enables Postgres-native range overlap queries. For Phase 4, application-level comparison is simpler since services use separate `service_date` + `start_time`/`end_time` columns (not range types). Reserve `btree_gist` for Phase 5+ if needed. |
| Materialized template (JSON blob) | Template as FK references to positions | JSON blob is simpler and decoupled from position ID changes. Templates store position names/categories, not UUIDs, making them resilient to position deletions. |

## Architecture Patterns

### Recommended Project Structure (Phase 4 additions)
```
app/
  (app)/
    services/
      [serviceId]/
        page.tsx                    # Updated: fetch assignments + teams data alongside service
        service-detail-actions.tsx  # Updated: add template save/load buttons
        assignment-panel.tsx        # NEW: main assignment UI (client component)
        assignment-slot.tsx         # NEW: single position slot with combobox + status badge
        position-adder.tsx          # NEW: inline position add dropdown
        template-dialog.tsx         # NEW: save/load template dialog

lib/
  assignments/
    actions.ts                      # Server Actions: assignMember, unassignMember, updateAssignmentNote,
                                    #   addServicePosition, removeServicePosition, checkConflicts,
                                    #   saveTemplate, loadTemplate, deleteTemplate
    queries.ts                      # Query functions: getServiceAssignments, getEligibleMembers,
                                    #   getMemberConflicts, getTemplates, getTemplateById
    schemas.ts                      # Zod schemas for assignment/template validation
    types.ts                        # Shared TypeScript types for assignment data

supabase/
  migrations/
    00006_assignments.sql           # service_positions, service_assignments, schedule_templates tables
```

### Pattern 1: Service Position Slots (Per-Service Position Instances)
**What:** Each service has its own set of position slots, copied from (but independent of) team positions. This allows adding multiples of the same position and per-service customization without affecting the team's global position configuration.
**When to use:** When rendering the assignment grid and when adding/removing positions inline.
**Schema:**
```sql
-- Source: Project-specific design based on requirements
create table public.service_positions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  team_id uuid not null references public.serving_teams(id) on delete cascade,
  position_id uuid not null references public.team_positions(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
-- Note: no UNIQUE constraint on (service_id, position_id) because multiples allowed
```

### Pattern 2: Assignment State Machine
**What:** Assignments have a status field with a CHECK constraint enforcing valid states. Status transitions are controlled by server actions -- Phase 4 only creates assignments as `pending`, while Phase 6 adds accept/decline transitions.
**When to use:** Every assignment interaction.
**Schema:**
```sql
create table public.service_assignments (
  id uuid primary key default gen_random_uuid(),
  service_position_id uuid not null references public.service_positions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'declined')),
  notes text,
  assigned_by uuid references public.members(id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(service_position_id) -- one member per slot; add another service_position for duplicate positions
);
```

### Pattern 3: Conflict Detection via Query (Not Constraint)
**What:** When assigning a member, query for other assignments where the member is assigned to a service with overlapping times on the same date. Return conflict details for the confirmation dialog rather than blocking at the DB level.
**When to use:** Every time a member is selected in the combobox, and before confirming the assignment.
**Query approach:**
```sql
-- Find services that overlap with the target service's time range
-- for a specific member (already assigned elsewhere)
SELECT sa.id, sa.status, sp.id as service_position_id,
       s.title, s.service_date, s.start_time, s.end_time,
       tp.name as position_name
FROM service_assignments sa
JOIN service_positions sp ON sa.service_position_id = sp.id
JOIN services s ON sp.service_id = s.id
JOIN team_positions tp ON sp.position_id = tp.id
WHERE sa.member_id = $1           -- the member being assigned
  AND s.service_date = $2         -- same date as target service
  AND s.id != $3                  -- exclude the current service
  AND s.start_time < $4           -- target end_time (or start_time + duration)
  AND (s.end_time > $5            -- target start_time
       OR s.end_time IS NULL)     -- if no end_time, assume overlap
  AND sa.status != 'declined';   -- don't warn about declined assignments
```

### Pattern 4: Template Save/Load (JSON Snapshot)
**What:** Templates store a snapshot of service positions with their team/position references. When loading, the system creates `service_positions` and optionally `service_assignments` from the template.
**When to use:** Saving a fully-configured service as a template, and loading it onto a new service.
**Schema:**
```sql
create table public.schedule_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  team_id uuid references public.serving_teams(id) on delete set null,
  positions jsonb not null default '[]',
  -- positions format: [{ "position_id": "uuid", "position_name": "Vocalist", "category": "Vocals", "count": 2 }]
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Pattern 5: Combobox with Custom Items (Conflict Indicators)
**What:** The member assignment combobox uses `Combobox.useFilter` for search and renders custom items showing member name + warning icon when the member has a conflicting assignment.
**When to use:** Each unassigned position slot.
**Example:**
```tsx
// Source: Existing shadcn/ui Combobox pattern + Base UI docs
<Combobox
  value={assignedMemberId}
  onValueChange={handleAssign}
>
  <ComboboxInput placeholder="Assign member..." />
  <ComboboxContent>
    <ComboboxList>
      {eligibleMembers.map((member) => (
        <ComboboxItem key={member.id} value={member.id}>
          <span>{member.full_name}</span>
          {member.hasConflict && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="size-3.5 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                Assigned to {member.conflictDetails.serviceName}
                ({member.conflictDetails.startTime})
              </TooltipContent>
            </Tooltip>
          )}
        </ComboboxItem>
      ))}
    </ComboboxList>
    <ComboboxEmpty>No matching members</ComboboxEmpty>
  </ComboboxContent>
</Combobox>
```

### Anti-Patterns to Avoid
- **Inline editing of team positions from scheduling page:** Per-service positions are copies -- adding a position to a service does NOT modify the team's global position list. These are separate concerns.
- **Client-side conflict detection only:** Stale data on the client can miss conflicts. Always validate conflicts server-side before persisting the assignment.
- **Storing assignment status in the service_positions table:** Status belongs on the assignment (one member per slot), not the position slot. An unassigned slot simply has no assignment row.
- **Using team_positions directly as FK for assignments:** This would prevent having multiple instances of the same position on a service. The `service_positions` intermediary is necessary.
- **Blocking assignment on conflict:** User explicitly chose confirmation dialog over blocking. Allow the double-booking with a warning.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Combobox with search | Custom dropdown with filtering | `@base-ui/react` Combobox (via shadcn/ui wrapper) | Keyboard navigation, a11y, scroll handling, focus management are complex. Already installed. |
| Collapsible sections | Custom toggle with height animation | Radix UI Collapsible (via shadcn/ui wrapper) | Handles animation, a11y, keyboard interaction. Already installed. |
| Confirmation dialog | `window.confirm()` | shadcn/ui AlertDialog | Accessible, consistent with existing patterns (service delete confirmation). |
| Toast notifications | Custom notification system | Sonner (already configured) | Already integrated in `app/(app)/layout.tsx`. Established pattern in all server actions. |
| Time overlap comparison | Manual string parsing | `date-fns` `parse` + `isBefore`/`isAfter` or Postgres time comparison | Handles edge cases (midnight crossover, null end_time). |

**Key insight:** The assignment UI is complex because of the interaction between combobox state, conflict detection, and per-slot rendering -- but each individual piece (combobox, collapsible, dialog, badge) has a ready-made component. The challenge is composition, not creation.

## Common Pitfalls

### Pitfall 1: N+1 Queries in Assignment Grid
**What goes wrong:** Fetching conflict data per-member per-slot results in hundreds of DB queries for a service with 20+ positions.
**Why it happens:** Naive implementation checks each member individually when populating the combobox.
**How to avoid:** Pre-fetch all assignments for the same date in a single query when loading the service detail page. Pass the conflict map to each slot as props. The query fetches all assignments for all members on the same `service_date`, grouped by `member_id`.
**Warning signs:** Slow page loads, multiple consecutive Supabase calls in server component.

### Pitfall 2: Stale Assignment Data After Mutation
**What goes wrong:** After assigning a member, the UI shows old data because React Server Components don't auto-refresh.
**Why it happens:** Server actions update the DB but the page needs revalidation.
**How to avoid:** Call `revalidatePath('/services/[serviceId]')` in every assignment server action. Use `useTransition` for optimistic UI updates in client components. The established pattern in `service-detail-actions.tsx` already does this.
**Warning signs:** Assignment appears after manual page refresh but not immediately.

### Pitfall 3: Race Condition in Conflict Detection
**What goes wrong:** Two team leads assign the same member to overlapping services simultaneously, both see "no conflict."
**Why it happens:** Time gap between conflict check and assignment insert.
**How to avoid:** Use a `UNIQUE(service_position_id)` constraint on `service_assignments` to prevent double-assignment to the same slot. For cross-service conflicts (the actual scheduling overlap), accept that advisory warnings may have a small race window -- this is acceptable because the user explicitly chose "warn, don't block." The persistent warning badge will show the conflict on subsequent views.
**Warning signs:** Duplicate assignment rows for the same position slot.

### Pitfall 4: Empty End Time in Overlap Check
**What goes wrong:** Services without an `end_time` set are never detected as conflicting.
**Why it happens:** The overlap query uses `start_time < end_time` comparison, but `end_time` can be NULL.
**How to avoid:** When `end_time` is NULL, calculate it from `start_time + duration_minutes`. If both are NULL, assume a default duration (e.g., 120 minutes) or treat the service as potentially overlapping with any same-date service.
**Warning signs:** No conflicts detected for services that visually overlap on the calendar.

### Pitfall 5: Position Removal With Existing Assignment
**What goes wrong:** Removing a position slot that has a member assigned could silently orphan data or cause errors.
**Why it happens:** CASCADE delete on `service_positions` would delete the assignment without warning.
**How to avoid (Claude's Discretion recommendation):** When removing a position that has an existing assignment, show a confirmation dialog: "This position has [member name] assigned. Removing it will unassign them. Continue?" Use `AlertDialog` for consistency. The `ON DELETE CASCADE` on `service_assignments.service_position_id` handles the DB cleanup.
**Warning signs:** Missing assignments after position removal without user awareness.

### Pitfall 6: Combobox Performance with 350+ Members
**What goes wrong:** Loading all 350+ members into every combobox slot makes the dropdown slow and hard to navigate.
**Why it happens:** Eligible members = all team members, and teams can be large.
**How to avoid:** The combobox already has built-in search filtering via `Combobox.useFilter`. Only team members (not all 350+ members) are loaded per position slot -- this is typically 5-30 members per team, which is performant. Pre-filter to team members server-side.
**Warning signs:** Full member list appearing instead of team-scoped list.

## Code Examples

Verified patterns from the existing codebase and official documentation:

### Server Action Pattern (Assignment)
```typescript
// Source: Follows established pattern from lib/services/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { assignMemberSchema } from "./schemas";

export async function assignMember(
  data: unknown,
): Promise<{ success: true } | { error: string } | { conflict: ConflictInfo }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  // Admin/committee can assign to any service; team lead needs team check
  if (!isAdminOrCommittee(role)) {
    // Check if caller is a team lead for the relevant team
    // ... team lead authorization check ...
  }

  const parsed = assignMemberSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid assignment data." };
  }

  // Check for conflicts before assigning
  const conflicts = await checkMemberConflicts(
    parsed.data.memberId,
    parsed.data.serviceId,
  );

  if (conflicts.length > 0 && !parsed.data.forceAssign) {
    return { conflict: conflicts[0] }; // Return conflict for confirmation dialog
  }

  const admin = createAdminClient();
  const { error } = await admin.from("service_assignments").insert({
    service_position_id: parsed.data.servicePositionId,
    member_id: parsed.data.memberId,
    status: "pending",
    notes: parsed.data.notes || null,
    assigned_by: callerId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}
```

### Conflict Check Query
```typescript
// Source: Project-specific implementation using established Supabase query pattern
export async function checkMemberConflicts(
  memberId: string,
  targetServiceId: string,
): Promise<ConflictInfo[]> {
  const admin = createAdminClient();

  // Get target service details
  const { data: targetService } = await admin
    .from("services")
    .select("service_date, start_time, end_time, duration_minutes")
    .eq("id", targetServiceId)
    .single();

  if (!targetService) return [];

  const targetEndTime = targetService.end_time
    ?? calculateEndTime(targetService.start_time, targetService.duration_minutes ?? 120);

  // Find overlapping assignments for this member on the same date
  const { data: conflicts } = await admin
    .from("service_assignments")
    .select(`
      id, status,
      service_positions!inner(
        services!inner(id, title, service_date, start_time, end_time, duration_minutes),
        team_positions(name, category)
      )
    `)
    .eq("member_id", memberId)
    .neq("status", "declined")
    .eq("service_positions.services.service_date", targetService.service_date)
    .neq("service_positions.services.id", targetServiceId)
    .lt("service_positions.services.start_time", targetEndTime)
    ;
    // Further filter for overlap in application code since
    // Supabase PostgREST can't express all overlap conditions in a single filter

  return (conflicts ?? [])
    .filter(c => {
      const s = c.service_positions.services;
      const endTime = s.end_time ?? calculateEndTime(s.start_time, s.duration_minutes ?? 120);
      return endTime > targetService.start_time;
    })
    .map(c => ({
      assignmentId: c.id,
      serviceName: c.service_positions.services.title,
      serviceTime: c.service_positions.services.start_time,
      positionName: c.service_positions.team_positions.name,
    }));
}
```

### Assignment Grid Layout (React Component Structure)
```tsx
// Source: Composition of existing shadcn/ui components
// Service Detail Page -> AssignmentPanel -> CategoryGroup -> AssignmentSlot

// AssignmentPanel: top-level client component
function AssignmentPanel({ service, teams, assignments, conflicts }) {
  return (
    <div className="flex flex-col gap-6">
      {teams.map(team => (
        <Card key={team.id}>
          <CardHeader>
            <CardTitle>{team.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(groupByCategory(team.positions)).map(([category, positions]) => (
              <Collapsible key={category} defaultOpen>
                <CollapsibleTrigger>{category || "General"}</CollapsibleTrigger>
                <CollapsibleContent>
                  {positions.map(pos => (
                    <AssignmentSlot
                      key={pos.servicePositionId}
                      position={pos}
                      assignment={assignments[pos.servicePositionId]}
                      eligibleMembers={team.members}
                      conflicts={conflicts}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### RLS Policy Pattern for Assignments
```sql
-- Source: Follows established pattern from 00003_serving_teams.sql and 00005_services.sql
-- All authenticated users can read assignments (needed for conflict checks and schedule views)
alter table public.service_assignments enable row level security;
create policy "Authenticated users can view assignments"
  on public.service_assignments for select
  to authenticated
  using (true);

-- Mutations go through server actions using createAdminClient() (service role key)
-- This bypasses RLS, matching the established pattern for all mutations in this codebase
```

## Claude's Discretion Recommendations

### Template Workflow
**Recommendation:** Two-step save/load with minimal UI friction.
- **Save:** After configuring a service's positions, a "Save as Template" button opens a small dialog with a name field (required) and optional description. The template captures the current `service_positions` configuration (position references, counts, categories) but NOT member assignments (templates are for position structure, not people).
- **Load:** A "Load Template" button opens a dialog listing saved templates, filtered by team. Each template shows name, position count, and creation date. Selecting a template replaces the current service's position slots (with confirmation if existing positions have assignments). The template does not auto-assign members.
- **Browse:** Templates are listed in a simple scrollable list sorted by most recently used. No complex folder/tagging system -- keep it minimal for v1.
- **Team scoping:** Templates are associated with a specific team (via `team_id` FK). The template list is filtered to show templates for teams involved in the current service.

### Combobox Search/Filter Behaviour
**Recommendation:** Use `Combobox.useFilter` with `sensitivity: 'base'` for accent-insensitive matching. Search matches on `full_name` only (not email -- church context, people know names not emails). Show a maximum of 30 results in the dropdown. Empty state shows "No matching members." The combobox opens on click/focus and filters as the user types. Keyboard navigation: Up/Down to navigate, Enter to select, Escape to close.

### Mobile Layout Adaptations
**Recommendation:** The assignment grid uses a single-column layout on mobile. Each position slot takes full width. The combobox is full-width with generous touch targets. On desktop (lg+), the two-column grid (`grid-cols-1 lg:grid-cols-2`) allows side-by-side viewing of teams. The position category headers remain sticky when scrolling within a team card on mobile.

### Status Badge Colour Scheme
**Recommendation:**
- **Pending** -- `bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400` (amber/yellow -- awaiting action)
- **Confirmed** -- `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400` (green -- good to go)
- **Declined** -- `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400` (red -- needs attention)
- **Unassigned** -- Dashed border outline with muted text (not a badge, but the empty slot state)
- **Conflict warning** -- `text-amber-500` AlertTriangle icon (distinct from pending badge)

These follow the universal traffic-light convention and match the existing destructive/success patterns in the codebase.

### Position Removal With Existing Assignment
**Recommendation:** Show an AlertDialog (consistent with existing delete confirmations) stating: "Remove [Position Name]? [Member Name] is currently assigned to this position and will be unassigned." with Cancel/Remove buttons. The `ON DELETE CASCADE` on `service_assignments.service_position_id` handles the DB cleanup automatically. If the position has no assignment, remove it immediately without a dialog (just a toast confirmation).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ENUM for assignment status | CHECK constraint on text column | Postgres 9.5+ | More flexible, no migration needed to add states. Matches project convention from `team_members.role`. |
| Drag-and-drop scheduling | Combobox-per-slot with search | User decision (2026-02-14) | Mobile-first priority. Combobox works on all devices without touch-drag complexity. |
| Skill-based filtering in dropdown | Team membership filtering only | User decision (2026-02-14) | Skills removed from system. Eligible = member is on the team. Simpler logic. |
| Range types for time overlap | DATE + TIME column comparison | Existing schema convention (03-01) | Services use separate `service_date`, `start_time`, `end_time` columns (decision from Phase 3). Overlap detection uses application-level comparison. |

**Deprecated/outdated:**
- Skill/proficiency filtering (ASGN-10 wording): Skills were removed. "Eligible" now means team membership only. Stale references exist in roadmap success criteria.

## Open Questions

1. **Team lead authorization for assignments**
   - What we know: Team leads can manage their own team (established in Phase 2 via `team_members.role = 'lead'`). Admin/committee can manage all teams.
   - What's unclear: Can a team lead assign members from OTHER teams to positions on their team's section of a service? (e.g., can the Worship team lead assign a Sound team member to a Worship position?)
   - Recommendation: Team leads can only assign members from their own team. Admin/committee can assign anyone. This matches the existing authorization pattern where team leads manage their own team only.

2. **Service positions initialization**
   - What we know: Services start with no positions. Positions are added inline from the team's existing position list.
   - What's unclear: Should services auto-populate positions from teams when navigating to the assignment view for the first time?
   - Recommendation: Do NOT auto-populate. Team leads add positions explicitly. This avoids unwanted positions appearing and gives teams full control. The template system provides the "quick setup" path.

3. **Multi-team services**
   - What we know: A service can have positions from multiple teams (Worship + Sound + Lights for a Sunday morning service).
   - What's unclear: How are teams associated with a service? Is it implicit (through service_positions) or explicit (a service_teams join table)?
   - Recommendation: Implicit through `service_positions`. When a position is added from Team X, Team X automatically appears in the assignment grid. No explicit service-team association needed. The assignment panel groups positions by the team they belong to (via `service_positions.team_id`).

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- All patterns verified by reading actual source files:
  - `lib/services/actions.ts` -- Server action pattern with admin client, Zod validation, revalidation
  - `lib/teams/queries.ts` -- Query pattern with type interfaces, Supabase joins
  - `lib/auth/roles.ts` -- Authorization pattern (admin/committee/team lead checks)
  - `components/ui/combobox.tsx` -- Combobox component using `@base-ui/react` Combobox primitive
  - `components/ui/collapsible.tsx` -- Collapsible component using Radix UI
  - `supabase/migrations/00003_serving_teams.sql` -- Schema pattern for team/position tables
  - `supabase/migrations/00005_services.sql` -- Schema pattern for services with indexes and RLS
  - `app/(app)/services/[serviceId]/page.tsx` -- Service detail page with Phase 4 placeholder
- **Context7: Base UI Combobox** (`/llmstxt/base-ui_llms-full_txt`) -- `useFilter` hook API, single/multi-select modes, custom item rendering, keyboard navigation
- **Context7: Supabase** (`/supabase/supabase`) -- RLS policy syntax for INSERT/UPDATE/DELETE with `auth.uid()`, range overlap queries with `&&` operator, `btree_gist` extension for exclusion constraints

### Secondary (MEDIUM confidence)
- **Context7: Supabase range columns blog** -- PostgreSQL `tstzrange` overlap operator (`&&`) and exclusion constraints. Verified approach but not directly applicable since the project uses separate DATE + TIME columns rather than range types.

### Tertiary (LOW confidence)
- None. All findings verified against existing codebase patterns or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and used in Phases 1-3. No new dependencies.
- Architecture: HIGH -- All patterns (server actions, queries, schemas, RLS, components) are extensions of established Phase 2/3 patterns. Schema design follows existing conventions.
- Pitfalls: HIGH -- Pitfalls identified from direct codebase analysis (N+1 queries, stale data, null end_time) and established mitigation patterns.
- Claude's Discretion areas: MEDIUM -- Recommendations for template workflow, badge colours, and mobile layout are well-reasoned but may need user refinement.

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable domain; no external library changes expected)
