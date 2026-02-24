-- Migration: 00011_songs
-- Description: Songs table and setlist_items table for song library and setlist management
-- Dependencies: public.members (00003), public.services (00005), update_updated_at_column() (00003)

-- ============================================================================
-- 1. Songs table
-- ============================================================================

create table public.songs (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  artist        text,
  default_key   text,
  default_tempo int,
  tags          text[]      not null default '{}',
  duration_seconds int,
  links         jsonb       not null default '[]'::jsonb,
  notes         text,
  created_by    uuid        references public.members(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.songs is 'Song library entries with metadata (key, tempo, tags, links)';
comment on column public.songs.default_key is 'Free-text key notation, e.g. C, Bb, F#m';
comment on column public.songs.default_tempo is 'BPM';
comment on column public.songs.tags is 'Free-text tags array for categorization (e.g. worship, fast, mandarin)';
comment on column public.songs.links is 'JSON array of {label, url} objects (e.g. YouTube, chord chart)';

-- ============================================================================
-- 2. Setlist items table
-- ============================================================================

create table public.setlist_items (
  id             uuid        primary key default gen_random_uuid(),
  service_id     uuid        not null references public.services(id) on delete cascade,
  song_id        uuid        not null references public.songs(id) on delete cascade,
  sort_order     int         not null default 0,
  key_override   text,
  tempo_override int,
  notes          text,
  added_by       uuid        references public.members(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.setlist_items is 'Songs assigned to a service setlist with per-service overrides';
comment on column public.setlist_items.key_override is 'Override key for this service (null = use song default)';
comment on column public.setlist_items.tempo_override is 'Override BPM for this service (null = use song default)';
comment on column public.setlist_items.notes is 'Per-service notes like "skip bridge", "acoustic version"';

-- NOTE: No UNIQUE constraint on (service_id, song_id) -- allow same song twice in a setlist

-- ============================================================================
-- 3. Indexes
-- ============================================================================

create index idx_songs_title on public.songs(title);
create index idx_songs_artist on public.songs(artist);
create index idx_songs_tags on public.songs using gin(tags);
create index idx_setlist_items_service on public.setlist_items(service_id, sort_order);
create index idx_setlist_items_song on public.setlist_items(song_id);

-- ============================================================================
-- 4. RLS policies
-- ============================================================================

alter table public.songs enable row level security;
alter table public.setlist_items enable row level security;

-- Authenticated users can view all songs
create policy "Authenticated users can view songs"
  on public.songs for select
  to authenticated
  using (true);

-- Authenticated users can view all setlist items
create policy "Authenticated users can view setlist items"
  on public.setlist_items for select
  to authenticated
  using (true);

-- Write operations go through admin client (bypass RLS), so no INSERT/UPDATE/DELETE policies needed

-- ============================================================================
-- 5. Triggers (reuse existing update_updated_at_column from migration 00003)
-- ============================================================================

create trigger set_updated_at_songs
  before update on public.songs
  for each row
  execute function public.update_updated_at_column();

create trigger set_updated_at_setlist_items
  before update on public.setlist_items
  for each row
  execute function public.update_updated_at_column();

-- ============================================================================
-- 6. RPC function: get popular tags
-- ============================================================================

create or replace function public.get_popular_tags(limit_count int default 10)
returns table(tag text, usage_count bigint)
language sql
stable
as $$
  select
    unnest(tags) as tag,
    count(*) as usage_count
  from public.songs
  group by tag
  order by usage_count desc
  limit limit_count;
$$;

comment on function public.get_popular_tags is 'Returns the most frequently used song tags with their usage counts';
