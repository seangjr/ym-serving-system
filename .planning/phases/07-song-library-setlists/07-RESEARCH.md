# Phase 7: Song Library & Setlists - Research

**Researched:** 2026-02-21
**Domain:** Song CRUD, setlist management, drag-and-drop reordering, inline editing, Supabase array filtering
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Song library browsing
- Table rows layout -- dense table with columns for scanning lots of songs
- Default columns: Title, Artist, Key, Tempo, Tags
- Search bar + filter chips pattern (consistent with team roster)
- Add song via dialog/modal (consistent with service creation pattern)

#### Setlist building experience
- Service detail page gets tabbed view: Assignments | Setlist | Details
- Two ways to add songs: inline search picker for quick adds + "Browse Library" button opening full song library dialog
- Drag handle + numbered rows for reordering (1, 2, 3... with grip handle on left)
- No total duration display -- song count is sufficient

#### Per-service overrides
- Inline editing -- click key or tempo value directly on setlist row to change
- Overridden values shown in bold + color accent (e.g., blue) to distinguish from defaults
- Reset button (small icon) next to overridden values to revert to library default
- Override scope: key, tempo, and per-service notes (e.g., "skip bridge", "acoustic version")

#### Song metadata & tags
- Tags are free-form -- type any tag when adding a song, tags accumulate organically
- Musical keys are free text (e.g., "C", "Bb", "F#m") -- flexible for different notations
- Tempo (BPM) is important -- always filled, show prominently, recommended field
- Multiple link slots per song -- each with a label (YouTube, Spotify, chord chart, etc.)

### Claude's Discretion

- Filter chip categories and behaviour (which fields get chips)
- Setlist tab empty state design
- Inline edit interaction specifics (click-to-edit vs always-editable)
- Song library dialog layout within setlist builder
- Mobile responsiveness approach for table and drag-and-drop

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SONG-01 | Admin/team lead can add songs to a library with title, artist, key, and tempo | DB schema for `songs` table, `createSong` server action pattern, song form dialog |
| SONG-02 | Songs support tags, themes, and duration metadata | `text[]` array column for tags, GIN index for array filtering, optional duration/themes fields |
| SONG-03 | Team lead can build a setlist for a service by selecting songs from the library | `setlist_items` join table, inline search picker using existing Combobox, browse dialog using Command |
| SONG-04 | Setlist supports drag-and-drop reordering | Existing @dnd-kit/sortable pattern from assignment-panel.tsx, `reorderSetlist` server action |
| SONG-05 | Song key and tempo can be overridden per service (without changing the library entry) | Override columns on `setlist_items` table (key_override, tempo_override, notes), inline edit UI |
| SONG-06 | Song library is searchable and filterable | `ilike` on title/artist, `overlaps` on tags array, filter chips pattern from team roster |
| SONG-07 | Dashboard shows song count per service | LEFT JOIN count on `setlist_items` in upcoming services query, display in ServiceList |
</phase_requirements>

## Summary

This phase adds a song library (CRUD) and per-service setlist builder to the existing YM Serving System. The codebase already has all required dependencies installed (`@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0, `cmdk` 1.1.1, `zod` 4.3.6, `react-hook-form` 7.71.1) and established patterns for every major pattern needed: server actions with Zod validation, admin client for DB writes, search bar with debounce + URL params, filter chips, dense table layouts, drag-and-drop sortable lists, and dialog-based forms.

The database layer requires two new tables: `songs` (library entries with text[] tags and JSONB links) and `setlist_items` (join table between services and songs, with override columns and sort order). Text arrays with GIN indexes are the correct choice for free-form tags -- they enable both `.contains()` (AND) and `.overlaps()` (OR) filtering through the Supabase JS client, with strong query performance.

The service detail page currently renders assignments directly. It needs to be refactored to a tabbed layout (Assignments | Setlist | Details) using the existing `Tabs` component from shadcn/ui (already installed, uses radix-ui). The existing `AssignmentPanel` and its dnd-kit pattern can be directly replicated for setlist item reordering, reducing implementation risk significantly.

**Primary recommendation:** Follow existing codebase patterns exactly -- use `text[]` for tags with GIN index, replicate the assignment-panel dnd-kit pattern for setlist reordering, and use the team roster search/filter chip pattern for song library browsing.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.3.1 | Drag-and-drop foundation | Already used in assignment-panel.tsx |
| @dnd-kit/sortable | 10.0.0 | Sortable list preset | Already used for position reordering |
| @dnd-kit/utilities | 3.2.2 | CSS.Transform helper | Already used in SortableSlot |
| radix-ui (Tabs) | 1.4.3 | Tab navigation primitives | Already installed, used by shadcn/ui tabs.tsx |
| @base-ui/react (Combobox) | 1.1.0 | Inline search picker | Already used for member assignment combobox |
| cmdk | 1.1.1 | Command menu for browse dialog | Already installed, command.tsx component exists |
| zod | 4.3.6 | Schema validation | Already used for all server action validation |
| react-hook-form | 7.71.1 | Form state management | Already used for service forms |
| @hookform/resolvers | 5.2.2 | Zod resolver for forms | Already installed |
| lucide-react | 0.563.0 | Icons (Music, GripVertical, etc.) | Already used throughout |
| sonner | 2.0.7 | Toast notifications | Already used for action feedback |

### Supporting (No New Installs Required)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date formatting | Already imported in services code |

**Installation:** No new packages needed. All dependencies are already in package.json.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| text[] for tags | Separate tags table with join | Over-engineered for free-form tags; text[] is simpler and faster with GIN |
| @base-ui Combobox for inline search | cmdk Command | Combobox is better for single-item selection; Command is better for full browse dialog |
| Inline click-to-edit | Always-editable inputs | Click-to-edit is cleaner; avoids visual clutter on read-only view |

## Architecture Patterns

### Recommended Project Structure
```
lib/
  songs/
    actions.ts          # Server actions: createSong, updateSong, deleteSong, addToSetlist, removeFromSetlist, reorderSetlist, updateSetlistItemOverrides
    queries.ts          # getSongs, getSongById, getSetlistForService, getSongCountsForServices
    schemas.ts          # Zod schemas for song CRUD + setlist operations
    types.ts            # TypeScript interfaces (SongSummary, SetlistItem, etc.)

app/(app)/
  songs/
    page.tsx            # Song library page (server component)
    song-search.tsx     # Client: debounced search input (like RosterSearch)
    song-form-dialog.tsx # Client: add/edit song dialog
    song-table.tsx      # Client: dense table with inline actions

  services/[serviceId]/
    page.tsx            # REFACTORED: add tabbed view
    service-tabs.tsx    # Client: Tabs wrapper (Assignments | Setlist | Details)
    setlist-panel.tsx   # Client: setlist builder with dnd-kit
    setlist-item-row.tsx # Client: single sortable row with inline overrides
    song-picker.tsx     # Client: inline search combobox for quick adds
    song-browse-dialog.tsx # Client: full library browse dialog

components/songs/
    (optional shared components if needed)

supabase/migrations/
    00011_songs.sql     # songs + setlist_items tables, indexes, RLS
```

### Pattern 1: Server Component Page with URL-based Filtering (Song Library)
**What:** Song library page is a server component that reads `searchParams` for query/filter state, fetches filtered data, and renders. Client components handle only search input debounce and filter chip links.
**When to use:** Song library browsing (matches team roster pattern exactly).
**Example:**
```typescript
// app/(app)/songs/page.tsx
// Source: existing pattern in app/(app)/team-roster/page.tsx

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; key?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const songs = await getSongs({
    search: params.q,
    key: params.key,
    tag: params.tag,
  });

  return (
    <div className="flex flex-col gap-6">
      <SongSearch defaultValue={params.q ?? ""} />
      <FilterChips activeKey={params.key} activeTag={params.tag} />
      <SongTable songs={songs} canManage={canManage} />
    </div>
  );
}
```

### Pattern 2: Tabbed Service Detail (Assignments | Setlist | Details)
**What:** Refactor service detail page to use shadcn Tabs, moving current content into tab panels. Tabs are client-side (no URL routing needed).
**When to use:** Service detail page restructuring.
**Example:**
```typescript
// app/(app)/services/[serviceId]/service-tabs.tsx
// Source: existing components/ui/tabs.tsx (radix-ui)

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ServiceTabs({
  assignmentsContent,
  setlistContent,
  detailsContent,
}: {
  assignmentsContent: React.ReactNode;
  setlistContent: React.ReactNode;
  detailsContent: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="assignments">
      <TabsList>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="setlist">Setlist</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <TabsContent value="assignments">{assignmentsContent}</TabsContent>
      <TabsContent value="setlist">{setlistContent}</TabsContent>
      <TabsContent value="details">{detailsContent}</TabsContent>
    </Tabs>
  );
}
```

### Pattern 3: Setlist Reordering with dnd-kit (Clone of Assignment Panel)
**What:** Replicate the existing SortableSlot pattern from assignment-panel.tsx for setlist items. Use DndContext + SortableContext + useSortable + verticalListSortingStrategy.
**When to use:** Setlist drag-and-drop reordering.
**Example:**
```typescript
// Source: existing app/(app)/services/[serviceId]/assignment-panel.tsx

function SortableSetlistItem({ item }: { item: SetlistItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="w-6 text-center text-xs text-muted-foreground">
        {item.sortOrder}
      </span>
      <SetlistItemRow item={item} />
    </div>
  );
}
```

### Pattern 4: Inline Click-to-Edit for Overrides
**What:** Display override values as text by default. On click, switch to an input field. On blur or Enter, save via server action. Show bold + blue accent for overridden values with a reset icon button.
**When to use:** Key and tempo overrides on setlist rows.
**Example:**
```typescript
// Inline edit cell pattern
function InlineEditCell({
  value,
  defaultValue,
  isOverridden,
  onSave,
  onReset,
}: {
  value: string;
  defaultValue: string;
  isOverridden: boolean;
  onSave: (newValue: string) => void;
  onReset: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onSave(draft); setEditing(false); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="h-7 w-16 text-sm"
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "rounded px-1.5 py-0.5 text-sm hover:bg-accent",
        isOverridden && "font-bold text-blue-600 dark:text-blue-400"
      )}
    >
      {value || defaultValue}
      {isOverridden && (
        <button onClick={(e) => { e.stopPropagation(); onReset(); }}>
          <RotateCcw className="ml-1 inline size-3 text-muted-foreground" />
        </button>
      )}
    </button>
  );
}
```

### Pattern 5: Server Actions with Admin Client (Existing Pattern)
**What:** All write operations use server actions with Zod validation + admin client (bypasses RLS). Role check first, parse input, execute, revalidate.
**When to use:** All song and setlist mutations.
**Example:**
```typescript
// Source: existing lib/services/actions.ts pattern

"use server";

export async function createSong(
  data: unknown,
): Promise<{ success: true; songId: string } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = createSongSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid song data." };
  }

  const admin = createAdminClient();
  const { data: song, error } = await admin
    .from("songs")
    .insert({
      title: parsed.data.title,
      artist: parsed.data.artist || null,
      default_key: parsed.data.defaultKey || null,
      default_tempo: parsed.data.defaultTempo ?? null,
      tags: parsed.data.tags ?? [],
      duration_seconds: parsed.data.durationSeconds ?? null,
      links: parsed.data.links ?? [],
      created_by: memberId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/songs");
  return { success: true, songId: song.id };
}
```

### Anti-Patterns to Avoid
- **Separate tags table for free-form tags:** Over-engineered. Use `text[]` with GIN index. Tags are simple strings, not entities that need their own lifecycle.
- **Client-side song filtering:** The song library should filter server-side via URL search params (like team roster). Client-side filtering doesn't scale and creates stale data issues.
- **Nested DndContext for setlist inside Tabs:** Tabs and DndContext work fine together, but do NOT nest DndContext from the assignment panel inside the setlist panel. Each panel has its own independent DndContext.
- **Storing overrides in a separate table:** Override columns (key_override, tempo_override, notes) belong on `setlist_items`. A separate table adds unnecessary joins.
- **Using `valueAsNumber: true` for tempo input:** Per MEMORY.md, use `setValueAs` instead to handle NaN properly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reordering | Custom mouse/touch event handlers | @dnd-kit/sortable (already installed) | Touch support, accessibility, keyboard nav, animation all built in |
| Search with debounce | Custom debounce utility | RosterSearch pattern (300ms setTimeout) | Already proven in codebase, URL-param based |
| Combobox with search | Custom dropdown with filtering | @base-ui/react Combobox (already installed) | Automatic filtering, keyboard nav, accessible |
| Command palette / browse | Custom modal with search | cmdk CommandDialog (already installed) | Fast fuzzy search, keyboard navigation |
| Tab navigation | Custom tab state management | radix-ui Tabs via shadcn (already installed) | Accessible, keyboard navigable, ARIA compliant |
| Array containment queries | Custom SQL functions | Supabase `.contains()` / `.overlaps()` | Native Postgres operators, GIN-indexed |
| Form validation | Manual checks | Zod + react-hook-form (already installed) | Type-safe, composable, project standard |

**Key insight:** Every major interaction pattern in this phase already exists in the codebase. The assignment panel provides the dnd-kit template, team roster provides search/filter, service form dialog provides the CRUD dialog pattern. Implementation is primarily composition of existing patterns.

## Common Pitfalls

### Pitfall 1: Text Array Empty String in Tags
**What goes wrong:** User types a tag with trailing space or submits empty string, resulting in `["", "worship"]` stored in DB.
**Why it happens:** Free-form tag input doesn't trim/filter before saving.
**How to avoid:** In the Zod schema, transform tags array to filter empty strings and trim whitespace: `.transform(tags => tags.map(t => t.trim().toLowerCase()).filter(Boolean))`. Apply this in the server action before DB insert.
**Warning signs:** Empty badges rendering in tag lists, duplicate tags differing only by case.

### Pitfall 2: Setlist Sort Order Gaps After Deletion
**What goes wrong:** After removing a song from a setlist (e.g., deleting item with sort_order=2), remaining items have gaps (1, 3, 4) instead of (1, 2, 3).
**Why it happens:** Delete operation only removes the row without re-indexing siblings.
**How to avoid:** After deletion, re-number remaining items. Use a single transaction: delete the item, then update sort_order for all remaining items ordered by current sort_order.
**Warning signs:** Numbered rows display (1, 3, 4) instead of (1, 2, 3).

### Pitfall 3: Optimistic Updates vs Server State in dnd-kit
**What goes wrong:** User drags item, sees reorder, then server action fails -- UI is now out of sync.
**Why it happens:** The existing assignment-panel.tsx pattern uses `router.refresh()` after server action, which works but causes a flash.
**How to avoid:** Follow the same pattern as assignment-panel.tsx (server action + router.refresh). The existing approach is proven and consistent. Do NOT introduce optimistic state management that differs from the rest of the codebase.
**Warning signs:** Inconsistent reorder behaviour between assignment panel and setlist panel.

### Pitfall 4: Song Library Dialog Scroll Conflicts with Setlist DndContext
**What goes wrong:** Opening the "Browse Library" dialog while on the Setlist tab causes scroll/pointer events to conflict with the drag-and-drop context.
**Why it happens:** Dialog portals outside the DOM tree but pointer events may bubble.
**How to avoid:** The dialog renders via a Portal (radix-ui default), which isolates it from the DndContext. Ensure the browse dialog uses the existing `Dialog` or `CommandDialog` component (both use portals). Do NOT render the browse UI inline within the setlist panel.
**Warning signs:** Drag activation when trying to scroll the browse dialog.

### Pitfall 5: Zod Empty String Pattern for Optional Fields
**What goes wrong:** react-hook-form sends `""` for unfilled optional text inputs, but Zod `.optional()` only accepts `undefined`.
**Why it happens:** HTML inputs return empty strings, not undefined.
**How to avoid:** Per project MEMORY.md, use `z.union([z.string().regex(...), z.literal("")]).optional()` pattern. Convert empty strings to null server-side with `|| null`.
**Warning signs:** Zod validation errors on optional fields that the user left blank.

### Pitfall 6: Missing GIN Index on Tags Column
**What goes wrong:** Tag filtering becomes slow as the song library grows.
**Why it happens:** Without a GIN index, Postgres does sequential scans for array containment/overlap queries.
**How to avoid:** Create the GIN index in the migration: `CREATE INDEX idx_songs_tags ON songs USING gin(tags);`
**Warning signs:** Slow filter responses on songs page when filtering by tags.

## Code Examples

### Database Migration: songs + setlist_items
```sql
-- Migration: 00011_songs
-- Creates songs, setlist_items tables with RLS, indexes, triggers

-- 1. songs (song library)
CREATE TABLE public.songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  default_key text,                    -- free text: "C", "Bb", "F#m"
  default_tempo int,                   -- BPM
  tags text[] NOT NULL DEFAULT '{}',   -- free-form tags
  duration_seconds int,                -- optional song duration
  links jsonb NOT NULL DEFAULT '[]',   -- [{label: "YouTube", url: "..."}, ...]
  notes text,                          -- general notes about the song
  created_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. setlist_items (per-service song entries with overrides)
CREATE TABLE public.setlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  key_override text,                   -- null = use song default
  tempo_override int,                  -- null = use song default
  notes text,                          -- per-service notes ("skip bridge")
  added_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_songs_title ON public.songs (title);
CREATE INDEX idx_songs_artist ON public.songs (artist);
CREATE INDEX idx_songs_tags ON public.songs USING gin(tags);
CREATE INDEX idx_setlist_items_service ON public.setlist_items (service_id, sort_order);
CREATE INDEX idx_setlist_items_song ON public.setlist_items (song_id);

-- 4. RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view songs"
  ON public.songs FOR SELECT TO authenticated USING (true);

ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view setlist items"
  ON public.setlist_items FOR SELECT TO authenticated USING (true);

-- 5. updated_at triggers
CREATE TRIGGER set_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_setlist_items_updated_at
  BEFORE UPDATE ON public.setlist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### Supabase Query: Search + Filter Songs
```typescript
// Source: Supabase JS docs for ilike, overlaps, contains

export async function getSongs(filters?: {
  search?: string;
  key?: string;
  tag?: string;
}): Promise<SongSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("songs")
    .select("*")
    .order("title", { ascending: true });

  // Text search on title and artist
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,artist.ilike.%${filters.search}%`
    );
  }

  // Filter by key
  if (filters?.key) {
    query = query.eq("default_key", filters.key);
  }

  // Filter by tag (overlaps = any matching tag)
  if (filters?.tag) {
    query = query.overlaps("tags", [filters.tag]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SongSummary[];
}
```

### Supabase Query: Setlist with Song Data + Overrides
```typescript
// Fetch setlist items with joined song data for a service

export async function getSetlistForService(
  serviceId: string,
): Promise<SetlistItemWithSong[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("setlist_items")
    .select(`
      *,
      songs(id, title, artist, default_key, default_tempo, tags, duration_seconds)
    `)
    .eq("service_id", serviceId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SetlistItemWithSong[];
}
```

### Supabase Query: Song Counts for Dashboard
```typescript
// Get song counts per service for upcoming services list (SONG-07)

export async function getSongCountsForServices(
  serviceIds: string[],
): Promise<Record<string, number>> {
  if (serviceIds.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("setlist_items")
    .select("service_id")
    .in("service_id", serviceIds);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const item of data ?? []) {
    counts[item.service_id] = (counts[item.service_id] ?? 0) + 1;
  }
  return counts;
}
```

### Zod Schema: Song Input
```typescript
// Source: existing lib/services/schemas.ts pattern

import { z } from "zod";

const songLinkSchema = z.object({
  label: z.string().min(1, "Label is required").max(50),
  url: z.string().url("Must be a valid URL"),
});

export const createSongSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  artist: z.union([z.string().max(200), z.literal("")]).optional(),
  defaultKey: z.union([z.string().max(10), z.literal("")]).optional(),
  defaultTempo: z.number().int().min(20).max(300).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  durationSeconds: z.number().int().min(1).max(3600).optional(),
  links: z.array(songLinkSchema).max(10).optional(),
  notes: z.union([z.string().max(2000), z.literal("")]).optional(),
});

export const updateSongSchema = createSongSchema.partial().extend({
  id: z.string().uuid(),
});

export const addToSetlistSchema = z.object({
  serviceId: z.string().uuid(),
  songId: z.string().uuid(),
});

export const reorderSetlistSchema = z.object({
  serviceId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(1),
});

export const updateSetlistItemOverridesSchema = z.object({
  itemId: z.string().uuid(),
  keyOverride: z.union([z.string().max(10), z.literal("")]).optional(),
  tempoOverride: z.number().int().min(20).max(300).optional(),
  notes: z.union([z.string().max(2000), z.literal("")]).optional(),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/sortable | 2022-2023 | Project already uses dnd-kit; no change needed |
| Separate tags table | text[] with GIN index | PostgreSQL convention | Simpler queries, better performance for free-form tags |
| Tanstack Table for data tables | Simple shadcn Table component | N/A | Project uses simple Table; no need for Tanstack overhead at this scale |
| Full-page edit forms | Dialog-based CRUD | Project convention | Consistent with service creation, member assignment patterns |

**Deprecated/outdated:**
- react-beautiful-dnd: Deprecated/unmaintained. Project already uses @dnd-kit which is the current standard.
- Zod v3 `z.preprocess()`: Project uses Zod v4 with different API. Use `z.union()` pattern per MEMORY.md.

## Discretion Recommendations

### Filter Chip Categories
**Recommendation:** Two chip rows:
1. **Key chips:** Show the 8-10 most common keys found in the library (dynamically populated from DB). "All Keys" default.
2. **Tag chips:** Show the 8-10 most frequently used tags (dynamically populated from DB). "All Tags" default.

Tempo is better as a search refinement than chips (too many distinct values). Use URL search params for all filters (consistent with team roster).

### Setlist Tab Empty State
**Recommendation:** Centered dashed-border container with Music icon, "No songs in setlist" heading, "Add songs from the library to build your setlist" subtitle, and a primary "Add Song" button. Follow the exact pattern from the assignment panel empty state:
```tsx
<div className="flex items-center justify-center rounded-lg border border-dashed p-8">
  <div className="flex flex-col items-center gap-2 text-center">
    <Music className="size-10 text-muted-foreground/50" />
    <p className="text-sm font-medium">No songs in setlist</p>
    <p className="text-xs text-muted-foreground">Add songs to build the setlist for this service</p>
  </div>
</div>
```

### Inline Edit Interaction
**Recommendation:** Click-to-edit. Display values as styled text by default. Single click opens a compact input. Save on blur or Enter. Cancel on Escape. This is cleaner than always-editable fields because:
- Most users view setlists more than they edit them
- Reduces visual noise (inputs everywhere look like a spreadsheet)
- Bold + blue accent for overridden values is more visible against plain text than against input borders

### Song Library Dialog Within Setlist Builder
**Recommendation:** Use the existing `CommandDialog` component (cmdk-based). It provides:
- Built-in search input at top
- Keyboard navigation
- Renders as a modal portal (isolates from DndContext)
- Already matches the project's design language

Layout: Search input at top, scrollable list of songs below. Each song row shows title, artist, key, tempo. Click a song to add it to the setlist and keep the dialog open (for adding multiple). Show a checkmark next to songs already in the setlist.

### Mobile Responsiveness
**Recommendation:**
- **Song library table:** On mobile (< md), switch from table to card layout (same pattern as team roster: `hidden md:block` for table, `md:hidden` for cards).
- **Setlist drag-and-drop:** dnd-kit's PointerSensor supports touch natively. Use the same `activationConstraint: { distance: 5 }` as assignment-panel.tsx to prevent accidental drags on scroll. On mobile, the setlist rows should be slightly taller for easier touch targets.
- **Inline edit on mobile:** Same click-to-edit pattern works on touch. Input auto-focuses on tap.

## Open Questions

1. **JSONB links validation**
   - What we know: Links are stored as `jsonb` array of `{label, url}` objects. Zod validates the shape.
   - What's unclear: Should we add `pg_jsonschema` validation at the DB level, or rely on application-level Zod validation only?
   - Recommendation: Application-level only for v1. DB-level JSON schema validation is nice but adds migration complexity. The Zod schema provides sufficient protection since all writes go through server actions.

2. **Distinct tags query for filter chips**
   - What we know: We need to query the most common tags across all songs for the filter chip UI.
   - What's unclear: The Supabase JS client doesn't have a built-in `unnest` + `count` + `group by` for array columns. This may need an RPC function or raw SQL.
   - Recommendation: Create a simple Postgres function `get_popular_tags(limit_count int)` that uses `unnest(tags)` + group by + order by count desc. Call via `supabase.rpc('get_popular_tags', { limit_count: 10 })`.

3. **Duplicate songs in setlist**
   - What we know: A worship team might play the same song twice in a service (e.g., opening and closing).
   - What's unclear: Should `setlist_items` have a UNIQUE constraint on (service_id, song_id)?
   - Recommendation: Do NOT add a unique constraint. Allow duplicate songs. The sort_order differentiates them.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `app/(app)/services/[serviceId]/assignment-panel.tsx` -- dnd-kit sortable pattern
- Existing codebase: `app/(app)/team-roster/page.tsx` -- search + filter chips pattern
- Existing codebase: `lib/services/actions.ts` -- server action pattern with Zod + admin client
- Existing codebase: `components/ui/tabs.tsx` -- radix-ui Tabs component
- Existing codebase: `components/ui/combobox.tsx` -- @base-ui Combobox component
- Existing codebase: `components/ui/command.tsx` -- cmdk Command component
- [Supabase Arrays Docs](https://supabase.com/docs/guides/database/arrays) -- text[] column creation and querying
- [Supabase .contains() Docs](https://supabase.com/docs/reference/javascript/contains) -- array containment filter
- [Supabase .overlaps() Docs](https://supabase.com/docs/reference/javascript/overlaps) -- array overlap filter

### Secondary (MEDIUM confidence)
- [dnd-kit Sortable Docs](https://docs.dndkit.com/presets/sortable) -- SortableContext, verticalListSortingStrategy
- [Supabase Tags Discussion #8912](https://github.com/orgs/supabase/discussions/8912) -- text[] vs separate table for tags
- [PostgreSQL GIN Indexes](https://www.postgresql.org/docs/current/gin.html) -- GIN index on array columns
- [Crunchy Data: Tags and Postgres Arrays](https://www.crunchydata.com/blog/tags-aand-postgres-arrays-a-purrfect-combination) -- GIN index performance for tag queries

### Tertiary (LOW confidence)
- [shadcn.io Inline Edit Table Blocks](https://www.shadcn.io/blocks/tables-inline-edit) -- inline edit patterns (not directly used but validates approach)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in the codebase
- Architecture: HIGH -- all patterns are direct clones of existing codebase patterns (assignment panel, team roster, service actions)
- Database design: HIGH -- text[] with GIN for tags is well-documented PostgreSQL best practice; schema follows existing migration patterns
- Pitfalls: HIGH -- identified from real patterns in the codebase (empty string handling, sort order gaps, dnd-kit conflicts)
- Inline editing: MEDIUM -- click-to-edit pattern is standard but exact UX details need validation during implementation

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days -- stable domain, no fast-moving dependencies)
