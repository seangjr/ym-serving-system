---
status: complete
phase: 07-song-library-setlists
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md
started: 2026-02-24T12:00:00Z
updated: 2026-02-27T12:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Song Library Page Access
expected: Navigate to /songs. Page shows "Song Library" heading, search bar, filter chip area, and a song table. Admin/committee see an "Add Song" button.
result: pass

### 2. Add a Song
expected: Click "Add Song". A dialog opens with fields for title, artist, key, tempo, duration, tags (type and press Enter/comma to add), links (add multiple label+URL pairs), and notes. Fill in details and submit. Song appears in the table.
result: issue
reported: "the tags, when there's a lot, it keeps on increasing the column width. columns are also not able to be sorted. columns are too dynamic and shift around as data grows."
severity: minor

### 3. Search Songs
expected: Type a song title or artist name in the search bar. After a brief delay (~300ms), the table filters to show only matching songs. Clearing the search restores the full list.
result: pass

### 4. Filter by Key
expected: After adding songs with different keys, key filter chips appear. Clicking a key chip filters the table to songs in that key. Clicking again (or the active chip) clears the filter.
result: issue
reported: "filter is not efficient and space wasting. should use a Filters button with popover dropdowns like ym-attend-4 members page (compact filter button + active filter badges with X to clear)"
severity: minor

### 5. Filter by Tag
expected: After adding songs with tags, tag filter chips appear. Clicking a tag chip filters the table to songs with that tag.
result: issue
reported: "same issue as filter by key — inline chips waste space, should be consolidated into Filters popover approach from ym-attend-4"
severity: minor

### 6. Edit a Song
expected: Click the edit action (menu/button) on a song row. The form dialog opens pre-populated with that song's data. Modify a field and save. The table reflects the updated values.
result: pass

### 7. Delete a Song
expected: Click the delete action on a song row. After confirmation, the song is removed from the table.
result: pass

### 8. Tabbed Service Detail Page
expected: Navigate to a service detail page. The page now shows 3 tabs: "Assignments", "Setlist", and "Details". The Assignments tab is active by default and shows the same assignment panel as before. Clicking "Details" shows service info and rehearsal cards. Clicking "Setlist" shows the setlist builder.
result: pass

### 9. Add Song to Setlist
expected: On the Setlist tab, use the inline song picker (combobox) or "Browse Library" button to add a song to the setlist. The song appears as a numbered row with its key, tempo, and a grip handle.
result: pass

### 10. Drag-and-Drop Reorder Setlist
expected: With 2+ songs in the setlist, drag a song by its grip handle to a new position. The order numbers update to reflect the new sequence.
result: issue
reported: "it reorders, but theres a delay. around 2 seconds before it reorders. it's not instant — waiting for server round-trip instead of optimistic UI update"
severity: minor

### 11. Inline Override Key/Tempo
expected: Click on a song's key or tempo value in the setlist. An inline input appears. Change the value and press Enter or click away. The overridden value displays in bold blue text, distinct from the original.
result: issue
reported: "it's abit delayed. takes around 3 to 7 seconds to render the edit — no optimistic update, waits for server"
severity: minor

### 12. Reset Override
expected: On a song with an overridden key or tempo (bold blue), click the reset icon next to it. The value reverts to the original from the song library and loses the bold blue styling.
result: issue
reported: "same thing as test 11, also takes around 2 seconds to render — no optimistic update"
severity: minor

### 13. Dashboard Song Count
expected: Go to the dashboard. In the upcoming services list, each service card shows a song count (e.g., "3 songs" with a Music icon) if the service has setlist items.
result: pass

## Summary

total: 13
passed: 7
issues: 6
pending: 0
skipped: 0

## Gaps

- truth: "Song table has stable column widths with constrained tags and sortable columns"
  status: failed
  reason: "User reported: tags keep increasing column width, columns not sortable, columns too dynamic and shift as data grows"
  severity: minor
  test: 2
  artifacts: []
  missing: []

- truth: "Filters use compact popover approach (Filters button + dropdowns) instead of inline chips"
  status: failed
  reason: "User reported: filter is not efficient and space wasting. should use Filters button with popover dropdowns like ym-attend-4 members page"
  severity: minor
  test: 4
  artifacts: []
  missing: []

- truth: "Setlist operations use optimistic UI for instant feedback"
  status: failed
  reason: "User reported: drag reorder takes ~2s, inline override takes 3-7s, reset takes ~2s — all wait for server round-trip instead of optimistic updates"
  severity: minor
  test: 10
  artifacts: []
  missing: []
