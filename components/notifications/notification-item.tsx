"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Notification } from "@/lib/notifications/types";

// ---------------------------------------------------------------------------
// Relative time helper (no external dependency)
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

interface NotificationItemProps {
  notification: Notification;
  onRead: (notificationId: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
    >
      {/* Unread indicator dot */}
      <div className="mt-1.5 shrink-0">
        <div
          className={`h-2 w-2 rounded-full ${
            notification.isRead ? "invisible" : "bg-blue-500"
          }`}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-tight ${
            notification.isRead ? "font-normal" : "font-semibold"
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.body}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {relativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Clickable indicator */}
      {notification.actionUrl && (
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/50" />
      )}
    </button>
  );
}
