import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIRE_LOWERCASE,
  PASSWORD_REQUIRE_NUMBER,
  PASSWORD_REQUIRE_SYMBOL,
  PASSWORD_REQUIRE_UPPERCASE,
} from "./constants";

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

/**
 * Validate a password against the configured requirements.
 *
 * Returns a structured result so the UI can display individual
 * checkmarks for each requirement as the user types.
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  const checks = {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  if (!checks.minLength) {
    errors.push(`Must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (PASSWORD_REQUIRE_UPPERCASE && !checks.hasUppercase) {
    errors.push("Must contain at least one uppercase letter");
  }

  if (PASSWORD_REQUIRE_LOWERCASE && !checks.hasLowercase) {
    errors.push("Must contain at least one lowercase letter");
  }

  if (PASSWORD_REQUIRE_NUMBER && !checks.hasNumber) {
    errors.push("Must contain at least one number");
  }

  if (PASSWORD_REQUIRE_SYMBOL && !checks.hasSymbol) {
    errors.push("Must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
    checks,
  };
}
