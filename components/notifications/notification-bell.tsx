"use client";

import { Bell } from "lucide-react";
import { useNotifications } from "./notification-provider";
import { NotificationPopover } from "./notification-popover";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// NotificationBell — bell icon trigger with unread badge
// ---------------------------------------------------------------------------

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  const displayCount = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {displayCount}
            </span>
          )}
          <span className="sr-only">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"}
          </span>
        </Button>
      </PopoverTrigger>
      <NotificationPopover />
    </Popover>
  );
}
