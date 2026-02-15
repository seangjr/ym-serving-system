import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared validators
// ---------------------------------------------------------------------------

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.");

// ---------------------------------------------------------------------------
// Blackout date schemas
// ---------------------------------------------------------------------------

export const addBlackoutSchema = z.object({
  memberId: z.string().uuid("Invalid member ID.").optional(),
  startDate: dateString,
  endDate: dateString.optional(),
  reason: z
    .union([
      z.string().max(500, "Reason must be 500 characters or fewer."),
      z.literal(""),
    ])
    .optional(),
});

export const addBlackoutRangeSchema = z
  .object({
    memberId: z.string().uuid("Invalid member ID.").optional(),
    startDate: dateString,
    endDate: dateString,
    reason: z
      .union([
        z.string().max(500, "Reason must be 500 characters or fewer."),
        z.literal(""),
      ])
      .optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date.",
    path: ["endDate"],
  });

export const deleteBlackoutSchema = z.object({
  blackoutId: z.string().uuid("Invalid blackout ID."),
});

// ---------------------------------------------------------------------------
// Recurring pattern schemas
// ---------------------------------------------------------------------------

export const createRecurringPatternSchema = z
  .object({
    memberId: z.string().uuid("Invalid member ID.").optional(),
    frequency: z.enum(["weekly", "biweekly", "monthly", "nth_weekday"]),
    dayOfWeek: z.number().int().min(0).max(6),
    nthOccurrence: z.number().int().min(1).max(5).optional(),
    startDate: dateString,
    endDate: dateString.optional(),
    reason: z
      .union([
        z.string().max(500, "Reason must be 500 characters or fewer."),
        z.literal(""),
      ])
      .optional(),
  })
  .refine(
    (data) =>
      data.frequency !== "nth_weekday" || data.nthOccurrence !== undefined,
    {
      message:
        "nth occurrence is required when frequency is 'nth_weekday'.",
      path: ["nthOccurrence"],
    },
  );

export const deleteRecurringPatternSchema = z.object({
  patternId: z.string().uuid("Invalid pattern ID."),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type AddBlackoutInput = z.infer<typeof addBlackoutSchema>;
export type AddBlackoutRangeInput = z.infer<typeof addBlackoutRangeSchema>;
export type DeleteBlackoutInput = z.infer<typeof deleteBlackoutSchema>;
export type CreateRecurringPatternInput = z.infer<
  typeof createRecurringPatternSchema
>;
export type DeleteRecurringPatternInput = z.infer<
  typeof deleteRecurringPatternSchema
>;
