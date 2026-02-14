---
status: complete
phase: 02-teams-and-member-profiles
source: [02-05-SUMMARY.md, 02-06-SUMMARY.md, 02-07-SUMMARY.md]
started: 2026-02-14T00:00:00Z
updated: 2026-02-14T00:00:00Z
---

## Current Test

number: done
name: All tests complete
awaiting: n/a

## Tests

### 1. Teams link in sidebar navigation
expected: Log in as admin. In the sidebar, "Teams" link appears (with Layers icon) between Services and Team Roster. Click it — navigates to /teams page showing your teams.
result: pass

### 2. My Profile in user dropdown (bottom-left)
expected: Click your name/avatar in the bottom-left of the sidebar. A dropdown opens with "My Profile" link (with UserCircle icon) at the top, followed by theme options and Log Out. Click "My Profile" — navigates to /profile page.
result: pass

### 3. Team roster table layout on desktop
expected: Navigate to /team-roster. On desktop, members display in a table with columns: Member (avatar + name + email), Teams (color badges), and Positions (proficiency badges). Rows are clickable — clicking navigates to the member's profile.
result: pass (note: visual polish needed — table looks out of place, revisit styling later)

### 4. Assign Positions dialog (was "Edit Skills")
expected: Go to a team detail page. Open a member's action menu and select "Assign Positions" (previously "Edit Skills"). Dialog shows clear labels: "Experience Level" and "Willingness" with helper text explaining each dropdown. Save works.
result: pass (notes: 1. Teams page should be table layout with action buttons column like ym-attend-4. 2. Remove "Willingness" field. 3. Use positions dropdown instead of listing all positions.)

### 5. Position form without quantity field
expected: On team detail page, click "Add" to add a new position. Form shows only Name and Category fields (no Qty/quantity field). Create a position — it saves successfully with just name and category.
result: pass

### 6. Profile reads from members table
expected: Go to /profile. Personal Info tab shows phone, emergency contact, and birthdate fields. Edit phone number and save. Refresh page — value persists. (Data is now stored in the shared members table, not member_profiles.)
result: pass

### 7. Reminder days dropdown fixed height
expected: Go to /profile > Notification Settings tab. Open the "Remind me before service" dropdown. The dropdown has a fixed height with internal scrolling — it does NOT grow larger as you scroll through options.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
