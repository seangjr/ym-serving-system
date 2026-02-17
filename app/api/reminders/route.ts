import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/reminders
 *
 * Triggers the generate_service_reminders() SQL function.
 * Used as a fallback when pg_cron is not available (local dev, hobby Supabase
 * plans) or as an integration point for external cron services (Vercel Cron,
 * GitHub Actions, etc.).
 *
 * Authentication: Bearer token matching CRON_SECRET env var, OR the Supabase
 * service role key.
 */
export async function POST(request: Request) {
  // -----------------------------------------------------------------------
  // 1. Authenticate the request
  // -----------------------------------------------------------------------
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  const cronSecret = process.env.CRON_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isAuthorized =
    (cronSecret && token === cronSecret) ||
    (serviceRoleKey && token === serviceRoleKey);

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  // -----------------------------------------------------------------------
  // 2. Execute reminder generation
  // -----------------------------------------------------------------------
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("generate_service_reminders");

    if (error) {
      console.error("[reminders] RPC error:", error);
      return NextResponse.json(
        { error: error.message },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return NextResponse.json(
      { success: true, remindersGenerated: data },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    console.error("[reminders] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
