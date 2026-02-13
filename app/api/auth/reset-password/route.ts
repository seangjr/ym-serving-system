import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOtp } from "@/lib/otp/crypto";
import { validatePassword } from "@/lib/otp/password-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const token = (body.token ?? "").toString().trim();
    const password = (body.password ?? "").toString();

    // Validate input
    if (!email || !token || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return NextResponse.json(
        { ok: false, error: validation.errors[0] },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Fetch verified password_reset for this email
    const { data: resetRecord, error: fetchError } = await admin
      .from("password_resets")
      .select("*")
      .eq("email", email)
      .eq("status", "verified")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !resetRecord) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired reset session" },
        { status: 400 },
      );
    }

    // Check token expiry
    if (
      !resetRecord.reset_token_hash ||
      !resetRecord.reset_token_expires_at ||
      new Date(resetRecord.reset_token_expires_at) < new Date()
    ) {
      await admin
        .from("password_resets")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", resetRecord.id);

      return NextResponse.json(
        {
          ok: false,
          error: "Reset session expired. Please start over.",
        },
        { status: 400 },
      );
    }

    // Verify token
    const isTokenValid = await verifyOtp(token, resetRecord.reset_token_hash);
    if (!isTokenValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid reset token" },
        { status: 400 },
      );
    }

    // Update auth user password
    const { error: updateAuthError } = await admin.auth.admin.updateUserById(
      resetRecord.auth_user_id,
      {
        password,
      },
    );

    if (updateAuthError) {
      console.error("[reset-password] updateUser error:", updateAuthError);
      return NextResponse.json(
        { ok: false, error: "Failed to update password. Please try again." },
        { status: 500 },
      );
    }

    // Clear token from password_resets and mark as used
    await admin
      .from("password_resets")
      .update({
        reset_token_hash: null,
        reset_token_expires_at: null,
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("id", resetRecord.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
