import { z } from "zod";

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const SLUG_REGEX = /^[a-z0-9-]+$/;

// ---------------------------------------------------------------------------
// Service type schema
// ---------------------------------------------------------------------------

export const serviceTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50)
    .regex(SLUG_REGEX, "Must be lowercase letters, numbers, and hyphens only"),
  label: z.string().min(1, "Label is required").max(100),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "Must be a hex colour (e.g. #6366f1)"),
});

export const updateServiceTypeSchema = serviceTypeSchema.partial().extend({
  id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Service schemas
// ---------------------------------------------------------------------------

// Helpers: accept both valid values and empty strings from HTML form inputs.
// Empty strings pass through validation and are cleaned to null server-side.
const optionalTime = z
  .union([z.string().regex(TIME_REGEX, "Must be HH:MM format"), z.literal("")])
  .optional();

const optionalDate = z
  .union([
    z.string().regex(DATE_REGEX, "Must be YYYY-MM-DD format"),
    z.literal(""),
  ])
  .optional();

const optionalText = (max: number) =>
  z.union([z.string().max(max), z.literal("")]).optional();

export const createServiceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  serviceDate: z.string().regex(DATE_REGEX, "Must be YYYY-MM-DD format"),
  startTime: z.string().regex(TIME_REGEX, "Must be HH:MM format"),
  endTime: optionalTime,
  durationMinutes: z.number().int().min(1).max(480).optional(),
  serviceTypeId: z.union([z.string().uuid(), z.literal("")]).optional(),
  rehearsalDate: optionalDate,
  rehearsalTime: optionalTime,
  rehearsalNotes: optionalText(1000),
  notes: optionalText(2000),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Recurring services schema
// ---------------------------------------------------------------------------

export const createRecurringSchema = z.object({
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  startDate: z.string().regex(DATE_REGEX, "Must be YYYY-MM-DD format"),
  endDate: z.string().regex(DATE_REGEX, "Must be YYYY-MM-DD format"),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(TIME_REGEX, "Must be HH:MM format"),
  endTime: optionalTime,
  durationMinutes: z.number().int().min(1).max(480).optional(),
  serviceTypeId: z.union([z.string().uuid(), z.literal("")]).optional(),
  titleTemplate: z.string().min(1, "Title template is required").max(200),
});

// ---------------------------------------------------------------------------
// Duplicate service schema
// ---------------------------------------------------------------------------

export const duplicateServiceSchema = z.object({
  sourceServiceId: z.string().uuid(),
  targetDate: z.string().regex(DATE_REGEX, "Must be YYYY-MM-DD format"),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>;
export type UpdateServiceTypeInput = z.infer<typeof updateServiceTypeSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type DuplicateServiceInput = z.infer<typeof duplicateServiceSchema>;
