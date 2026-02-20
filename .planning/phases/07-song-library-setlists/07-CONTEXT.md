# Phase 7: Song Library & Setlists - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Team leads and admins can manage a song library and build per-service setlists with drag-and-drop ordering. Songs have searchable/filterable metadata. Key, tempo, and notes can be overridden per service without changing the library entry. Dashboard shows song count per service.

</domain>

<decisions>
## Implementation Decisions

### Song library browsing
- Table rows layout — dense table with columns for scanning lots of songs
- Default columns: Title, Artist, Key, Tempo, Tags
- Search bar + filter chips pattern (consistent with team roster)
- Add song via dialog/modal (consistent with service creation pattern)

### Setlist building experience
- Service detail page gets tabbed view: Assignments | Setlist | Details
- Two ways to add songs: inline search picker for quick adds + "Browse Library" button opening full song library dialog
- Drag handle + numbered rows for reordering (1, 2, 3... with grip handle on left)
- No total duration display — song count is sufficient

### Per-service overrides
- Inline editing — click key or tempo value directly on setlist row to change
- Overridden values shown in bold + color accent (e.g., blue) to distinguish from defaults
- Reset button (small icon) next to overridden values to revert to library default
- Override scope: key, tempo, and per-service notes (e.g., "skip bridge", "acoustic version")

### Song metadata & tags
- Tags are free-form — type any tag when adding a song, tags accumulate organically
- Tags subsume "themes" (SONG-02) — no separate themes field; worship themes are just tags (e.g., "praise", "worship", "thanksgiving")
- Musical keys are free text (e.g., "C", "Bb", "F#m") — flexible for different notations
- Tempo (BPM) is important — always filled, show prominently, recommended field
- Multiple link slots per song — each with a label (YouTube, Spotify, chord chart, etc.)

### Claude's Discretion
- Filter chip categories and behavior (which fields get chips)
- Setlist tab empty state design
- Inline edit interaction specifics (click-to-edit vs always-editable)
- Song library dialog layout within setlist builder
- Mobile responsiveness approach for table and drag-and-drop

</decisions>

<specifics>
## Specific Ideas

- Tabbed service detail page mirrors common SaaS patterns — keeps each concern (assignments, setlist, details) focused
- Inline search picker + browse dialog gives two workflow speeds: fast for known songs, browsable for discovery
- Free-form tags over predefined categories — keeps the system flexible as worship style evolves
- Multiple links per song enables quick reference to YouTube tutorials, Spotify versions, and chord charts from one place

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-song-library-setlists*
*Context gathered: 2026-02-21*
