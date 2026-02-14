---
status: complete
phase: 02-teams-and-member-profiles
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-02-13T20:00:00Z
updated: 2026-02-13T21:00:00Z
---

## Current Test

number: 12
name: View another member's profile
expected: |
  On the team roster page, click on a member card. Opens /members/[id] page showing their avatar (large), name, email, phone (if set), team memberships with role badges, and position skills with proficiency/preference badges. A "Back to Roster" link returns to the roster.
awaiting: complete

## Tests

### 1. Navigate to Teams page
expected: Go to /teams. Page shows "Teams" heading with a "Create Team" button. If no teams exist yet, an empty state message is shown. Page is accessible to admin/committee roles only.
result: issue
reported: "the teams page is not in the sidebar. but yes, able to navigate to /teams directly"
severity: major

### 2. Create a new team
expected: Click "Create Team" button. A dialog opens with fields for team name, description, and color picker. Fill in a name (e.g. "Worship") and submit. Dialog closes, toast confirms creation, and new team card appears in the grid with the name and color accent.
result: pass

### 3. Add positions to a team
expected: Click on the team card to open team detail page. In the Positions section, click "Add Position". Enter a position name (e.g. "Lead Vocals"), optionally a category (e.g. "vocals"), and quantity. Save it. Position appears in the list with name, category badge, and quantity.
result: pass

### 4. Add a member to a team
expected: On the team detail page, in the Members section, click "Add Member". A searchable dropdown appears showing existing members from the database. Type a name to filter, select a member. They appear in the member list with "Member" role badge and avatar.
result: pass

### 5. Promote member to team lead
expected: On the team detail page member list, find the member you just added. Open their action menu (three-dot or dropdown). Select "Promote to Lead". Member's badge changes from "Member" to "Lead" (with crown icon). Toast confirms the change.
result: pass
notes: "User prefers table layout for desktop instead of card view"

### 6. Edit member position skills
expected: On the team detail page member list, open a member's action menu and select "Edit Skills". A dialog shows each position in the team with dropdowns for proficiency (beginner/intermediate/advanced/expert) and preference (primary/secondary/willing). Save changes. Skill badges update on the member row.
result: pass
notes: "UX feedback: 'Edit Skills' concept is confusing. User didn't understand what skills/proficiency/preference mean or that they were assigning a role."

### 7. Navigate to My Profile from sidebar
expected: In the sidebar navigation, a "My Profile" link is visible (for all roles). Click it. Profile page loads at /profile with 4 tabs: Personal Info, Notification Settings, Positions & Skills, About.
result: pass
notes: "User wants profile accessible from bottom-left user menu (avatar/name dropdown), not as a regular sidebar nav item"

### 8. Edit profile personal info
expected: On the Personal Info tab, name and email are shown as read-only. Phone, emergency contact name, emergency contact phone, and birthdate are editable. Fill in some values and click Save. Toast confirms "Profile updated". Refresh the page — values persist.
result: pass
notes: "Profile fields (phone, emergency contact, birthdate) should read/write from shared members table, not duplicate into member_profiles"

### 9. Upload avatar photo
expected: On the Personal Info tab, an avatar area shows initials fallback (or current photo). Click "Change Photo" or the avatar area. File picker opens. Select an image (<5MB). Preview updates immediately. After upload completes, avatar persists on page refresh.
result: pass

### 10. Set notification preferences
expected: Click the "Notification Settings" tab. Toggle switches for "Email notifications" and "Assignment change notifications" are shown. A dropdown for "Remind me before service" shows day options (0-14). Toggle a switch, change reminder days, save. Toast confirms. Values persist on refresh.
result: pass
notes: "Reminder days dropdown box doesn't have fixed height — grows as user scrolls instead of staying fixed with internal scroll"

### 11. Team roster shows serving members
expected: Navigate to /team-roster (via sidebar "Team Roster" link). Page shows a searchable grid of members who belong to at least one team. Each card shows avatar, name, team badges (with team color), and position/skill chips. Search by name filters the list. Team filter chips at the top filter by team.
result: pass
notes: "User prefers table layout for desktop like ym-attend-4"

### 12. View another member's profile
expected: On the team roster page, click on a member card. Opens /members/[id] page showing their avatar (large), name, email, phone (if set), team memberships with role badges, and position skills with proficiency/preference badges. A "Back to Roster" link returns to the roster.
result: pass

## Summary

total: 12
passed: 11
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Teams page is accessible from sidebar navigation for admin/committee roles"
  status: failed
  reason: "User reported: the teams page is not in the sidebar"
  severity: major
  test: 1
  root_cause: "Teams and Team Roster links missing from sidebar navigation"
  artifacts: [components/app-sidebar.tsx]
  missing: []
  debug_session: ""

- truth: "Hydration mismatch on hard refresh (Radix UI ID mismatch)"
  status: open
  reason: "Radix UI generates different IDs on SSR vs client hydration — console error on hard refresh"
  severity: minor
  test: 4, 8
  root_cause: "Radix UI ID generation mismatch between server and client renders"
  artifacts: [components/ui/sidebar.tsx, components/ui/tabs.tsx]
  missing: []
  debug_session: ""

- truth: "Desktop layout should use table view instead of card view"
  status: open
  reason: "User prefers table layout like ym-attend-4 for team detail members and team roster pages"
  severity: minor
  test: 5, 11
  root_cause: "Design choice — cards used instead of tables"
  artifacts: [app/(app)/teams/[teamId]/page.tsx, app/(app)/team-roster/page.tsx]
  missing: []
  debug_session: ""

- truth: "Edit Skills UX is confusing"
  status: open
  reason: "User didn't understand what skills/proficiency/preference mean. Needs better labeling and context."
  severity: minor
  test: 6
  root_cause: "UX design — terminology and flow unclear"
  artifacts: [components/teams/member-skill-dialog.tsx]
  missing: []
  debug_session: ""

- truth: "Profile should be in bottom-left user menu, not sidebar nav"
  status: open
  reason: "User wants profile accessible from user avatar/name dropdown at bottom of sidebar"
  severity: minor
  test: 7
  root_cause: "Design choice — profile placed as sidebar nav item instead of user menu dropdown"
  artifacts: [components/app-sidebar.tsx]
  missing: []
  debug_session: ""

- truth: "Position quantity_needed field not needed"
  status: open
  reason: "User doesn't need quantity field for positions — remove from create/edit forms"
  severity: minor
  test: 7
  root_cause: "Feature not needed"
  artifacts: [components/teams/position-manager.tsx, lib/teams/schemas.ts]
  missing: []
  debug_session: ""

- truth: "Profile fields should read/write from shared members table"
  status: open
  reason: "Phone, emergency contact, birthdate already exist in members table — redundant to duplicate in member_profiles"
  severity: minor
  test: 8
  root_cause: "Architecture — serving-specific member_profiles duplicates fields from shared members table"
  artifacts: [lib/profiles/actions.ts, lib/profiles/queries.ts, components/profiles/profile-form.tsx]
  missing: []
  debug_session: ""

- truth: "Reminder days dropdown should have fixed height"
  status: open
  reason: "Dropdown box grows as user scrolls instead of having fixed height with internal scrolling"
  severity: minor
  test: 10
  root_cause: "Missing max-height/overflow CSS on Select component"
  artifacts: [components/profiles/notification-preferences.tsx]
  missing: []
  debug_session: ""
