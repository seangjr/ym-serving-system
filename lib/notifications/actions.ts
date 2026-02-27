"use server";

import { revalidatePath } from "next/cache";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "./send";
import {
  markAsReadSchema,
  markAllReadSchema,
  respondToAssignmentSchema,
  requestSwapSchema,
  resolveSwapSchema,
  cancelSwapSchema,
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

  // Auto-cancel any pending swap requests for this assignment
  await admin
    .from("swap_requests")
    .update({
      status: "cancelled",
      resolved_at: new Date().toISOString(),
    })
    .eq("assignment_id", parsed.data.assignmentId)
    .eq("status", "pending");

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

// ---------------------------------------------------------------------------
// requestSwap — member requests a pre-arranged swap
// ---------------------------------------------------------------------------

export async function requestSwap(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { memberId: callerId } = await getUserRole(supabase);

  if (!callerId) return { error: "Not authenticated." };

  const parsed = requestSwapSchema.safeParse(data);
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
        team_positions(name),
        serving_teams(name)
      )
    `,
    )
    .eq("id", parsed.data.assignmentId)
    .single();

  if (!assignment || assignment.member_id !== callerId) {
    return { error: "Assignment not found or not yours." };
  }

  // Verify no existing pending swap for this assignment
  const { data: existingSwap } = await admin
    .from("swap_requests")
    .select("id")
    .eq("assignment_id", parsed.data.assignmentId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingSwap) {
    return { error: "A swap request is already pending for this assignment." };
  }

  const sp = assignment.service_positions as unknown as {
    id: string;
    team_id: string;
    services: { id: string; title: string; service_date: string };
    team_positions: { name: string } | null;
    serving_teams: { name: string };
  };

  // Verify target member is on the same team
  const { data: targetOnTeam } = await admin
    .from("team_members")
    .select("member_id")
    .eq("team_id", sp.team_id)
    .eq("member_id", parsed.data.targetMemberId)
    .maybeSingle();

  if (!targetOnTeam) {
    return { error: "Target member is not on the same team." };
  }

  // Insert swap request
  const { error: insertError } = await admin.from("swap_requests").insert({
    assignment_id: parsed.data.assignmentId,
    requester_member_id: callerId,
    target_member_id: parsed.data.targetMemberId,
    reason: parsed.data.reason || null,
    status: "pending",
  });

  if (insertError) return { error: insertError.message };

  // Get names for notifications
  const { data: callerMember } = await admin
    .from("members")
    .select("full_name")
    .eq("id", callerId)
    .single();

  const { data: targetMember } = await admin
    .from("members")
    .select("full_name")
    .eq("id", parsed.data.targetMemberId)
    .single();

  const requesterName = callerMember?.full_name ?? "A member";
  const targetName = targetMember?.full_name ?? "a team member";
  const positionName = sp.team_positions?.name ?? "a position";
  const serviceTitle = sp.services.title;
  const formattedDate = new Date(
    `${sp.services.service_date}T00:00:00`,
  ).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Notify target member
  try {
    await createNotification({
      recipientMemberId: parsed.data.targetMemberId,
      type: "swap_requested",
      title: "Swap Request",
      body: `${requesterName} wants to swap ${positionName} with you for ${serviceTitle} on ${formattedDate}`,
      metadata: {
        assignmentId: parsed.data.assignmentId,
        serviceId: sp.services.id,
      },
      actionUrl: "/my-schedule",
    });
  } catch {
    // Non-blocking
  }

  // Notify team lead(s)
  const { data: leads } = await admin
    .from("team_members")
    .select("member_id")
    .eq("team_id", sp.team_id)
    .eq("role", "lead");

  if (leads && leads.length > 0) {
    for (const lead of leads) {
      try {
        await createNotification({
          recipientMemberId: lead.member_id,
          type: "swap_requested",
          title: "Swap Request",
          body: `${requesterName} requests to swap ${positionName} with ${targetName} for ${serviceTitle}`,
          metadata: {
            assignmentId: parsed.data.assignmentId,
            serviceId: sp.services.id,
          },
          actionUrl: `/services/${sp.services.id}`,
        });
      } catch {
        // Notification failure should not block the swap request
      }
    }
  }

  revalidatePath("/my-schedule");
  revalidatePath(`/services/${sp.services.id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// resolveSwap — team lead approves or rejects a swap request
// ---------------------------------------------------------------------------

export async function resolveSwap(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  if (!callerId) return { error: "Not authenticated." };

  const parsed = resolveSwapSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const admin = createAdminClient();

  // Fetch swap request with assignment details
  const { data: swap } = await admin
    .from("swap_requests")
    .select(
      `
      id,
      assignment_id,
      requester_member_id,
      target_member_id,
      status,
      service_assignments!inner(
        id,
        service_positions!inner(
          team_id,
          services(id, title, service_date),
          team_positions(name)
        )
      )
    `,
    )
    .eq("id", parsed.data.swapRequestId)
    .single();

  if (!swap) return { error: "Swap request not found." };

  // Authorize: admin, committee, or team lead for this team
  const sa = swap.service_assignments as unknown as {
    id: string;
    service_positions: {
      team_id: string;
      services: { id: string; title: string; service_date: string };
      team_positions: { name: string } | null;
    };
  };

  const teamId = sa.service_positions.team_id;

  if (!isAdminOrCommittee(role)) {
    // Check if caller is team lead
    const { data: isLead } = await admin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("member_id", callerId)
      .single();

    if (isLead?.role !== "lead") {
      return { error: "Unauthorized. Admin, Committee, or team lead required." };
    }
  }

  // Verify swap is still pending
  if (swap.status !== "pending") {
    return { error: "This swap request has already been resolved." };
  }

  const positionName = sa.service_positions.team_positions?.name ?? "a position";
  const serviceTitle = sa.service_positions.services.title;
  const serviceId = sa.service_positions.services.id;

  if (parsed.data.action === "approved") {
    // Atomic update with race condition protection: only update if still pending
    const { data: updated, error: updateError } = await admin
      .from("swap_requests")
      .update({
        status: "approved",
        resolved_by: callerId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.swapRequestId)
      .eq("status", "pending")
      .select("id");

    if (updateError) return { error: updateError.message };
    if (!updated || updated.length === 0) {
      return { error: "Swap was already resolved by another user." };
    }

    // Reassign: update the assignment's member_id to the target member
    const { error: reassignError } = await admin
      .from("service_assignments")
      .update({ member_id: swap.target_member_id, status: "pending" })
      .eq("id", swap.assignment_id);

    if (reassignError) return { error: reassignError.message };

    // Notify requester: swap approved
    try {
      await createNotification({
        recipientMemberId: swap.requester_member_id,
        type: "swap_approved",
        title: "Swap Approved",
        body: `Your swap request for ${positionName} at ${serviceTitle} has been approved`,
        metadata: {
          swapRequestId: swap.id,
          serviceId,
        },
        actionUrl: "/my-schedule",
      });
    } catch {
      // Non-blocking
    }

    // Notify target member: new assignment via swap
    try {
      await createNotification({
        recipientMemberId: swap.target_member_id,
        type: "assignment_new",
        title: "New Assignment (Swap)",
        body: `You have been assigned as ${positionName} for ${serviceTitle} via swap`,
        metadata: {
          assignmentId: swap.assignment_id,
          serviceId,
        },
        actionUrl: "/my-schedule",
      });
    } catch {
      // Non-blocking
    }
  } else {
    // Rejected
    const { error: rejectError } = await admin
      .from("swap_requests")
      .update({
        status: "rejected",
        resolved_by: callerId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.swapRequestId);

    if (rejectError) return { error: rejectError.message };

    // Notify requester: swap rejected
    try {
      await createNotification({
        recipientMemberId: swap.requester_member_id,
        type: "swap_rejected",
        title: "Swap Rejected",
        body: `Your swap request for ${positionName} at ${serviceTitle} was rejected`,
        metadata: {
          swapRequestId: swap.id,
          serviceId,
        },
        actionUrl: "/my-schedule",
      });
    } catch {
      // Non-blocking
    }
  }

  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/my-schedule");
  return { success: true };
}

// ---------------------------------------------------------------------------
// cancelSwap — requester cancels their own pending swap request
// ---------------------------------------------------------------------------

export async function cancelSwap(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { memberId: callerId } = await getUserRole(supabase);

  if (!callerId) return { error: "Not authenticated." };

  const parsed = cancelSwapSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }

  const admin = createAdminClient();

  // Verify ownership and pending status
  const { data: swap } = await admin
    .from("swap_requests")
    .select("id, requester_member_id, status, assignment_id")
    .eq("id", parsed.data.swapRequestId)
    .single();

  if (!swap) return { error: "Swap request not found." };
  if (swap.requester_member_id !== callerId) {
    return { error: "You can only cancel your own swap requests." };
  }
  if (swap.status !== "pending") {
    return { error: "Only pending swap requests can be cancelled." };
  }

  const { error: cancelError } = await admin
    .from("swap_requests")
    .update({
      status: "cancelled",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.swapRequestId);

  if (cancelError) return { error: cancelError.message };

  revalidatePath("/my-schedule");
  return { success: true };
}

// ---------------------------------------------------------------------------
// fetchTeamMembersForSwap — server action wrapper for client components
// ---------------------------------------------------------------------------

export async function fetchTeamMembersForSwap(
  assignmentId: string,
): Promise<{ id: string; fullName: string }[]> {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);

  if (!memberId) return [];

  // Dynamic import to cross server-only boundary
  const { getTeamMembersForSwap } = await import("./queries");
  return getTeamMembersForSwap(assignmentId, memberId);
}
