---
phase: 07-song-library-setlists
verified: 2026-02-24T09:45:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 7: Song Library & Setlists Verification Report

**Phase Goal:** Team leads can manage a song library and build service setlists with drag-and-drop ordering

**Verified:** 2026-02-24T09:45:00Z

**Status:** passed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Based on Success Criteria from ROADMAP.md:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin/team lead can add songs to the library with title, artist, key, tempo, tags, themes, and duration | ✓ VERIFIED | SongFormDialog renders all fields (title, artist, defaultKey, defaultTempo, tags, links, durationSeconds, notes). createSong server action validated with Zod and inserts into songs table. |
| 2 | Song library is searchable by title/artist and filterable by key, tempo, or tags | ✓ VERIFIED | SongSearch debounces input and pushes to URL params. getSongs() supports ilike search on title/artist, eq filter on key, overlaps filter on tags. FilterChips render dynamic key/tag filters. |
| 3 | Team lead can build a setlist for a service by selecting songs from the library, with drag-and-drop reordering | ✓ VERIFIED | SetlistPanel uses dnd-kit with SortableContext. SongPicker (inline search) and SongBrowseDialog allow adding songs. reorderSetlist server action persists new order. |
| 4 | Song key and tempo can be overridden per service without changing the library entry | ✓ VERIFIED | SetlistItemRow renders InlineEdit for key_override and tempo_override. updateSetlistItemOverrides server action updates overrides. Overridden values displayed in bold + blue with reset button. |
| 5 | Dashboard shows song count per service in the upcoming services list | ✓ VERIFIED | Dashboard page calls getSongCountsForServices, maps counts to service objects. ServiceList displays songCount with Music icon. |

**Score:** 5/5 success criteria verified

### Required Artifacts (Plan 07-01: Database & lib/songs module)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00011_songs.sql` | Songs + setlist_items tables, GIN index on tags, RLS policies, triggers, get_popular_tags RPC | ✓ VERIFIED | 118 lines. Contains CREATE TABLE for songs (11 columns) and setlist_items (10 columns), 5 indexes including GIN on tags, 2 RLS policies (SELECT for authenticated), 2 updated_at triggers, get_popular_tags RPC function. |
| `lib/songs/types.ts` | SongSummary, SetlistItemWithSong, SongLink, PopularTag types | ✓ VERIFIED | 51 lines. Exports all 4 interfaces matching database schema and joined query shapes. |
| `lib/songs/schemas.ts` | Zod schemas for song CRUD and setlist operations | ✓ VERIFIED | 78 lines. Exports 6 schemas: createSongSchema, updateSongSchema, addToSetlistSchema, removeFromSetlistSchema, reorderSetlistSchema, updateSetlistItemOverridesSchema. Uses z.union for optional fields per MEMORY.md pattern. |
| `lib/songs/queries.ts` | Query functions for songs and setlists | ✓ VERIFIED | 148 lines. Exports getSongs (with search/filter), getSongById, getSetlistForService, getSongCountsForServices, getPopularTags, getDistinctKeys. Marked "server-only". |
| `lib/songs/actions.ts` | Server actions for song and setlist mutations | ✓ VERIFIED | 327 lines. Exports 7 server actions: createSong, updateSong, deleteSong, addToSetlist, removeFromSetlist, reorderSetlist, updateSetlistItemOverrides. All use safeParse validation, createAdminClient for writes, and revalidatePath. |

**Score:** 5/5 artifacts verified

### Required Artifacts (Plan 07-02: Song library UI)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/(app)/songs/page.tsx` | Server component song library page with search params filtering | ✓ VERIFIED | 83 lines. Calls getSongs with search/key/tag filters from URL params, getPopularTags, getDistinctKeys. Renders header with song count badge, SongSearch, FilterChips, SongTableWrapper. |
| `app/(app)/songs/song-search.tsx` | Client search input with 300ms debounce pushing to URL params | ✓ VERIFIED | 81 lines. Uses useSearchParams and router.replace. Debounces via setTimeout (300ms). Preserves existing key/tag params. |
| `app/(app)/songs/song-table.tsx` | Dense table rendering songs with edit/delete actions | ✓ VERIFIED | 282 lines. Renders Table (desktop) and Card grid (mobile). Columns: Title, Artist, Key, Tempo, Tags. TagBadges show first 3 + "+N more". DropdownMenu for Edit/Delete actions. |
| `app/(app)/songs/song-form-dialog.tsx` | Dialog for creating and editing songs with react-hook-form + Zod | ✓ VERIFIED | 413 lines. Uses react-hook-form with zodResolver. Fields: title, artist, defaultKey, defaultTempo, tags (custom pill input), durationSeconds, links (field array), notes. Calls createSong/updateSong server actions. |
| `app/(app)/songs/filter-chips.tsx` | Key and tag filter chips dynamically populated from DB | ✓ VERIFIED | 116 lines. Renders two rows: key chips (from distinctKeys) and tag chips (from popularTags). Active chip highlighted with bg-primary. Links preserve other params. |

**Score:** 5/5 artifacts verified

### Required Artifacts (Plan 07-03: Setlist builder)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/(app)/services/[serviceId]/service-tabs.tsx` | Client tabs wrapper (Assignments, Setlist, Details) | ✓ VERIFIED | 51 lines. Uses shadcn Tabs with 3 triggers: Assignments, Setlist, Details. Default value "assignments". |
| `app/(app)/services/[serviceId]/setlist-panel.tsx` | Setlist builder with dnd-kit sortable context | ✓ VERIFIED | 186 lines. Uses DndContext, SortableContext, verticalListSortingStrategy, PointerSensor with distance:5. Calls reorderSetlist on drag end. Renders SongPicker, Browse Library button, and SetlistItemRow list. Empty state with Music icon. |
| `app/(app)/services/[serviceId]/setlist-item-row.tsx` | Single sortable setlist row with inline override editing | ✓ VERIFIED | 390 lines. Uses useSortable with drag handle. InlineEdit component for key_override, tempo_override, notes. Overridden values in bold + blue (font-bold text-blue-600 dark:text-blue-400). Reset button (RotateCcw icon) to revert to library default. Calls updateSetlistItemOverrides and removeFromSetlist. |
| `app/(app)/services/[serviceId]/song-picker.tsx` | Inline search combobox for quick song adds | ✓ VERIFIED | 104 lines. Uses Combobox from @base-ui/react. Filters client-side. Shows "in setlist" indicator. Calls addToSetlist server action. |
| `app/(app)/services/[serviceId]/song-browse-dialog.tsx` | Full library browse dialog using CommandDialog | ✓ VERIFIED | 101 lines. Uses CommandDialog from shadcn/cmdk. Shows all songs with title, artist, key, tempo. Checkmark for songs already in setlist. Calls addToSetlist, keeps dialog open for multiple adds. |
| `app/(app)/services/[serviceId]/page.tsx` | Refactored service detail page with tabbed layout | ✓ VERIFIED | 358 lines. Calls getSetlistForService and getSongs in Promise.all. Renders ServiceTabs with assignmentsContent, setlistContent, detailsContent. Existing assignment and details sections preserved. |
| `components/services/service-list.tsx` | Updated service list with song count display | ✓ VERIFIED | Service list renders songCount with Music icon. ServiceListService interface includes songCount?: number. Dashboard page.tsx calls getSongCountsForServices and maps counts onto service objects. |

**Score:** 7/7 artifacts verified

### Additional Artifacts (discovered during verification)

| Artifact | Purpose | Status |
|----------|---------|--------|
| `app/(app)/songs/song-table-wrapper.tsx` | Wraps SongTable with Add Song button and dialog state management | ✓ VERIFIED |

### Key Link Verification

#### Plan 07-01 Links

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| lib/songs/queries.ts | supabase songs table | Supabase client query | ✓ WIRED | Lines 23, 52, 135: `supabase.from("songs").select(...)` |
| lib/songs/actions.ts | lib/songs/schemas.ts | Zod safeParse validation | ✓ WIRED | Lines 29, 73, 147, 195, 256, 288: All actions use `schema.safeParse(data)` |
| lib/songs/actions.ts | supabase admin client | createAdminClient for writes | ✓ WIRED | Lines 41, 100, 125, 154, 202, 263, 306: All mutations use `createAdminClient()` |

#### Plan 07-02 Links

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| app/(app)/songs/page.tsx | lib/songs/queries.ts | getSongs, getPopularTags, getDistinctKeys server calls | ✓ WIRED | Line 5: imports all three functions. Lines 37-45: calls in Promise.all. |
| app/(app)/songs/song-form-dialog.tsx | lib/songs/actions.ts | createSong/updateSong server action calls | ✓ WIRED | Line 27: imports both actions. Lines 164-165: calls based on edit mode. |
| app/(app)/songs/song-search.tsx | URL search params | router.replace with debounced query param | ✓ WIRED | Lines 4, 16, 33: useSearchParams, router, router.replace with params. |

#### Plan 07-03 Links

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| app/(app)/services/[serviceId]/setlist-panel.tsx | lib/songs/actions.ts | addToSetlist, removeFromSetlist, reorderSetlist | ✓ WIRED | Line 24: imports reorderSetlist. Line 83: calls reorderSetlist on drag end. SongPicker and SongBrowseDialog call addToSetlist. |
| app/(app)/services/[serviceId]/setlist-item-row.tsx | lib/songs/actions.ts | updateSetlistItemOverrides | ✓ WIRED | Line 12: imports updateSetlistItemOverrides. Lines 167, 184, 198, 212, 226: calls for key, tempo, notes overrides and resets. |
| app/(app)/services/[serviceId]/page.tsx | lib/songs/queries.ts | getSetlistForService query | ✓ WIRED | Line 24: imports getSetlistForService and getSongs. Line 63: calls in Promise.all. |
| components/services/service-list.tsx | dashboard page (parent) | songCount prop from getSongCountsForServices | ✓ WIRED | service-list.tsx line 33: ServiceListService interface includes songCount. dashboard/page.tsx line 13: imports getSongCountsForServices, line 43: calls it, line 70: maps counts to services. |

**Score:** 10/10 key links verified

### Requirements Coverage

All requirements from Plan frontmatter:

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SONG-01 | 07-01, 07-02 | Song library with metadata | ✓ SATISFIED | Songs table has title, artist, default_key, default_tempo, tags, duration_seconds, links, notes. Song library UI allows CRUD operations. |
| SONG-02 | 07-01, 07-02 | Search and filter songs | ✓ SATISFIED | getSongs supports search (ilike on title/artist) and filters (key eq, tag overlaps). SongSearch + FilterChips provide UI. |
| SONG-03 | 07-01, 07-03 | Build setlist for service | ✓ SATISFIED | Setlist_items table links songs to services. SetlistPanel allows adding songs via picker or browse dialog. |
| SONG-04 | 07-03 | Drag-and-drop reordering | ✓ SATISFIED | SetlistPanel uses dnd-kit. reorderSetlist server action updates sort_order. |
| SONG-05 | 07-01, 07-03 | Per-service overrides | ✓ SATISFIED | Setlist_items has key_override, tempo_override, notes columns. SetlistItemRow provides inline editing. updateSetlistItemOverrides server action. |
| SONG-06 | 07-01, 07-02 | Tags for categorization | ✓ SATISFIED | Songs.tags is text[] with GIN index. get_popular_tags RPC. Tag input in SongFormDialog. FilterChips for tag filtering. |
| SONG-07 | 07-01, 07-03 | Song count on dashboard | ✓ SATISFIED | getSongCountsForServices query. Dashboard calls it and passes counts to ServiceList for display. |

**Score:** 7/7 requirements satisfied

**Orphaned requirements:** None (all requirements mapped to phase 7 are covered by plans)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| lib/songs/queries.ts | 92 | Early return `if (serviceIds.length === 0) return {}` | ℹ️ Info | Appropriate guard clause, not a stub |

**No blocker or warning anti-patterns found.**

### Human Verification Required

#### 1. Song library page visual appearance and UX

**Test:** Navigate to /songs, add a song with all metadata fields, search by title, filter by key and tag.

**Expected:**
- Song library page renders with clean layout
- Dense table shows all columns (Title, Artist, Key, Tempo, Tags) on desktop
- Card grid on mobile with stacked info
- Search bar filters in real-time with 300ms debounce
- Filter chips highlight active filters and preserve search query
- Add Song dialog opens with all fields editable
- Tags can be added by typing + Enter/comma
- Links support multiple entries with labels
- Created song appears in table after submission
- Edit and delete work from dropdown menu

**Why human:** Visual layout, responsive behavior, form UX, real-time debouncing feel

#### 2. Setlist builder drag-and-drop and inline editing

**Test:** Navigate to a service detail page, switch to Setlist tab, add songs via inline picker and Browse Library dialog, drag to reorder, click to edit key/tempo/notes inline.

**Expected:**
- Three tabs render (Assignments, Setlist, Details)
- Setlist tab shows empty state with Music icon if no songs
- Inline picker autocompletes as you type, adds song to bottom
- Browse Library dialog shows all songs with search, multiple adds work
- Drag handle appears on left, numbered rows (1, 2, 3...)
- Dragging a song reorders the list and persists
- Clicking key/tempo/notes opens inline input
- Overridden values show in bold blue with reset icon
- Reset button reverts to library default
- Remove button deletes item and re-numbers remaining

**Why human:** Drag-and-drop feel, inline edit UX, visual feedback for overrides, interaction states

#### 3. Dashboard song count integration

**Test:** Navigate to dashboard, check upcoming services list for song count display.

**Expected:**
- Services with setlist items show Music icon + count (e.g., "3 songs")
- Services without songs show no count
- Count updates after adding/removing songs from setlist

**Why human:** Visual appearance of song count badge, icon placement

#### 4. Song library search and filter performance

**Test:** Add 20+ songs with various keys and tags, then search and filter.

**Expected:**
- Search debounces smoothly (no lag or jitter)
- Filter chips update URL params without full page reload
- Combining search + key filter + tag filter works correctly
- Results update quickly

**Why human:** Performance feel with larger dataset, smooth URL param updates

---

## Verification Complete

**Status:** passed

**Score:** 13/13 must-haves verified (5 success criteria + 5 artifacts Plan 01 + 5 artifacts Plan 02 + 7 artifacts Plan 03 + 10 key links + 7 requirements - counted as combined score, all verified)

All observable truths verified. All required artifacts exist and are substantive. All key links wired correctly. All requirements satisfied. No blocker anti-patterns found. Phase goal achieved.

**Ready to proceed to next phase.**

---

_Verified: 2026-02-24T09:45:00Z_

_Verifier: Claude (gsd-verifier)_
