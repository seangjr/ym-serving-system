"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  addToSetlistSchema,
  createSongSchema,
  removeFromSetlistSchema,
  reorderSetlistSchema,
  updateSetlistItemOverridesSchema,
  updateSongSchema,
} from "./schemas";

// ---------------------------------------------------------------------------
// Song CRUD
// ---------------------------------------------------------------------------

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
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid song data.",
    };
  }

  // Clean tags: filter empty strings, trim, lowercase
  const cleanedTags = (parsed.data.tags ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  const admin = createAdminClient();
  const { data: song, error } = await admin
    .from("songs")
    .insert({
      title: parsed.data.title,
      artist: parsed.data.artist || null,
      default_key: parsed.data.defaultKey || null,
      default_tempo: parsed.data.defaultTempo ?? null,
      tags: cleanedTags,
      duration_seconds: parsed.data.durationSeconds ?? null,
      links: parsed.data.links ?? [],
      notes: parsed.data.notes || null,
      created_by: memberId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/songs");
  return { success: true, songId: song.id };
}

export async function updateSong(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = updateSongSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid song data.",
    };
  }

  const { id, ...fields } = parsed.data;

  // Map camelCase to snake_case for the DB columns
  const updates: Record<string, unknown> = {};
  if (fields.title !== undefined) updates.title = fields.title;
  if (fields.artist !== undefined) updates.artist = fields.artist || null;
  if (fields.defaultKey !== undefined)
    updates.default_key = fields.defaultKey || null;
  if (fields.defaultTempo !== undefined)
    updates.default_tempo = fields.defaultTempo ?? null;
  if (fields.tags !== undefined) {
    updates.tags = fields.tags
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
  }
  if (fields.durationSeconds !== undefined)
    updates.duration_seconds = fields.durationSeconds ?? null;
  if (fields.links !== undefined) updates.links = fields.links ?? [];
  if (fields.notes !== undefined) updates.notes = fields.notes || null;

  const admin = createAdminClient();
  const { error } = await admin.from("songs").update(updates).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/songs");
  return { success: true };
}

export async function deleteSong(
  songId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  // Validate UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(songId)) {
    return { error: "Invalid song ID." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("songs").delete().eq("id", songId);

  if (error) return { error: error.message };

  revalidatePath("/songs");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Setlist operations
// ---------------------------------------------------------------------------

export async function addToSetlist(
  data: unknown,
): Promise<{ success: true; itemId: string } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = addToSetlistSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid setlist data.",
    };
  }

  const admin = createAdminClient();

  // Get current max sort_order for the service
  const { data: existing, error: fetchError } = await admin
    .from("setlist_items")
    .select("sort_order")
    .eq("service_id", parsed.data.serviceId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (fetchError) return { error: fetchError.message };

  const nextOrder =
    existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data: item, error } = await admin
    .from("setlist_items")
    .insert({
      service_id: parsed.data.serviceId,
      song_id: parsed.data.songId,
      sort_order: nextOrder,
      added_by: memberId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true, itemId: item.id };
}

export async function removeFromSetlist(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = removeFromSetlistSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const admin = createAdminClient();

  // Fetch the item to get its service_id for re-numbering
  const { data: item, error: fetchError } = await admin
    .from("setlist_items")
    .select("id, service_id")
    .eq("id", parsed.data.itemId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!item) return { error: "Setlist item not found." };

  const serviceId = item.service_id;

  // Delete the item
  const { error: deleteError } = await admin
    .from("setlist_items")
    .delete()
    .eq("id", parsed.data.itemId);

  if (deleteError) return { error: deleteError.message };

  // Re-number remaining items for the same service
  const { data: remaining, error: remainError } = await admin
    .from("setlist_items")
    .select("id")
    .eq("service_id", serviceId)
    .order("sort_order", { ascending: true });

  if (remainError) return { error: remainError.message };

  const items = remaining ?? [];
  for (let i = 0; i < items.length; i++) {
    const { error: updateError } = await admin
      .from("setlist_items")
      .update({ sort_order: i })
      .eq("id", items[i].id);

    if (updateError) return { error: updateError.message };
  }

  revalidatePath(`/services/${serviceId}`);
  return { success: true };
}

export async function reorderSetlist(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = reorderSetlistSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid reorder data.",
    };
  }

  const admin = createAdminClient();

  // Update each item's sort_order based on its index in the array
  for (let i = 0; i < parsed.data.itemIds.length; i++) {
    const { error } = await admin
      .from("setlist_items")
      .update({ sort_order: i })
      .eq("id", parsed.data.itemIds[i]);

    if (error) return { error: error.message };
  }

  revalidatePath(`/services/${parsed.data.serviceId}`);
  return { success: true };
}

export async function updateSetlistItemOverrides(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = updateSetlistItemOverridesSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid override data.",
    };
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.keyOverride !== undefined) {
    updates.key_override = parsed.data.keyOverride || null;
  }
  if (parsed.data.tempoOverride !== undefined) {
    updates.tempo_override = parsed.data.tempoOverride ?? null;
  }
  if (parsed.data.notes !== undefined) {
    updates.notes = parsed.data.notes || null;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("setlist_items")
    .update(updates)
    .eq("id", parsed.data.itemId);

  if (error) return { error: error.message };

  // Fetch the item to get its service_id for cache invalidation
  const { data: item } = await admin
    .from("setlist_items")
    .select("service_id")
    .eq("id", parsed.data.itemId)
    .maybeSingle();

  if (item) {
    revalidatePath(`/services/${item.service_id}`);
  }

  return { success: true };
}
