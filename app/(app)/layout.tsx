import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationContextProvider } from "@/components/notifications/notification-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUserRole } from "@/lib/auth/roles";
import { getNotifications, getUnreadCount } from "@/lib/notifications/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Verify authentication (defense in depth -- middleware should catch first)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resolve role from DB (members -> assignments -> roles)
  const { role, memberId } = await getUserRole(supabase);

  // Fetch initial notification data for the provider
  const [initialNotifications, initialUnreadCount] = await Promise.all([
    getNotifications(20),
    getUnreadCount(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar role={role} user={{ email: user.email ?? "", role }} />
      <SidebarInset>
        {memberId ? (
          <NotificationContextProvider
            memberId={memberId}
            initialNotifications={initialNotifications}
            initialUnreadCount={initialUnreadCount}
          >
            {/* Sticky header with notification bell */}
            <header className="sticky top-0 z-10 flex h-12 items-center justify-end border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <NotificationBell />
            </header>
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </NotificationContextProvider>
        ) : (
          <main className="flex-1 p-4 md:p-6">{children}</main>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
