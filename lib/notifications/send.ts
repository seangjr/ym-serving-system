import type { NotificationPayload } from "./providers";
import { getProviders } from "./providers";

// ---------------------------------------------------------------------------
// Central notification dispatch
// ---------------------------------------------------------------------------

/**
 * Send a notification via all registered providers.
 *
 * This is the SINGLE entry point for all notification sending throughout the
 * app. Notification failures are logged but do not propagate — they should
 * never break the calling action.
 */
export async function createNotification(
  payload: NotificationPayload,
): Promise<void> {
  const providers = getProviders();

  try {
    await Promise.all(
      providers.map((provider) => provider.send(payload)),
    );
  } catch (error) {
    console.error(
      "[notifications] Failed to send notification:",
      error instanceof Error ? error.message : error,
    );
  }
}
