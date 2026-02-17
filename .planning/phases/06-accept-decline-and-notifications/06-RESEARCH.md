# Phase 6: Accept/Decline & Notifications - Research

**Researched:** 2026-02-17
**Domain:** In-app notification system, assignment response workflow, swap requests, Supabase Realtime
**Confidence:** HIGH

## Summary

Phase 6 adds two interleaved capabilities: (1) assignment response workflows (accept/decline/swap) and (2) an in-app notification system with provider-extensible architecture. The existing `service_assignments` table already tracks `status` as `pending | confirmed | declined`, so the accept/decline workflow is primarily a UI + server action addition on the member's schedule view. The notification system requires a new `notifications` table, Supabase Realtime subscriptions for live updates, and a `notification_providers` abstraction layer for future Telegram/WhatsApp integration. The reminder system uses `pg_cron` + `pg_net` to invoke a Supabase Edge Function (or Next.js API route) on a daily schedule.

The swap workflow is the most complex feature: it requires a new `swap_requests` table with a state machine (`pending -> accepted | rejected | cancelled`), notifications to eligible members, and team lead approval. This should be built after the core notification infrastructure is in place.

**Primary recommendation:** Build the notification table + provider-extensible architecture first (Plan 06-01), then accept/decline UI (06-02), then the notification UI (06-04), then swaps (06-03), then reminders (06-05). Notification infrastructure must land before any feature that emits notifications.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.95.3 | Realtime subscriptions for live notification updates | Already installed; native Postgres CDC support |
| Supabase Realtime | (server-side) | Postgres Change Data Capture for `notifications` table | Zero additional dependencies; built into Supabase |
| pg_cron | (Supabase extension) | Daily scheduled job for sending reminders | Standard Supabase approach for scheduled tasks |
| pg_net | (Supabase extension) | HTTP requests from within pg_cron jobs | Pairs with pg_cron for calling Edge Functions |
| Resend | ^6.9.2 | Email notification delivery (future provider) | Already installed and configured in `lib/otp/email.ts` |
| sonner | ^2.0.7 | Toast notifications for immediate feedback | Already used throughout the app |
| lucide-react | ^0.563.0 | Bell icon for notification indicator | Already installed |
| date-fns | ^4.1.0 | Date calculations for reminders (days before service) | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-day-picker | ^9.13.1 | Calendar views (already in use) | If calendar integration is needed for swap scheduling |
| zod | ^4.3.6 | Schema validation for new server actions | Already the standard for all form/action validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Realtime for live notifications | Polling with setInterval | Realtime is more efficient, already in the stack, no extra latency |
| pg_cron for reminders | Next.js cron (vercel.json) | pg_cron is platform-agnostic and works locally; Vercel cron requires deployment |
| Custom notification table | Supabase Edge Functions with Queues | Queues adds complexity; a simple table + Realtime is sufficient for this scale |
| Provider pattern (interface-based) | Direct if/else per channel | Provider pattern is cleanly extensible; the interface cost is minimal |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
# Extensions to enable in Supabase:
# - pg_cron (for scheduled reminders)
# - pg_net (for HTTP calls from pg_cron)
# Supabase Realtime is already available (just needs table publication)
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
  notifications/
    types.ts          # NotificationType enum, Notification interface, SwapRequest types
    schemas.ts        # Zod schemas for respond-to-assignment, swap-request, mark-read
    queries.ts        # getNotifications, getUnreadCount, getSwapRequests
    actions.ts        # respondToAssignment, requestSwap, approveSwap, markRead, markAllRead
    providers.ts      # NotificationProvider interface + InAppProvider implementation
    send.ts           # createNotification() -- central function that writes to DB + calls providers
  assignments/
    actions.ts        # MODIFIED: assignMember() now calls createNotification() after insert
    schemas.ts        # MODIFIED: add respondToAssignment schema, swapRequest schema
    types.ts          # MODIFIED: add swap-related types
components/
  notifications/
    notification-bell.tsx      # Bell icon with unread badge in app header/sidebar
    notification-list.tsx      # Dropdown/page listing notifications with read/unread state
    notification-item.tsx      # Single notification row component
    notification-provider.tsx  # React context for Realtime subscription + notification state
  assignments/
    assignment-response.tsx    # Confirm/Decline buttons for member's schedule view
    swap-request-dialog.tsx    # Dialog for requesting a swap
    swap-approval-list.tsx     # Team lead view of pending swap requests
app/(app)/
  my-schedule/
    page.tsx          # MODIFIED: show assignments with confirm/decline + swap buttons
  notifications/
    page.tsx          # Full notification list page (optional, bell dropdown may suffice)
supabase/migrations/
  00009_notifications.sql     # notifications table, swap_requests table, Realtime publication, pg_cron
```

### Pattern 1: Notification Table with Provider-Extensible Architecture
**What:** A `notifications` table stores all notifications with type, recipient, payload, and read status. A `NotificationProvider` interface defines `send(notification)` with implementations for each channel (in-app is first, email/Telegram/WhatsApp later).
**When to use:** When the system needs multiple delivery channels that can be added without changing core logic.
**Example:**
```typescript
// lib/notifications/providers.ts

export interface NotificationPayload {
  recipientMemberId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>; // service ID, assignment ID, etc.
  actionUrl?: string; // deep link for the notification
}

export interface NotificationProvider {
  name: string;
  send(payload: NotificationPayload): Promise<void>;
}

// In-app provider: writes to notifications table
export class InAppProvider implements NotificationProvider {
  name = "in_app";
  async send(payload: NotificationPayload): Promise<void> {
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      recipient_member_id: payload.recipientMemberId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata ?? {},
      action_url: payload.actionUrl ?? null,
    });
  }
}

// Future: TelegramProvider, WhatsAppProvider, EmailProvider
```

### Pattern 2: Supabase Realtime for Live Notification Updates
**What:** Client subscribes to INSERT events on the `notifications` table filtered by the user's member_id. New notifications appear instantly without polling.
**When to use:** For live notification bell badge updates and toast popups.
**Example:**
```typescript
// components/notifications/notification-provider.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function useNotificationSubscription(memberId: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${memberId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_member_id=eq.${memberId}`,
        },
        (payload) => {
          setUnreadCount((prev) => prev + 1);
          // Optionally show a toast for the new notification
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId, supabase]);

  return { unreadCount, setUnreadCount };
}
```

### Pattern 3: Assignment Response with Optimistic UI
**What:** Member taps Confirm or Decline; the UI updates immediately (optimistic) while the server action runs. On decline, a notification is automatically sent to the team lead.
**When to use:** For the 1-2 tap mobile experience requirement (RESP-05).
**Example:**
```typescript
// Server action: respondToAssignment
export async function respondToAssignment(data: unknown) {
  const parsed = respondSchema.safeParse(data);
  // ... validation ...

  const admin = createAdminClient();
  const { error } = await admin
    .from("service_assignments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.assignmentId)
    .eq("member_id", callerId); // RLS: only own assignments

  if (parsed.data.status === "declined") {
    // Notify team lead
    const teamLeadId = await getTeamLeadForAssignment(parsed.data.assignmentId);
    await createNotification({
      recipientMemberId: teamLeadId,
      type: "assignment_declined",
      title: "Assignment Declined",
      body: `${memberName} declined their ${positionName} assignment for ${serviceName}`,
      metadata: { assignmentId, serviceId },
      actionUrl: `/services/${serviceId}`,
    });
  }

  revalidatePath("/my-schedule");
  return { success: true };
}
```

### Pattern 4: Swap Request State Machine
**What:** A `swap_requests` table with states: `pending -> accepted | rejected | cancelled`. When a member requests a swap, eligible members for the same position are notified. When someone accepts, the team lead is notified to approve/reject. On approval, the assignment is reassigned.
**When to use:** For the full swap workflow (RESP-03, RESP-04).
**State machine:**
```
Member requests swap -> swap_request status = "pending"
  -> Notify eligible members for same position
  -> Another member accepts -> swap_request status = "accepted", accepted_by = member_id
    -> Notify team lead for approval
    -> Team lead approves -> swap executed (reassign), swap_request status = "completed"
    -> Team lead rejects -> swap_request status = "rejected", notify both members
  -> Requester cancels -> swap_request status = "cancelled"
  -> No one accepts before service date -> auto-expire (pg_cron cleanup)
```

### Pattern 5: Daily Reminder Cron Job
**What:** A pg_cron job runs daily, queries `service_assignments` joined with `member_profiles` where `reminder_days_before` matches the days until service, and creates notification rows.
**When to use:** For NOTF-05 (configurable reminders before service date).
**Example:**
```sql
-- pg_cron job: daily at 8:00 AM
select cron.schedule(
  'daily-reminders',
  '0 8 * * *',
  $$
    INSERT INTO public.notifications (recipient_member_id, type, title, body, metadata, action_url)
    SELECT
      sa.member_id,
      'reminder',
      'Serving Reminder',
      'You are serving as ' || tp.name || ' at ' || s.title || ' on ' || to_char(s.service_date, 'DD Mon YYYY'),
      jsonb_build_object('service_id', s.id, 'assignment_id', sa.id),
      '/my-schedule'
    FROM service_assignments sa
    JOIN service_positions sp ON sa.service_position_id = sp.id
    JOIN services s ON sp.service_id = s.id
    JOIN team_positions tp ON sp.position_id = tp.id
    JOIN member_profiles mp ON sa.member_id = mp.member_id
    WHERE sa.status != 'declined'
      AND s.is_cancelled = false
      AND s.service_date = CURRENT_DATE + (mp.reminder_days_before || ' days')::interval
      AND mp.reminder_days_before > 0
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.recipient_member_id = sa.member_id
          AND n.type = 'reminder'
          AND n.metadata->>'assignment_id' = sa.id::text
      );
  $$
);
```

### Anti-Patterns to Avoid
- **Polling for notifications:** Do NOT use `setInterval` to poll the notifications table. Use Supabase Realtime CDC instead -- it is already built in and far more efficient.
- **Embedding notification logic in every action:** Do NOT scatter `createNotification()` calls across unrelated modules. Instead, use the centralised `send.ts` function and keep all notification-triggering logic in `lib/notifications/actions.ts` or hook into the assignment actions via a clear pattern.
- **Storing notification preferences in the notification itself:** Keep preferences in `member_profiles` (already exists). The notification system reads preferences at send time to decide which providers to use.
- **Complex real-time filter expressions:** Supabase Realtime filter supports only simple equality filters (`column=eq.value`). Do NOT try complex OR/IN filters on the subscription. Instead, filter by `recipient_member_id` which is always a single value per user.
- **Skipping Realtime publication setup:** Supabase Realtime requires the table to be added to the `supabase_realtime` publication. Without this, CDC subscriptions will silently receive nothing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time notification delivery | Custom WebSocket server | Supabase Realtime (Postgres CDC) | Already built in, handles reconnection, filtering, auth |
| Scheduled reminder execution | Custom Node.js cron process | pg_cron + pg_net | Runs inside Postgres, no separate process to manage |
| Email delivery | Raw SMTP/nodemailer | Resend (already installed) | Already configured, handles bounces, templating |
| Toast notifications | Custom notification UI | sonner (already installed) | Already used throughout the app for consistent UX |
| Notification badge count | Manual counter with state sync | Supabase Realtime INSERT listener | Automatic increment on new notification, no polling |

**Key insight:** The entire notification infrastructure can be built with zero new dependencies. Supabase Realtime, pg_cron, pg_net, and Resend are all already available. The work is primarily database schema + server actions + UI components.

## Common Pitfalls

### Pitfall 1: Forgetting Realtime Publication
**What goes wrong:** Subscribing to `postgres_changes` on the `notifications` table returns nothing.
**Why it happens:** Supabase Realtime only listens to tables added to the `supabase_realtime` publication. New tables are NOT automatically included.
**How to avoid:** In the migration, add: `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;` and set `REPLICA IDENTITY FULL` on the table for UPDATE/DELETE payloads.
**Warning signs:** Realtime subscription status is `SUBSCRIBED` but no events arrive when rows are inserted.

### Pitfall 2: Notification Duplication
**What goes wrong:** The same notification is sent multiple times (e.g., reminder sent every day instead of once).
**Why it happens:** The pg_cron job runs daily but doesn't check if a reminder was already sent for that assignment.
**How to avoid:** Use a `NOT EXISTS` check in the reminder query (see Pattern 5 above) or add a `sent_reminder_at` column to `service_assignments`.
**Warning signs:** Users report receiving the same reminder multiple times.

### Pitfall 3: Race Condition in Swap Acceptance
**What goes wrong:** Two members accept the same swap request simultaneously, leading to conflicting state.
**Why it happens:** No database-level lock on the swap acceptance.
**How to avoid:** Use a Postgres advisory lock or an atomic `UPDATE ... WHERE status = 'pending'` that returns the updated row. If zero rows updated, the swap was already claimed.
**Warning signs:** Multiple `accepted_by` values or double-assignment after swap.

### Pitfall 4: Realtime Filter Limitations
**What goes wrong:** Attempting complex filters like `recipient_member_id=in.(id1,id2)` on Supabase Realtime CDC.
**Why it happens:** Supabase Realtime only supports `eq` filters on Postgres CDC subscriptions.
**How to avoid:** Always filter by a single `recipient_member_id=eq.{memberId}`. Each user subscribes to their own notifications only.
**Warning signs:** Realtime subscription errors or receiving all notifications instead of filtered ones.

### Pitfall 5: Member Can Respond to Others' Assignments
**What goes wrong:** A member confirms or declines another member's assignment.
**Why it happens:** Server action doesn't verify that the caller owns the assignment.
**How to avoid:** Always include `member_id = callerId` in the `WHERE` clause of the update query. The server action must verify ownership.
**Warning signs:** None visible until someone exploits it -- must be caught in code review.

### Pitfall 6: Notification Table Bloat
**What goes wrong:** The notifications table grows unboundedly, slowing queries.
**Why it happens:** Notifications are never deleted, and with daily reminders + assignment notifications, volume can be significant.
**How to avoid:** Add a pg_cron job to delete notifications older than 90 days. Add proper indexes on `(recipient_member_id, is_read, created_at)`.
**Warning signs:** Slow notification list loading over time.

### Pitfall 7: CalendarOff Icon Missing from Sidebar ICON_MAP
**What goes wrong:** The "Availability" nav item renders the fallback Calendar icon instead of CalendarOff.
**Why it happens:** `CalendarOff` is defined in `MEMBER_NAV_ITEMS` but not in the `ICON_MAP` in `app-sidebar.tsx`.
**How to avoid:** When adding `Bell` to the icon map (for notifications nav or header), also add `CalendarOff` to fix this existing bug.
**Warning signs:** Wrong icon displayed for Availability in the sidebar.

## Code Examples

Verified patterns from the existing codebase:

### Server Action Pattern (from existing lib/assignments/actions.ts)
```typescript
// All server actions follow this pattern:
// 1. Create RLS client, get user role
// 2. Parse + validate input with Zod
// 3. Authorise (isAdminOrCommittee or team lead check)
// 4. Execute with admin client (bypasses RLS for writes)
// 5. Revalidate path
// 6. Return { success: true } | { error: string }

"use server";
export async function respondToAssignment(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);
  if (!callerId) return { error: "Not authenticated." };

  const parsed = respondToAssignmentSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data." };

  const admin = createAdminClient();

  // Verify ownership: only the assigned member can respond
  const { data: assignment } = await admin
    .from("service_assignments")
    .select("id, member_id, service_position_id")
    .eq("id", parsed.data.assignmentId)
    .eq("member_id", callerId)
    .single();

  if (!assignment) return { error: "Assignment not found or not yours." };

  const { error } = await admin
    .from("service_assignments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.assignmentId);

  if (error) return { error: error.message };

  // Send notification on decline (to team lead)
  if (parsed.data.status === "declined") {
    await notifyTeamLeadOfDecline(assignment);
  }

  revalidatePath("/my-schedule");
  return { success: true };
}
```

### Supabase Realtime Subscription (verified from Context7)
```typescript
// Source: Context7 /supabase/supabase-js — Postgres CDC
const channel = supabase
  .channel(`notifications:${memberId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `recipient_member_id=eq.${memberId}`,
    },
    (payload) => {
      // payload.new contains the full notification row
      setNotifications((prev) => [payload.new, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }
  )
  .subscribe();
```

### Database Notification Schema
```sql
-- Migration: 00009_notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'assignment_new',
    'assignment_changed',
    'assignment_declined',
    'swap_requested',
    'swap_accepted',
    'swap_approved',
    'swap_rejected',
    'reminder'
  )),
  title text NOT NULL,
  body text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  action_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_unread
  ON public.notifications (recipient_member_id, is_read, created_at DESC);

CREATE INDEX idx_notifications_recipient_created
  ON public.notifications (recipient_member_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    recipient_member_id IN (
      SELECT id FROM public.members WHERE auth_user_id = (SELECT auth.uid())
    )
  );

-- Enable Realtime CDC
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### Swap Requests Table
```sql
CREATE TABLE public.swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.service_assignments(id) ON DELETE CASCADE,
  requester_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  accepted_by_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'approved', 'rejected', 'cancelled', 'expired')),
  reason text,
  resolved_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_swap_requests_assignment ON public.swap_requests (assignment_id);
CREATE INDEX idx_swap_requests_status ON public.swap_requests (status) WHERE status = 'pending';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling with setInterval | Supabase Realtime CDC subscriptions | Supabase v2 (2023) | Zero-latency notification delivery, no wasted requests |
| Custom WebSocket server | Supabase Realtime channels | Supabase v2 (2023) | No infrastructure to manage, auth built in |
| Server-side cron with node-cron | pg_cron inside Postgres | Always available in Supabase | Runs in-process, no separate server needed |
| Manual email sending | Resend API | Already in codebase | Handles deliverability, bounces, templates |

**Deprecated/outdated:**
- Supabase Realtime v1 (non-CDC approach): Replaced by Postgres CDC in v2. All examples use the current `postgres_changes` event type.
- `supabase.from().on()` (old Realtime API): Replaced by `supabase.channel().on()`.

## Open Questions

1. **Swap request expiry policy**
   - What we know: Swap requests should auto-expire before the service date
   - What's unclear: How many hours/days before the service should swaps expire? Should it be configurable?
   - Recommendation: Default to 24 hours before service date. Can be made configurable later. Use pg_cron daily job to expire stale requests.

2. **Notification retention period**
   - What we know: Notifications will accumulate over time
   - What's unclear: How long should notifications be retained?
   - Recommendation: 90-day retention with pg_cron cleanup job. Users rarely look at notifications older than a month.

3. **Email notifications (beyond in-app)**
   - What we know: Resend is already set up, `notify_email` preference exists in `member_profiles`
   - What's unclear: Should email notifications be sent in Phase 6 or deferred to a later phase?
   - Recommendation: Architect the provider interface now but implement only `InAppProvider` in Phase 6. Email can be added as a second provider later with minimal changes. This satisfies NOTF-03 (provider-extensible architecture) without overloading this phase.

4. **My Schedule page implementation**
   - What we know: `/my-schedule` exists but is a placeholder with no content
   - What's unclear: What exactly should the member's schedule view look like?
   - Recommendation: Show upcoming assignments as a chronological list grouped by date, each with service title, position, time, and a Confirm/Decline button pair. This is the simplest approach that satisfies RESP-01 and RESP-05.

5. **Should team leads also be notified of confirmations?**
   - What we know: RESP-02 says declining triggers a notification to the team lead
   - What's unclear: Should confirming also notify the team lead?
   - Recommendation: Yes, but as a lower-priority notification. The team lead benefits from knowing their roster is confirmed. This can be a silent notification (no toast, just in the bell) versus the decline which should be more prominent.

## Sources

### Primary (HIGH confidence)
- Context7 `/supabase/supabase-js` -- Realtime CDC subscriptions, channel API, filter syntax
- Context7 `/websites/supabase` -- pg_cron scheduling, pg_net HTTP calls, Realtime trigger functions, `realtime.send()` and `realtime.broadcast_changes()`
- Existing codebase: `lib/assignments/actions.ts`, `lib/assignments/queries.ts`, `lib/assignments/types.ts` -- server action patterns, assignment data model
- Existing codebase: `supabase/migrations/00006_assignments.sql` -- `service_assignments` table with `status` column
- Existing codebase: `supabase/migrations/00004_member_profiles.sql` -- notification preferences columns
- Existing codebase: `lib/otp/email.ts` -- Resend email sending pattern
- Existing codebase: `components/profiles/notification-preferences.tsx` -- existing notification preferences UI

### Secondary (MEDIUM confidence)
- Supabase docs on Realtime publication requirements (`ALTER PUBLICATION supabase_realtime ADD TABLE`)
- Supabase docs on pg_cron scheduling with pg_net for Edge Function invocation
- Supabase docs on Realtime filter limitations (eq-only for CDC)

### Tertiary (LOW confidence)
- None -- all findings verified via Context7 or existing codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; all tools already installed or available as Supabase extensions
- Architecture: HIGH -- follows established patterns from existing codebase (server actions, admin client, Zod validation)
- Notification system: HIGH -- Supabase Realtime CDC is well-documented and verified via Context7
- Swap workflow: MEDIUM -- state machine is straightforward but race condition handling needs careful implementation
- Reminder system: MEDIUM -- pg_cron + pg_net pattern is well-documented but has not been used in this codebase before
- Pitfalls: HIGH -- all pitfalls derived from documented Supabase limitations or existing codebase patterns

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days -- stable domain, no fast-moving dependencies)
