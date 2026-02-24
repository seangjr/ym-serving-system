import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Accept a valid string or empty string (cleaned to null server-side) */
const optionalText = (max: number) =>
  z.union([z.string().max(max), z.literal("")]).optional();

// ---------------------------------------------------------------------------
// Song link schema
// ---------------------------------------------------------------------------

export const songLinkSchema = z.object({
  label: z.string().min(1, "Label is required").max(50),
  url: z.string().url("Must be a valid URL"),
});

// ---------------------------------------------------------------------------
// Song CRUD schemas
// ---------------------------------------------------------------------------

export const createSongSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  artist: z.union([z.string().max(200), z.literal("")]).optional(),
  defaultKey: z.union([z.string().max(10), z.literal("")]).optional(),
  defaultTempo: z.number().int().min(20).max(300).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  durationSeconds: z.number().int().min(1).max(3600).optional(),
  links: z.array(songLinkSchema).max(10).optional(),
  notes: optionalText(2000),
});

export const updateSongSchema = createSongSchema.partial().extend({
  id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Setlist operation schemas
// ---------------------------------------------------------------------------

export const addToSetlistSchema = z.object({
  serviceId: z.string().uuid(),
  songId: z.string().uuid(),
});

export const removeFromSetlistSchema = z.object({
  itemId: z.string().uuid(),
});

export const reorderSetlistSchema = z.object({
  serviceId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(1),
});

export const updateSetlistItemOverridesSchema = z.object({
  itemId: z.string().uuid(),
  keyOverride: z.union([z.string().max(10), z.literal("")]).optional(),
  tempoOverride: z
    .union([z.number().int().min(20).max(300), z.null()])
    .optional(),
  notes: optionalText(2000),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateSongInput = z.infer<typeof createSongSchema>;
export type UpdateSongInput = z.infer<typeof updateSongSchema>;
export type AddToSetlistInput = z.infer<typeof addToSetlistSchema>;
export type RemoveFromSetlistInput = z.infer<typeof removeFromSetlistSchema>;
export type ReorderSetlistInput = z.infer<typeof reorderSetlistSchema>;
export type UpdateSetlistItemOverridesInput = z.infer<
  typeof updateSetlistItemOverridesSchema
>;
