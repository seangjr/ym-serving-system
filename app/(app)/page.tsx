import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDefaultRoute, getUserRole } from "@/lib/auth/roles";

export default async function AppRootPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const role = getUserRole(session);

  redirect(getDefaultRoute(role));
}
