# Phase 5: Availability Management - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Members can declare when they are unavailable (one-time blackout dates and recurring patterns), and the scheduling system surfaces availability warnings when assigning members to services. Includes an availability calendar view for both individual members and team-level overview. Accept/decline workflows and notifications are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Blackout date entry
- Both calendar click (single dates) and date range picker (multi-day blocks like vacations)
- Full day only — no partial-day (AM/PM) granularity
- Optional free-text reason field visible to team leads (e.g. "Family vacation", "Exams")
- Dedicated /availability page in the sidebar nav (not buried in profile)

### Availability calendar
- Everyone can view availability — members see teammates' availability (read-only), not just their own
- Individual member view: calendar with unavailable dates highlighted (on /availability page)
- Team overlay view: calendar showing "X/Y available" count per date for team leads when scheduling
- Both views available: individual for managing own dates, team overlay for leads referencing during scheduling

### Scheduling warnings
- Soft block: unavailable members can be assigned, but require explicit "Assign anyway?" confirmation
- Warnings appear in both places: warning icon/label in the assignment combobox dropdown + confirmation dialog after selection
- Unavailable members keep same alphabetical sort position in dropdown (just with warning icon, not moved to bottom or hidden)
- Service detail page shows an availability banner at top: "3 members unavailable on this date" with expandable list of who and why

### Recurring patterns
- Members and team leads can both set recurring patterns (leads can set on behalf of their team members)

### Claude's Discretion
- Recurring pattern types (weekly, biweekly, monthly, nth-day-of-month) — pick what fits church scheduling context
- Whether recurring patterns have optional or required end dates
- Visual distinction between recurring vs one-time unavailability on calendar
- Calendar visual style for unavailable dates (shaded cells, dots, hatching — consistent with existing service calendar)

</decisions>

<specifics>
## Specific Ideas

- Availability page should be its own sidebar nav item — members need quick access to manage their dates
- Team overlay shows availability counts ("X/Y available") rather than listing individual names — keeps it scannable
- Soft block pattern mirrors existing conflict detection dialog from Phase 4 — "Assign anyway?" confirmation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-availability-management*
*Context gathered: 2026-02-14*
