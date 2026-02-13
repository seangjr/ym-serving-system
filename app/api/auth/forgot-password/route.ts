import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtp } from "@/lib/otp/generate";
import { hashOtp } from "@/lib/otp/crypto";
import { sendPasswordResetEmail } from "@/lib/otp/email";
import {
  PASSWORD_RESET_OTP_EXPIRY_MINUTES,
  PASSWORD_RESET_OTP_ATTEMPTS,
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
  PASSWORD_RESET_DAILY_LIMIT,
} from "@/lib/otp/constants";

const GENERIC_SUCCESS = {
  ok: true,
  message:
    "If an account exists with that email, you will receive a reset code.",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email ?? "").toString().trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Look up auth user by email (service role — bypasses RLS)
    const { data: userList, error: listError } =
      await admin.auth.admin.listUsers({ perPage: 1 });

    if (listError) {
      console.error("[forgot-password] listUsers error:", listError);
      return NextResponse.json(GENERIC_SUCCESS);
    }

    // Use a targeted approach: search all users matching this email
    const {
      data: { users },
    } = await admin.auth.admin.listUsers({ perPage: 1000 });

    const authUser = users.find((u) => u.email?.toLowerCase() === email);

    if (!authUser) {
      // User doesn't exist — return generic success (prevent enumeration)
      return NextResponse.json(GENERIC_SUCCESS);
    }

    // Check rate limits: fetch the latest pending reset for this email
    const { data: existing } = await admin
      .from("password_resets")
      .select("*")
      .eq("email", email)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Check resend cooldown
      if (existing.resend_available_at) {
        const cooldownEnd = new Date(existing.resend_available_at).getTime();
        if (Date.now() < cooldownEnd) {
          const waitSeconds = Math.ceil((cooldownEnd - Date.now()) / 1000);
          return NextResponse.json(
            {
              ok: false,
              error: `Please wait ${waitSeconds} seconds before requesting a new code`,
            },
            { status: 429 },
          );
        }
      }

      // Check daily limit
      if (existing.daily_resend_count >= PASSWORD_RESET_DAILY_LIMIT) {
        return NextResponse.json(
          {
            ok: false,
            error: "Daily reset limit reached. Please try again tomorrow.",
          },
          { status: 429 },
        );
      }
    }

    // Generate OTP
    const code = generateOtp();
    const otpHash = await hashOtp(code);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + PASSWORD_RESET_OTP_EXPIRY_MINUTES * 60 * 1000,
    );
    const resendAvailableAt = new Date(
      now.getTime() + PASSWORD_RESET_RESEND_COOLDOWN_SECONDS * 1000,
    );
    const dailyCount = (existing?.daily_resend_count ?? 0) + 1;

    // Upsert into password_resets
    if (existing) {
      // Update the existing pending record
      const { error: updateError } = await admin
        .from("password_resets")
        .update({
          otp_hash: otpHash,
          otp_expires_at: expiresAt.toISOString(),
          attempts_left: PASSWORD_RESET_OTP_ATTEMPTS,
          resend_available_at: resendAvailableAt.toISOString(),
          daily_resend_count: dailyCount,
          status: "pending",
          updated_at: now.toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("[forgot-password] update error:", updateError);
        return NextResponse.json(GENERIC_SUCCESS);
      }
    } else {
      // Insert a new record
      const { error: insertError } = await admin
        .from("password_resets")
        .insert({
          email,
          status: "pending",
          otp_hash: otpHash,
          otp_expires_at: expiresAt.toISOString(),
          attempts_left: PASSWORD_RESET_OTP_ATTEMPTS,
          resend_available_at: resendAvailableAt.toISOString(),
          daily_resend_count: 1,
          auth_user_id: authUser.id,
        });

      if (insertError) {
        console.error("[forgot-password] insert error:", insertError);
        return NextResponse.json(GENERIC_SUCCESS);
      }
    }

    // Send email
    const userName =
      authUser.user_metadata?.full_name ?? authUser.user_metadata?.name;

    await sendPasswordResetEmail(email, code, userName);

    // In development (no RESEND_API_KEY), also return the code for testing
    const isDev = !process.env.RESEND_API_KEY;
    return NextResponse.json({
      ...GENERIC_SUCCESS,
      ...(isDev ? { code } : {}),
    });
  } catch (err) {
    console.error("[forgot-password] unexpected error:", err);
    return NextResponse.json(GENERIC_SUCCESS);
  }
}
