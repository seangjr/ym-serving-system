import { Resend } from "resend";
import { PASSWORD_RESET_OTP_EXPIRY_MINUTES } from "./constants";

const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "YM Serving <noreply@yourdomain.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Send a password reset OTP email.
 *
 * If `RESEND_API_KEY` is set, sends via Resend API.
 * Otherwise, logs to console (development mode).
 */
export async function sendPasswordResetEmail(
  email: string,
  code: string,
  userName?: string,
): Promise<void> {
  const greeting = userName ? `Hi ${userName},` : "Hi,";
  const verifyUrl = `${SITE_URL}/verify?type=reset&email=${encodeURIComponent(email)}`;

  const subject = "Reset your password for YM Serving";
  const html = buildHtmlEmail(greeting, code, verifyUrl);
  const text = buildTextEmail(greeting, code, verifyUrl);

  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const resend = new Resend(resendApiKey);

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[OTP Email] Failed to send via Resend:", error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  } else {
    // Development fallback: log to console
    console.log("─".repeat(60));
    console.log("[DEV] Password Reset Email");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Code: ${code}`);
    console.log(`Verify URL: ${verifyUrl}`);
    console.log("─".repeat(60));
  }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function buildHtmlEmail(
  greeting: string,
  code: string,
  verifyUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;padding:40px;">
          <tr>
            <td>
              <!-- Header -->
              <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.02em;">
                YM Serving
              </h1>

              <!-- Greeting -->
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                ${greeting}
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                We received a request to reset your password. Use the code below to verify your identity:
              </p>

              <!-- OTP Code -->
              <div style="margin:0 0 24px;padding:20px;background-color:#f3f4f6;border-radius:8px;text-align:center;">
                <span style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:#111827;font-family:'Courier New',monospace;">
                  ${code}
                </span>
              </div>

              <!-- Expiry notice -->
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.5;">
                This code expires in ${PASSWORD_RESET_OTP_EXPIRY_MINUTES} minutes.
              </p>

              <!-- Verify link -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background-color:#111827;border-radius:6px;">
                    <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Verify &amp; Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
          YM Serving &mdash; Worship team scheduling and management
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTextEmail(
  greeting: string,
  code: string,
  verifyUrl: string,
): string {
  return `${greeting}

We received a request to reset your password for YM Serving.

Your verification code is: ${code}

This code expires in ${PASSWORD_RESET_OTP_EXPIRY_MINUTES} minutes.

To reset your password, visit: ${verifyUrl}

If you didn't request this, you can safely ignore this email. Your password will remain unchanged.

---
YM Serving - Worship team scheduling and management`;
}
