---
status: complete
phase: 05-availability-management
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md
started: 2026-02-16T10:00:00Z
updated: 2026-02-17T11:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Availability in Sidebar Navigation
expected: Sidebar shows "Availability" nav item with CalendarOff icon for all roles (admin, committee, member). Placed after Team Roster for admin/committee and after My Schedule for member.
result: pass

### 2. Availability Page Layout
expected: Navigating to /availability shows a page with two tabs: "My Availability" and "Team Overview". Default tab shows your own availability calendar.
result: pass

### 3. Add Single Blackout Date
expected: On My Availability tab, switching to single-click mode and clicking a date on the calendar marks it as unavailable. The date cell turns solid red. The blackout appears in the blackout list below.
result: issue
reported: "when i click on today's date, 16th Feb, it marks 17th Feb as unavailable instead. Also the whole mode toggle (view/single/range) UX is very confusing — didn't know I had to click on the calendar, didn't know how range works. Needs UX redesign."
severity: major

### 4. Add Date Range Blackout
expected: Switching to range mode, selecting a start date then an end date creates a blackout range. All dates in the range turn solid red on the calendar and appear in the blackout list.
result: pass

### 5. Delete a Blackout Date
expected: In the blackout list, clicking delete on an existing blackout removes it. The calendar updates and the date(s) are no longer red.
result: pass

### 6. Create Recurring Unavailability Pattern
expected: Clicking the button to add a recurring pattern opens a dialog. User can select frequency (weekly, biweekly, monthly, nth_weekday), configure the pattern, and see a live preview of upcoming dates. Submitting creates the pattern.
result: pass

### 7. Recurring Pattern List and Delete
expected: Active recurring patterns are displayed as cards with human-readable descriptions (e.g., "Every other Wednesday"). Each card has a delete button that removes the pattern.
result: pass

### 8. Calendar Visual Indicators
expected: Blackout dates display with solid red background. Recurring unavailability dates display with hatched amber pattern (diagonal stripes). Both are visually distinct on the calendar.
result: pass

### 9. Team Overview Calendar
expected: Team Overview tab shows a calendar with per-date availability counts (e.g., "3/5"). Cells are color-coded: green when most available, amber when some unavailable, red when many unavailable. Hovering/clicking shows tooltip with unavailable member names.
result: pass

### 10. Member Selector for Team Leads
expected: Team leads (and admin/committee) see a dropdown selector to switch between managing their own availability and a team member's availability. Selecting a member loads that member's blackouts and patterns.
result: pass

### 11. Unavailable Warning in Assignment Combobox
expected: On a service detail page, when assigning members to positions, unavailable members show a CalendarOff icon (red) in the combobox dropdown with a tooltip showing the unavailability reason. Members remain in alphabetical order (not hidden or moved).
result: pass

### 12. Assign Unavailable Member Confirmation
expected: Selecting an unavailable member from the combobox triggers an "Assign anyway?" dialog (amber-styled, similar to conflict dialog). Confirming proceeds with assignment; cancelling does not assign.
result: pass

### 13. Availability Banner on Service Detail
expected: Service detail page shows an amber collapsible banner between the header and service info. It displays the count of unavailable members and expands to show the list of who is unavailable with reasons.
result: pass

## Summary

total: 13
passed: 12
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Clicking a date marks that exact date as unavailable with correct visual feedback"
  status: failed
  reason: "User reported: clicking Feb 16 marks Feb 17 instead (off-by-one). Also mode toggle UX (view/single/range) is confusing and unintuitive — needs redesign to direct-click interaction."
  severity: major
  test: 3
  root_cause: "availability-calendar.tsx:63 uses .toISOString().slice(0,10) (UTC) while save path uses date-fns format() (local time). In UTC+8 timezone, this shifts rendered blackout dot forward by 1 day. Additionally, mode toggle pattern is a discoverability anti-pattern — users expect calendar to be directly interactive."
  artifacts:
    - path: "app/(app)/availability/availability-calendar.tsx"
      issue: "Line 63: toISOString() converts to UTC, mismatching local-time save path"
    - path: "app/(app)/availability/blackout-manager.tsx"
      issue: "Mode toggle UX (view/single/range) is unintuitive — needs redesign to always-interactive calendar with progressive disclosure"
  missing:
    - "Fix dateKey to use format(day.date, 'yyyy-MM-dd') from date-fns instead of toISOString()"
    - "Redesign blackout manager: remove mode toggle, make calendar always clickable, show confirmation strip after selection, support drag-to-range"
  debug_session: ""
