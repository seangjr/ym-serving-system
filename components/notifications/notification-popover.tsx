"use client";

import { useNotifications } from "./notification-provider";
import { NotificationItem } from "./notification-item";
import { PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// NotificationPopover — content rendered inside the Popover
// ---------------------------------------------------------------------------

export function NotificationPopover() {
  const { notifications, unreadCount, markAsRead, markAllRead } =
    useNotifications();

  return (
    <PopoverContent align="end" className="w-80 p-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => markAllRead()}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No notifications
        </div>
      ) : (
        <ScrollArea className="max-h-96">
          <div className="py-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </PopoverContent>
  );
}
