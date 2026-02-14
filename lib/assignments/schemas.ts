import { z } from "zod";

// ---------------------------------------------------------------------------
// Assignment schemas
// ---------------------------------------------------------------------------

export const assignMemberSchema = z.object({
  servicePositionId: z.string().uuid("Invalid position slot ID."),
  memberId: z.string().uuid("Invalid member ID."),
  serviceId: z.string().uuid("Invalid service ID."),
  notes: z
    .union([
      z.string().max(500, "Notes must be 500 characters or fewer"),
      z.literal(""),
    ])
    .optional(),
  forceAssign: z.boolean().optional(),
});

export const unassignMemberSchema = z.object({
  servicePositionId: z.string().uuid("Invalid position slot ID."),
  serviceId: z.string().uuid("Invalid service ID."),
});

export const updateAssignmentNoteSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID."),
  serviceId: z.string().uuid("Invalid service ID."),
  notes: z.string().max(500, "Notes must be 500 characters or fewer"),
});

// ---------------------------------------------------------------------------
// Position management schemas
// ---------------------------------------------------------------------------

export const addServicePositionSchema = z.object({
  serviceId: z.string().uuid("Invalid service ID."),
  teamId: z.string().uuid("Invalid team ID."),
  positionId: z.string().uuid("Invalid position ID."),
});

export const removeServicePositionSchema = z.object({
  servicePositionId: z.string().uuid("Invalid position slot ID."),
  serviceId: z.string().uuid("Invalid service ID."),
});

// ---------------------------------------------------------------------------
// Template schemas
// ---------------------------------------------------------------------------

export const saveTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required.")
    .max(100, "Template name must be 100 characters or fewer."),
  description: z
    .union([
      z.string().max(500, "Description must be 500 characters or fewer"),
      z.literal(""),
    ])
    .optional(),
  teamId: z.string().uuid("Invalid team ID."),
  serviceId: z.string().uuid("Invalid service ID."),
});

export const loadTemplateSchema = z.object({
  templateId: z.string().uuid("Invalid template ID."),
  serviceId: z.string().uuid("Invalid service ID."),
});

export const deleteTemplateSchema = z.object({
  templateId: z.string().uuid("Invalid template ID."),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type AssignMemberInput = z.infer<typeof assignMemberSchema>;
export type UnassignMemberInput = z.infer<typeof unassignMemberSchema>;
export type UpdateAssignmentNoteInput = z.infer<
  typeof updateAssignmentNoteSchema
>;
export type AddServicePositionInput = z.infer<typeof addServicePositionSchema>;
export type RemoveServicePositionInput = z.infer<
  typeof removeServicePositionSchema
>;
export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;
export type LoadTemplateInput = z.infer<typeof loadTemplateSchema>;
export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;
