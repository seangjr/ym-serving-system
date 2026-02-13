"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  notificationPreferencesSchema,
  updateProfileSchema,
} from "./schemas";

// ---------------------------------------------------------------------------
// updateOwnProfile — any authenticated user can update their own profile
// ---------------------------------------------------------------------------

export async function updateOwnProfile(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return { error: "Member not found" };

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "Invalid profile data.",
    };
  }

  // Clean empty strings to null for DB storage
  const profileData: Record<string, unknown> = {
    member_id: memberId,
    updated_at: new Date().toISOString(),
  };
  for (const [key, value] of Object.entries(parsed.data)) {
    profileData[key] = value === "" ? null : value;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("member_profiles")
    .upsert(profileData, { onConflict: "member_id" });

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}

// ---------------------------------------------------------------------------
// updateNotificationPreferences — any authenticated user
// ---------------------------------------------------------------------------

export async function updateNotificationPreferences(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return { error: "Member not found" };

  const parsed = notificationPreferencesSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error:
        parsed.error.errors[0]?.message ?? "Invalid notification preferences.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("member_profiles").upsert(
    {
      member_id: memberId,
      notify_email: parsed.data.notify_email,
      notify_assignment_changes: parsed.data.notify_assignment_changes,
      reminder_days_before: parsed.data.reminder_days_before,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "member_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}

// ---------------------------------------------------------------------------
// updateAvatarUrl — any authenticated user (file upload is client-side)
// ---------------------------------------------------------------------------

export async function updateAvatarUrl(
  avatarUrl: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return { error: "Member not found" };

  const admin = createAdminClient();
  const { error } = await admin.from("member_profiles").upsert(
    {
      member_id: memberId,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "member_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}

// ---------------------------------------------------------------------------
// adminUpdateMemberProfile — admin/committee can update any member's profile
// ---------------------------------------------------------------------------

export async function adminUpdateMemberProfile(
  memberId: string,
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);

  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "Invalid profile data.",
    };
  }

  // Clean empty strings to null for DB storage
  const profileData: Record<string, unknown> = {
    member_id: memberId,
    updated_at: new Date().toISOString(),
  };
  for (const [key, value] of Object.entries(parsed.data)) {
    profileData[key] = value === "" ? null : value;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("member_profiles")
    .upsert(profileData, { onConflict: "member_id" });

  if (error) return { error: error.message };

  revalidatePath(`/members/${memberId}`);
  return { success: true };
}
