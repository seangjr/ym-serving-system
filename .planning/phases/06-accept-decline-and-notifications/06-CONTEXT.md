# Phase 6: Accept/Decline & Notifications - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Members can respond to assignments (confirm/decline) and request swaps with specific team members, and the system delivers in-app notifications for assignments, changes, and reminders. The notification system is provider-extensible for future Telegram/WhatsApp integration.

</domain>

<decisions>
## Implementation Decisions

### My Schedule view
- Flat chronological list — no grouping by date or service, just a simple list ordered by date
- Upcoming assignments only — past assignments disappear automatically (no history view)
- Compact card density — essentials only: position name, team, service time, status badge
- Empty state: simple message with a subtle icon ("No upcoming assignments")

### Confirm/decline interaction
- Confirmation dialog required for declining — "Are you sure you want to decline?" to prevent accidental taps
- Members can toggle freely between confirmed/declined until the service date passes
- Buttons appear both inline on the card AND in the assignment detail view
- Buttons always visible on all assignments (not just pending) — since members can re-toggle status
- Confirming is a single tap (no dialog needed), declining requires confirmation dialog

### Notification presentation
- Real-time arrival: toast popup with the notification title AND a quick action button (e.g., "View" or "Confirm")
- Access via bell dropdown popover — click bell icon to see recent notifications (like GitHub/Slack pattern)
- Read/unread distinction: bold text + small blue dot indicator for unread; normal weight for read
- Clicking a notification navigates to the relevant page (action URL) and marks it as read

### Swap request experience
- **Pre-arranged swap model** — member finds someone to swap with OFFLINE (WhatsApp, in-person), then comes to the system to formalize it
- Member selects a specific person to swap with from a dropdown of team members (NOT a broadcast to all eligible members)
- No notification blast to eligible members — the swap partner is already arranged
- Reason field is optional — textarea shown but member can skip
- Team lead approval still required — notified via both notification AND visible on service detail page
- The swap partner does NOT need to "accept" in-system — the offline agreement is sufficient. Team lead just approves/rejects.

### Claude's Discretion
- Exact card styling, spacing, and typography for My Schedule
- Notification popover width and max height
- Toast duration and positioning
- Loading/skeleton states during data fetch
- Error state presentations

</decisions>

<specifics>
## Specific Ideas

- "Our process is: we ask the other team members offline if they can help/swap, then we announce in our WhatsApp group. The system should match this — click swap with the person you already arranged with."
- Bell dropdown should feel like GitHub's notification popover — quick glance at recent items
- Compact My Schedule cards should be scannable at a glance — position, time, status, action buttons

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-accept-decline-and-notifications*
*Context gathered: 2026-02-17*
