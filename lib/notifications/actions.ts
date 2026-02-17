"use server";

import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "./send";
import {
  markAsReadSchema,
  markAllReadSchema,
  respondToAssignmentSchema,
} from "./schemas";

// ---------------------------------------------------------------------------
// markAsRead — mark a single notification as read
// ---------------------------------------------------------------------------

export async function markAsRead(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return { error: "Not authenticated." };

  const parsed = markAsReadSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  // Verify ownership before updating
  const admin = createAdminClient();
  const { data: notification } = await admin
    .from("notifications")
    .select("recipient_member_id")
    .eq("id", parsed.data.notificationId)
    .single();

  if (!notification) return { error: "Notification not found." };
  if (notification.recipient_member_id !== memberId) {
    return { error: "Unauthorized. Cannot mark another user's notification." };
  }

  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", parsed.data.notificationId);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

// ---------------------------------------------------------------------------
// markAllRead — mark all unread notifications as read for the caller
// ---------------------------------------------------------------------------

export async function markAllRead(
  data?: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return { error: "Not authenticated." };

  // Validate (even though no fields, ensures schema consistency)
  const parsed = markAllReadSchema.safeParse(data ?? {});
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_member_id", memberId)
    .eq("is_read", false);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

// ---------------------------------------------------------------------------
// respondToAssignment — confirm or decline an assignment
// ---------------------------------------------------------------------------

export async function respondToAssignment(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { memberId: callerId } = await getUserRole(supabase);

  if (!callerId) return { error: "Not authenticated." };

  const parsed = respondToAssignmentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const admin = createAdminClient();

  // Verify ownership: caller must own this assignment
  const { data: assignment } = await admin
    .from("service_assignments")
    .select(
      `
      id,
      member_id,
      service_positions(
        id,
        team_id,
        services(id, title, service_date),
        team_positions(name)
      )
    `,
    )
    .eq("id", parsed.data.assignmentId)
    .single();

  if (!assignment || assignment.member_id !== callerId) {
    return { error: "Assignment not found or not yours." };
  }

  // Update status
  const { error } = await admin
    .from("service_assignments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.assignmentId);

  if (error) return { error: error.message };

  // On decline, notify the team lead
  if (parsed.data.status === "declined") {
    const sp = assignment.service_positions as unknown as {
      id: string;
      team_id: string;
      services: {
        id: string;
        title: string;
        service_date: string;
      };
      team_positions: { name: string } | null;
    };

    // Find team lead
    const { data: leadRow } = await admin
      .from("team_members")
      .select("member_id")
      .eq("team_id", sp.team_id)
      .eq("role", "lead")
      .limit(1)
      .maybeSingle();

    if (leadRow) {
      // Get member name for notification body
      const { data: callerMember } = await admin
        .from("members")
        .select("full_name")
        .eq("id", callerId)
        .single();

      const memberName = callerMember?.full_name ?? "A member";
      const positionName = sp.team_positions?.name ?? "a position";
      const serviceTitle = sp.services.title;
      const formattedDate = new Date(
        `${sp.services.service_date}T00:00:00`,
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      await createNotification({
        recipientMemberId: leadRow.member_id,
        type: "assignment_declined",
        title: "Assignment Declined",
        body: `${memberName} declined ${positionName} for ${serviceTitle} on ${formattedDate}`,
        metadata: {
          assignmentId: parsed.data.assignmentId,
          serviceId: sp.services.id,
          memberId: callerId,
        },
        actionUrl: `/services/${sp.services.id}`,
      });
    }
  }

  revalidatePath("/my-schedule");
  return { success: true };
}
