import { z } from "zod";

// ---------------------------------------------------------------------------
// Team schemas
// ---------------------------------------------------------------------------

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
    .optional(),
});

export const updateTeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Team name is required").max(100).optional(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
    .optional(),
});

// ---------------------------------------------------------------------------
// Position schemas
// ---------------------------------------------------------------------------

export const createPositionSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1, "Position name is required").max(100),
  category: z.string().max(50).optional(),
  quantityNeeded: z.number().int().min(1).max(20).default(1),
});

export const updatePositionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Position name is required").max(100).optional(),
  category: z.string().max(50).optional(),
  quantityNeeded: z.number().int().min(1).max(20).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Proficiency and preference constants
// ---------------------------------------------------------------------------

export const proficiencyLevels = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export const preferenceLevels = ["primary", "secondary", "willing"] as const;

export type Proficiency = (typeof proficiencyLevels)[number];
export type Preference = (typeof preferenceLevels)[number];

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
