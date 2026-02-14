# Phase 4: Scheduling & Assignments - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Team leads and admins can assign members to positions on services, with conflict detection and reusable templates. This phase delivers the core scheduling workflow — the primary value of the app. Accept/decline responses are Phase 6; availability management is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Assignment Interface
- Combobox/dropdown per position slot (not drag-and-drop) — mobile-friendly, works across all devices
- Dropdown shows eligible members with **name + availability indicator** (warning icon if assigned to an overlapping service)
- No skill/proficiency filtering — skills were removed from the system; eligible = member is on the team
- Assigned slot displays: **member name + status badge** (pending/confirmed/declined) — compact, no avatars
- Per-assignment **notes supported** — optional text field visible to the assigned member (e.g., "play cajon instead of drums")

### Conflict & Warning Display
- Conflict = **overlapping service times only** (not same-day; morning + evening on same day is fine)
- When assigning a conflicting member: **confirmation dialog** — "John is assigned as Drummer on Evening Service (5:00 PM). Assign anyway?"
- Dialog shows: conflicting **service name + position + time**
- After confirmed conflict: **persistent warning badge** stays on the slot so others can see the double-booking

### Position Grouping & Roster Layout
- **Two-level hierarchy**: Team → Position Category (e.g., Worship Team > Vocals, Worship Team > Instruments)
- Position categories **expanded by default** (not collapsed)
- Unassigned slots: **dashed outline + "Assign" button** — clearly visible empty state
- Team leads can **add/remove positions inline** on the scheduling page (per-service, not globally)
- Adding positions: **select from team's existing positions** (dropdown, not free-text)
- Can add **multiples of the same position** (e.g., 2 Vocalists, 3 Backup Singers)

### Claude's Discretion
- Template workflow (save/load team configurations) — how templates are named, browsed, and applied
- Combobox search/filter behaviour and keyboard navigation
- Mobile-specific layout adaptations for the scheduling grid
- Status badge colour scheme (pending/confirmed/declined/unassigned)
- How position removal works when a member is already assigned

</decisions>

<specifics>
## Specific Ideas

- Mobile-first consideration drove the combobox choice over drag-and-drop — vertical scrolling makes drag-and-drop impractical on phones
- Confirmation dialog for conflicts rather than blocking — team leads need flexibility to intentionally double-book when necessary
- Warning badge persists after confirmation so other team leads reviewing the schedule can see the overlap

</specifics>

<deferred>
## Deferred Ideas

- Skill/proficiency system was removed — stale references in roadmap success criteria and earlier phase docs need cleanup (housekeeping, not a phase)
- Accept/decline workflow — Phase 6
- Availability/blackout dates affecting the dropdown — Phase 5

</deferred>

---

*Phase: 04-scheduling-and-assignments*
*Context gathered: 2026-02-14*
