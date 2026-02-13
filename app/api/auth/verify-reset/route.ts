import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOtp, hashOtp } from "@/lib/otp/crypto";
import { generateResetToken } from "@/lib/otp/generate";
import { PASSWORD_RESET_TOKEN_EXPIRY_MINUTES } from "@/lib/otp/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const code = (body.code ?? "").toString().trim();

    // Validate input
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid 6-digit code" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Fetch latest pending password_reset for this email
    const { data: resetRecord, error: fetchError } = await admin
      .from("password_resets")
      .select("*")
      .eq("email", email)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !resetRecord) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    // Check expiry
    if (new Date(resetRecord.otp_expires_at) < new Date()) {
      await admin
        .from("password_resets")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", resetRecord.id);

      return NextResponse.json(
        { ok: false, error: "Code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Check attempts
    if (resetRecord.attempts_left <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many attempts. Please request a new code.",
        },
        { status: 400 },
      );
    }

    // Verify OTP
    const isValid = await verifyOtp(code, resetRecord.otp_hash);

    if (!isValid) {
      // Decrement attempts
      const newAttempts = resetRecord.attempts_left - 1;
      await admin
        .from("password_resets")
        .update({
          attempts_left: newAttempts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resetRecord.id);

      return NextResponse.json(
        { ok: false, error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    // OTP verified — generate reset token
    const resetToken = generateResetToken();
    const resetTokenHash = await hashOtp(resetToken);
    const tokenExpiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );

    // Update record: verified, clear otp_hash, store reset token
    const { error: updateError } = await admin
      .from("password_resets")
      .update({
        status: "verified",
        otp_hash: null,
        reset_token_hash: resetTokenHash,
        reset_token_expires_at: tokenExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", resetRecord.id);

    if (updateError) {
      console.error("[verify-reset] update error:", updateError);
      return NextResponse.json(
        { ok: false, error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      email,
      reset_token: resetToken,
      expires_in: PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60,
    });
  } catch (err) {
    console.error("[verify-reset] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
