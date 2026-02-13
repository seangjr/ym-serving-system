import { z } from "zod";

// ---------------------------------------------------------------------------
// Profile update schema
// ---------------------------------------------------------------------------

export const updateProfileSchema = z.object({
  phone: z.string().max(20).optional().or(z.literal("")),
  emergency_contact_name: z.string().max(100).optional().or(z.literal("")),
  emergency_contact_phone: z.string().max(20).optional().or(z.literal("")),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Notification preferences schema
// ---------------------------------------------------------------------------

export const notificationPreferencesSchema = z.object({
  notify_email: z.boolean(),
  notify_assignment_changes: z.boolean(),
  reminder_days_before: z.number().int().min(0).max(14),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
