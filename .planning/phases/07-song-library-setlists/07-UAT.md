---
status: complete
phase: 07-song-library-setlists
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md, 07-04-SUMMARY.md
started: 2026-02-27T14:00:00Z
updated: 2026-02-27T14:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Song Library Page Access
expected: Navigate to /songs. Page shows "Song Library" heading, search bar, a "Filters" button area, and a song table with sortable column headers. Admin/committee see an "Add Song" button.
result: pass

### 2. Add a Song
expected: Click "Add Song". A dialog opens with fields for title, artist, key, tempo, duration, tags (type and press Enter/comma to add), links (add multiple label+URL pairs), and notes. Fill in details and submit. Song appears in the table.
result: pass

### 3. Song Table Column Stability
expected: The song table has stable, fixed-width columns that don't shift as data changes. Tags column constrains width and truncates/wraps gracefully. Adding songs with long titles, many tags, or varying data does not cause layout shifts.
result: pass

### 4. Song Table Sorting
expected: Click any column header (Title, Artist, Key, Tempo). An arrow icon indicates sort direction. Clicking again toggles ascending/descending. Null values sort to the bottom regardless of direction.
result: pass

### 5. Search Songs
expected: Type a song title or artist name in the search bar. Table filters instantly (client-side). Clearing the search restores the full list.
result: pass

### 6. Filter Songs (Compact Popover)
expected: Click the "Filters" button. A popover opens with dropdown selects for Key and Tag. Selecting a filter filters the table. Active filters show as badges with X to clear.
result: pass

### 7. Edit a Song
expected: Click the edit action on a song row. Form dialog opens pre-populated. Modify a field and save. Table reflects updated values.
result: pass

### 8. Delete a Song
expected: Click the delete action on a song row. After confirmation, the song is removed from the table.
result: pass

### 9. Tabbed Service Detail Page
expected: Navigate to a service detail page. Page shows tabs: "Assignments", "Setlist", and "Details". Assignments active by default. "Details" shows service info. "Setlist" shows setlist builder.
result: pass

### 10. Add Song to Setlist
expected: On Setlist tab, use song picker or "Browse Library" to add a song. Song appears as numbered row with key, tempo, and grip handle.
result: pass

### 11. Drag-and-Drop Reorder Setlist
expected: Drag a song by grip handle to new position. Order updates instantly (optimistic UI).
result: pass

### 12. Inline Override Key/Tempo
expected: Click key or tempo value, inline input appears, change and confirm. Overridden value displays instantly in bold blue (optimistic UI).
result: pass

### 13. Reset Override
expected: Click reset icon on overridden value. Reverts instantly to original (optimistic UI), loses bold blue styling.
result: pass

## Summary

total: 13
passed: 13
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
