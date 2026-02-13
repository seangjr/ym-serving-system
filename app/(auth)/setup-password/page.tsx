"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/lib/otp/password-validation";
import { PASSWORD_MIN_LENGTH } from "@/lib/otp/constants";

function CheckIcon({ checked }: { checked: boolean }) {
  return (
    <span
      className={`mr-2 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs ${
        checked
          ? "bg-foreground text-background"
          : "border-muted-foreground/30 border"
      }`}
    >
      {checked ? "\u2713" : ""}
    </span>
  );
}

function SetupPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validation = validatePassword(password);
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  // Redirect if missing params
  useEffect(() => {
    if (!email || !token) {
      router.replace("/forgot-password");
    }
  }, [email, token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validation.isValid) {
      setError("Please meet all password requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to reset password");
        setLoading(false);
        return;
      }

      toast.success("Password reset successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (!email || !token) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Choose a strong password for your account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="New password"
            required
            autoComplete="new-password"
            className="h-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            required
            autoComplete="new-password"
            className="h-11"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Password requirements */}
        {password.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Requirements
            </p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li className="flex items-center">
                <CheckIcon checked={validation.checks.minLength} />
                At least {PASSWORD_MIN_LENGTH} characters
              </li>
              <li className="flex items-center">
                <CheckIcon checked={validation.checks.hasUppercase} />
                One uppercase letter
              </li>
              <li className="flex items-center">
                <CheckIcon checked={validation.checks.hasLowercase} />
                One lowercase letter
              </li>
              <li className="flex items-center">
                <CheckIcon checked={validation.checks.hasNumber} />
                One number
              </li>
              <li className="flex items-center">
                <CheckIcon checked={validation.checks.hasSymbol} />
                One special character
              </li>
              {confirmPassword.length > 0 && (
                <li className="flex items-center">
                  <CheckIcon checked={passwordsMatch} />
                  Passwords match
                </li>
              )}
            </ul>
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          disabled={loading || !validation.isValid || !passwordsMatch}
          className="h-11 w-full text-sm font-semibold tracking-wide uppercase"
        >
          {loading ? "Setting password..." : "Set password"}
        </Button>
      </form>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
        </div>
      }
    >
      <SetupPasswordForm />
    </Suspense>
  );
}
