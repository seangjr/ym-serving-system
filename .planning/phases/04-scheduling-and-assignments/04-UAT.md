---
status: complete
phase: 04-scheduling-and-assignments
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md]
started: 2026-02-14T07:40:00Z
updated: 2026-02-14T07:40:00Z
---

## Current Test

number: done
name: All tests complete
awaiting: none

## Tests

### 1. Database Migration Applied
expected: Run `supabase login && supabase db push`. Tables service_positions, service_assignments, schedule_templates created without errors.
result: pass (user ran SQL in Supabase SQL Editor)

### 2. Assignment Panel on Service Detail
expected: Navigate to a service detail page (/services/[id]). Below the service info, an "Assignments" section appears with team cards. Each team card shows positions grouped by category with collapsible sections (expanded by default).
result: pass (after fixes: calendar hydration, Link z-index, FK hint for members!member_id)

### 3. Assign a Member to a Position
expected: On an unassigned position slot (dashed border with "Assign" button), click to open a combobox dropdown. Type to search members by name. Select a member — slot updates to show member name with an amber "Pending" status badge.
result: pass (after fixes: combobox string values, position skill filtering, one-to-one query handling, delete-before-insert)

### 4. Unassign a Member
expected: On an assigned position slot, click the X/unassign button. The member is removed and the slot returns to the unassigned state (dashed border).
result: pass

### 5. Conflict Detection on Overlapping Services
expected: Assign a member who is already assigned to another service on the same date with overlapping times. A conflict confirmation dialog appears showing the conflicting service details. Force-assigning shows a persistent warning icon (triangle) on the slot.
result: pass

### 6. Add a Position to a Service
expected: Use the inline "Add Position" control within a team card (or the standalone position adder). Select a position from the category-grouped dropdown. A new unassigned slot appears for that position.
result: pass

### 7. Remove a Position from a Service
expected: Remove an unassigned position — it disappears immediately. Remove a position that has a member assigned — a warning dialog appears asking for confirmation before removing.
result: pass

### 8. Per-Assignment Notes
expected: On an assigned slot, a notes input field is available. Type a note — it auto-saves after a brief pause (debounced). Refreshing the page shows the saved note.
result: pass (auto-save works; tweaked: notes field stays open if note exists, added X to close)

### 9. Save as Template (Whole Service)
expected: On a service detail page with positions assigned, click "Save as Template". A dialog appears with name, description, and an "Include member assignments" checkbox. Submit to save. Toast confirms success. The template captures ALL positions across all teams on this service.
result: pass (simplified to positions-only templates, no member assignments; added drag-and-drop reordering for positions and categories)

### 10. Load Template onto Service
expected: On a service detail page, click "Load Template". A dialog shows templates filtered by the service's type. Select a template and click "Load Template". If the template has assignments and the checkbox is ticked, conflicts are checked — a conflict summary dialog appears if any. Choosing "Assign Anyway" or "Skip Assignments" completes the load. All existing positions are replaced.
result: pass

### 11. Dashboard Stats Show Real Counts
expected: Dashboard stats cards show real "Unassigned Positions" and "Pending Confirmations" counts from the database (not hardcoded 0). After assigning members, the counts update on next page load.
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
