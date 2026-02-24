// ---------------------------------------------------------------------------
// Song & setlist types
// ---------------------------------------------------------------------------

export interface SongLink {
  label: string;
  url: string;
}

export interface SongSummary {
  id: string;
  title: string;
  artist: string | null;
  default_key: string | null;
  default_tempo: number | null;
  tags: string[];
  duration_seconds: number | null;
  links: SongLink[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetlistItemWithSong {
  id: string;
  service_id: string;
  song_id: string;
  sort_order: number;
  key_override: string | null;
  tempo_override: number | null;
  notes: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
  songs: {
    id: string;
    title: string;
    artist: string | null;
    default_key: string | null;
    default_tempo: number | null;
    tags: string[];
    duration_seconds: number | null;
  };
}

export interface PopularTag {
  tag: string;
  usage_count: number;
}
