"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { markAsRead as markAsReadAction } from "@/lib/notifications/actions";
import { markAllRead as markAllReadAction } from "@/lib/notifications/actions";
import type { Notification } from "@/lib/notifications/types";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface NotificationContextProviderProps {
  memberId: string;
  initialNotifications: Notification[];
  initialUnreadCount: number;
  children: React.ReactNode;
}

export function NotificationContextProvider({
  memberId,
  initialNotifications,
  initialUnreadCount,
  children,
}: NotificationContextProviderProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoading] = useState(false);
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  // Lazy-init the Supabase client (avoids calling createClient on every render)
  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }

  // Supabase Realtime subscription — wait for auth before subscribing
  useEffect(() => {
    const supabase = getSupabase();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    function subscribe() {
      channel = supabase
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
            const row = payload.new as Record<string, unknown>;

            const newNotification: Notification = {
              id: row.id as string,
              recipientMemberId: row.recipient_member_id as string,
              type: row.type as Notification["type"],
              title: row.title as string,
              body: row.body as string,
              metadata: (row.metadata as Record<string, unknown>) ?? {},
              actionUrl: (row.action_url as string) ?? null,
              isRead: row.is_read as boolean,
              createdAt: row.created_at as string,
            };

            // Prepend to list and increment unread
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show sonner toast
            const truncatedBody =
              newNotification.body.length > 80
                ? `${newNotification.body.slice(0, 80)}...`
                : newNotification.body;

            toast(newNotification.title, {
              description: truncatedBody,
              duration: 5000,
              action: newNotification.actionUrl
                ? {
                    label: "View",
                    onClick: () => {
                      router.push(newNotification.actionUrl!);
                    },
                  }
                : undefined,
            });
          },
        )
        .subscribe();
    }

    // Ensure we have a session before subscribing
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscribe();
      }
    });

    // Re-subscribe when auth state changes (e.g., token refresh)
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !channel) {
        subscribe();
      }
    });

    return () => {
      authSub.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  // markAsRead
  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const result = await markAsReadAction({ notificationId });
    if ("error" in result) {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: false } : n,
        ),
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // markAllRead
  const markAllRead = useCallback(async () => {
    const previousNotifications = notifications;
    const previousCount = unreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    const result = await markAllReadAction({});
    if ("error" in result) {
      // Revert on error
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
    }
  }, [notifications, unreadCount]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isLoading, markAsRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationContextProvider",
    );
  }
  return ctx;
}
