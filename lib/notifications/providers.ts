import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "./types";

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

/** Payload passed to each notification provider. */
export interface NotificationPayload {
  recipientMemberId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
}

/** Interface for notification delivery providers. */
export interface NotificationProvider {
  /** Provider name (e.g., 'in_app', 'email', 'telegram'). */
  name: string;
  /** Send a notification via this provider. */
  send(payload: NotificationPayload): Promise<void>;
}

// ---------------------------------------------------------------------------
// In-app provider (writes to notifications table)
// ---------------------------------------------------------------------------

export class InAppProvider implements NotificationProvider {
  name = "in_app";

  async send(payload: NotificationPayload): Promise<void> {
    const admin = createAdminClient();

    const { error } = await admin.from("notifications").insert({
      recipient_member_id: payload.recipientMemberId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata ?? {},
      action_url: payload.actionUrl ?? null,
    });

    if (error) {
      throw new Error(`InAppProvider: failed to insert notification: ${error.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

/**
 * Get all active notification providers.
 * Future providers (Email, Telegram, WhatsApp) are added here.
 */
export function getProviders(): NotificationProvider[] {
  return [new InAppProvider()];
}
