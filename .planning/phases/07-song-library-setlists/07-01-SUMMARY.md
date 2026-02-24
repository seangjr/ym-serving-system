---
phase: 07-song-library-setlists
plan: 01
subsystem: database, api
tags: [postgres, supabase, zod, server-actions, songs, setlists, gin-index]

# Dependency graph
requires:
  - phase: 01-foundation-and-authentication
    provides: "Supabase client, admin client, role authorization (getUserRole, isAdminOrCommittee)"
  - phase: 02-teams-and-member-profiles
    provides: "members table (FK for created_by, added_by)"
  - phase: 03-services-and-calendar
    provides: "services table (FK for setlist_items.service_id)"
provides:
  - "songs table with title, artist, key, tempo, tags (text[]), duration, links (jsonb), notes"
  - "setlist_items table with service/song FK, sort_order, key/tempo overrides, notes"
  - "GIN index on tags for array overlap queries"
  - "get_popular_tags RPC function"
  - "lib/songs/types.ts: SongSummary, SetlistItemWithSong, SongLink, PopularTag"
  - "lib/songs/schemas.ts: 7 Zod schemas for song CRUD and setlist operations"
  - "lib/songs/queries.ts: getSongs, getSongById, getSetlistForService, getSongCountsForServices, getPopularTags, getDistinctKeys"
  - "lib/songs/actions.ts: createSong, updateSong, deleteSong, addToSetlist, removeFromSetlist, reorderSetlist, updateSetlistItemOverrides"
affects: [07-song-library-setlists]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Tag cleaning (trim, lowercase, filter empty) on song create/update", "Sort order re-numbering on setlist item removal", "GIN index for text[] array overlap queries"]

key-files:
  created:
    - supabase/migrations/00011_songs.sql
    - lib/songs/types.ts
    - lib/songs/schemas.ts
    - lib/songs/queries.ts
    - lib/songs/actions.ts
  modified: []

key-decisions:
  - "Tags stored as text[] with GIN index rather than separate tags table -- simpler, sufficient for expected scale"
  - "No UNIQUE constraint on (service_id, song_id) in setlist_items -- same song allowed twice in a setlist"
  - "Write operations use admin client (bypass RLS) with role authorization in server actions"
  - "Sort order gap handling: removeFromSetlist re-numbers all remaining items sequentially"
  - "Song links stored as jsonb array of {label, url} objects -- flexible for YouTube, chord charts, etc."

patterns-established:
  - "lib/songs/ module follows exact pattern of lib/services/ (schemas + queries + actions)"
  - "Tag cleaning pipeline: trim -> lowercase -> filter empty on all song write operations"
  - "Setlist sort_order management: max+1 on add, sequential re-number on remove, index-based on reorder"

requirements-completed: [SONG-01, SONG-02, SONG-03, SONG-05, SONG-06, SONG-07]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 7 Plan 01: Songs & Setlists Data Layer Summary

**Songs + setlist_items tables with GIN-indexed tags, full lib/songs module (types, Zod schemas, queries, server actions) following lib/services pattern**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T01:24:57Z
- **Completed:** 2026-02-24T01:28:16Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Database migration with songs and setlist_items tables, GIN index on tags, RLS policies, updated_at triggers, and get_popular_tags RPC
- Complete lib/songs/ module with 4 types, 7 Zod schemas, 6 query functions, and 7 server actions
- All server actions use role authorization (admin/committee only for writes)
- Build passes with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for songs and setlist_items tables** - `f9e70dd` (feat)
2. **Task 2: Complete lib/songs module (types, schemas, queries, actions)** - `d6ad67c` (feat)

## Files Created/Modified
- `supabase/migrations/00011_songs.sql` - Songs and setlist_items tables, indexes, RLS, triggers, get_popular_tags RPC
- `lib/songs/types.ts` - SongLink, SongSummary, SetlistItemWithSong, PopularTag interfaces
- `lib/songs/schemas.ts` - 7 Zod schemas for song CRUD and setlist operations
- `lib/songs/queries.ts` - 6 query functions (getSongs with search/filter, getSongById, getSetlistForService, getSongCountsForServices, getPopularTags, getDistinctKeys)
- `lib/songs/actions.ts` - 7 server actions with role authorization, tag cleaning, sort order management

## Decisions Made
- Tags stored as text[] with GIN index (not separate table) -- simpler for expected scale
- No UNIQUE on (service_id, song_id) -- allows same song twice in a setlist
- Sort order re-numbered sequentially after removal to prevent gaps
- Song links as jsonb array of {label, url} objects for flexibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Biome non-null assertion warning**
- **Found during:** Task 2 (lib/songs module)
- **Issue:** `remaining![i].id` used non-null assertion operator, flagged by Biome linter
- **Fix:** Extracted `remaining ?? []` to `items` variable, used `items[i].id` instead
- **Files modified:** lib/songs/actions.ts
- **Verification:** `biome check lib/songs/` passes with zero errors
- **Committed in:** d6ad67c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor style fix for linter compliance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Song library data layer complete, ready for Plan 02 (Song Library UI) and Plan 03 (Setlist Management UI)
- All types, schemas, queries, and actions exported for UI consumption

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (f9e70dd, d6ad67c) verified in git log.

---
*Phase: 07-song-library-setlists*
*Completed: 2026-02-24*
