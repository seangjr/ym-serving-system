import { z } from "zod";

// ---------------------------------------------------------------------------
// Notification action schemas
// ---------------------------------------------------------------------------

export const markAsReadSchema = z.object({
  notificationId: z.string().uuid("Invalid notification ID."),
});

export const markAllReadSchema = z.object({});

// ---------------------------------------------------------------------------
// Assignment response schemas
// ---------------------------------------------------------------------------

export const respondToAssignmentSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID."),
  status: z.enum(["confirmed", "declined"]),
});

// ---------------------------------------------------------------------------
// Swap request schemas
// ---------------------------------------------------------------------------

export const requestSwapSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID."),
  targetMemberId: z.string().uuid("Invalid target member ID."),
  reason: z
    .union([
      z.string().max(500, "Reason must be 500 characters or fewer."),
      z.literal(""),
    ])
    .optional(),
});

export const resolveSwapSchema = z.object({
  swapRequestId: z.string().uuid("Invalid swap request ID."),
  action: z.enum(["approved", "rejected"]),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type MarkAllReadInput = z.infer<typeof markAllReadSchema>;
export type RespondToAssignmentInput = z.infer<
  typeof respondToAssignmentSchema
>;
export type RequestSwapInput = z.infer<typeof requestSwapSchema>;
export type ResolveSwapInput = z.infer<typeof resolveSwapSchema>;
