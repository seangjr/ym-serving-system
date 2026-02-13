import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams
      .get("email")
      ?.trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email is required" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: resetRecord } = await admin
      .from("password_resets")
      .select("attempts_left, resend_available_at, otp_expires_at")
      .eq("email", email)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!resetRecord) {
      return NextResponse.json({
        ok: true,
        attempts_left: 0,
        resend_available_in: 0,
        expires_in: 0,
      });
    }

    const now = Date.now();

    const resendAvailableIn = resetRecord.resend_available_at
      ? Math.max(
          0,
          Math.floor(
            (new Date(resetRecord.resend_available_at).getTime() - now) / 1000,
          ),
        )
      : 0;

    const expiresIn = resetRecord.otp_expires_at
      ? Math.max(
          0,
          Math.floor(
            (new Date(resetRecord.otp_expires_at).getTime() - now) / 1000,
          ),
        )
      : 0;

    return NextResponse.json({
      ok: true,
      attempts_left: resetRecord.attempts_left ?? 0,
      resend_available_in: resendAvailableIn,
      expires_in: expiresIn,
    });
  } catch (err) {
    console.error("[reset-status] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}
