import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUserRole } from "@/lib/auth/roles";
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

  // Resolve role from DB (members → assignments → roles)
  const { role } = await getUserRole(supabase);

  return (
    <SidebarProvider>
      <AppSidebar role={role} user={{ email: user.email ?? "", role }} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="md:hidden" />
          <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
