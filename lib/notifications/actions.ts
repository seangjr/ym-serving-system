"use server";

import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { markAsReadSchema, markAllReadSchema } from "./schemas";

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
