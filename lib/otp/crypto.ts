import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// scrypt parameters
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

/**
 * Hash an OTP code using scrypt with a random salt.
 *
 * Output format: `scrypt$16384$8$1$<saltBase64>$<hashBase64>`
 *
 * This ensures OTP codes are not stored in plaintext in the database.
 */
export async function hashOtp(code: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);

  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      code,
      salt,
      KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      },
    );
  });

  const saltBase64 = salt.toString("base64");
  const hashBase64 = hash.toString("base64");

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${saltBase64}$${hashBase64}`;
}

/**
 * Verify an OTP code against a stored hash using constant-time comparison.
 *
 * Parses the hash format `scrypt$N$r$p$saltBase64$hashBase64` and re-derives
 * the key from the provided code, then compares with `timingSafeEqual`.
 */
export async function verifyOtp(
  code: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");

  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const N = Number.parseInt(parts[1], 10);
  const r = Number.parseInt(parts[2], 10);
  const p = Number.parseInt(parts[3], 10);
  const salt = Buffer.from(parts[4], "base64");
  const expectedHash = Buffer.from(parts[5], "base64");

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    scrypt(code, salt, KEY_LENGTH, { N, r, p }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });

  // Constant-time comparison to prevent timing attacks
  if (derivedKey.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedHash);
}
