import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with the service role key.
 *
 * This bypasses RLS and should only be used in server-side code
 * (API routes, server actions, server components) for admin operations
 * like role lookups that need to read across all rows.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
