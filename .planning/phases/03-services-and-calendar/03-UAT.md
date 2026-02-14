---
status: complete
phase: 03-services-and-calendar
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, ad-hoc fixes
started: 2026-02-14T15:00:00Z
updated: 2026-02-14T15:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Dashboard loads with calendar, services list, and stats
expected: Dashboard page shows a month calendar, upcoming services list, and 3 stats cards (Upcoming Services, Unassigned Positions, Pending Confirmations)
result: pass
note: "Too much whitespace on desktop view — needs to be more compact"

### 2. Calendar shows colour-coded dots for services
expected: Services appear as coloured dots on their dates, matching their service type colour
result: pass
note: "Dots are small and monochrome — make them pop more"

### 3. Calendar month navigation works
expected: Clicking previous/next arrows changes the displayed month
result: pass

### 4. Create Service dialog has all fields
expected: Clicking Create Service opens dialog with title, date, time, type, duration, rehearsal info, and notes fields
result: pass
note: "Duration field is useless since start time and end time already exist"

### 5. Create and save a service
expected: Fill required fields, submit. Toast shows "Service created", service appears in upcoming list
result: pass

### 6. Service detail page shows full info
expected: Clicking a service navigates to detail page showing title, date, time, type, rehearsal details, notes, and Edit/Duplicate/Delete buttons
result: pass
note: "Dashboard upcoming services should also have Duplicate action (currently only Edit and Delete)"

### 7. Edit service from detail page
expected: Edit button opens dialog pre-filled with current values. Saving updates the service
result: pass

### 8. Duplicate service dialog works
expected: Duplicate button opens dialog with date picker. Submitting creates a copy on the new date
result: pass

### 9. Delete service with confirmation
expected: Delete button shows confirmation dialog. Confirming deletes and redirects to dashboard
result: pass

### 10. Recurring service dialog with preview
expected: Dashboard dropdown > Create Recurring Series opens dialog with frequency, date range, time, type, title template. Shows live preview count
result: pass
note: "Duration field is useless here too"

### 11. Service type manager CRUD
expected: Dashboard dropdown > Manage Service Types shows existing types with inline edit/delete and an add form (name, label, colour fields)
result: pass
note: "Name-slug field is useless for users — remove or auto-generate"

### 12. Create team colour picker — no forced default
expected: Go to Teams > Create Team. The colour text input should be empty (no pre-filled hex). The colour picker swatch shows grey. Submitting without picking a colour should save the team with no colour (null)
result: pass

### 13. Edit team colour picker retains saved value
expected: Edit a team that has a saved colour. The colour picker and text input should show the saved hex value, not reset to grey/default
result: pass

### 14. Colour picker saves without flash on close
expected: Edit a team, change the colour, click Save. The dialog should close without the colour picker visibly flashing back to grey/default
result: pass

### 15. UK English label on team colour field
expected: The team create/edit dialog shows "Colour" as the field label (not "Color")
result: pass

### 16. Sidebar expand animation — no layout jank
expected: Collapse the sidebar to icon rail, then expand it. The "YM Serving Team" text should not wrap or push nav items down during the animation
result: pass

## Summary

total: 16
passed: 16
issues: 0
pending: 0
skipped: 0

## Feedback (non-blocking polish items)

- truth: "Dashboard desktop layout should be more compact"
  severity: cosmetic
  test: 1

- truth: "Calendar dots should be larger and more vibrant"
  severity: cosmetic
  test: 2

- truth: "Duration field is redundant — remove from service and recurring dialogs"
  severity: minor
  test: 4, 10

- truth: "Dashboard upcoming services list should include Duplicate action"
  severity: minor
  test: 6

- truth: "Service type manager name-slug field not user-friendly — auto-generate or remove"
  severity: minor
  test: 11

## Gaps

[none — all tests passed]
