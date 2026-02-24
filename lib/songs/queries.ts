import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { PopularTag, SetlistItemWithSong, SongSummary } from "./types";

// ---------------------------------------------------------------------------
// Song queries
// ---------------------------------------------------------------------------

/**
 * Get songs with optional search and filters.
 * - search: ilike on title OR artist
 * - key: exact match on default_key
 * - tag: array overlap on tags
 */
export async function getSongs(filters?: {
  search?: string;
  key?: string;
  tag?: string;
}): Promise<SongSummary[]> {
  const supabase = await createClient();

  let query = supabase.from("songs").select("*");

  if (filters?.search) {
    const pattern = `%${filters.search}%`;
    query = query.or(`title.ilike.${pattern},artist.ilike.${pattern}`);
  }

  if (filters?.key) {
    query = query.eq("default_key", filters.key);
  }

  if (filters?.tag) {
    query = query.overlaps("tags", [filters.tag]);
  }

  query = query.order("title", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SongSummary[];
}

/**
 * Get a single song by ID. Returns null if not found.
 */
export async function getSongById(songId: string): Promise<SongSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", songId)
    .maybeSingle();

  if (error) throw error;
  return data as SongSummary | null;
}

// ---------------------------------------------------------------------------
// Setlist queries
// ---------------------------------------------------------------------------

/**
 * Get the setlist for a service with joined song data, ordered by sort_order.
 */
export async function getSetlistForService(
  serviceId: string,
): Promise<SetlistItemWithSong[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("setlist_items")
    .select(
      "*, songs(id, title, artist, default_key, default_tempo, tags, duration_seconds)",
    )
    .eq("service_id", serviceId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as SetlistItemWithSong[];
}

/**
 * Get song counts per service for a list of service IDs.
 * Returns a Record mapping service_id -> count.
 */
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
  for (const row of data ?? []) {
    counts[row.service_id] = (counts[row.service_id] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Tag & key helpers
// ---------------------------------------------------------------------------

/**
 * Get popular tags via the database RPC function.
 */
export async function getPopularTags(limit?: number): Promise<PopularTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_popular_tags", {
    limit_count: limit ?? 10,
  });

  if (error) throw error;
  return (data ?? []) as PopularTag[];
}

/**
 * Get all distinct non-null default_key values from songs.
 */
export async function getDistinctKeys(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("songs")
    .select("default_key")
    .not("default_key", "is", null);

  if (error) throw error;

  // Deduplicate in application code
  const keys = new Set<string>();
  for (const row of data ?? []) {
    if (row.default_key) keys.add(row.default_key);
  }
  return Array.from(keys).sort();
}
