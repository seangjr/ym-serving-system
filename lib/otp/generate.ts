import { randomBytes, randomInt } from "node:crypto";
import { OTP_CODE_LENGTH } from "./constants";

/**
 * Generate a cryptographically secure random numeric OTP code.
 *
 * Uses `crypto.randomInt()` for each digit to ensure uniform distribution.
 * Default length is 6 digits (configurable via constants).
 *
 * @param length - Number of digits in the OTP code
 * @returns A string of random digits (e.g., "482917")
 */
export function generateOtp(length: number = OTP_CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

/**
 * Generate a cryptographically secure random token for the password reset phase.
 *
 * After OTP verification succeeds, this token is issued to authorize the
 * actual password update. It is a 32-byte hex string (64 characters).
 *
 * @returns A 64-character hex string
 */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}
