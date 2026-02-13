import { redirect } from "next/navigation";
import { getDefaultRoute, getUserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function AppRootPage() {
  const supabase = await createClient();

  const { role } = await getUserRole(supabase);

  redirect(getDefaultRoute(role));
}
