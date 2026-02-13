"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const type = searchParams.get("type") ?? "reset";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Status polling state
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(async () => {
    if (!email) return;

    try {
      const res = await fetch(
        `/api/auth/reset-status?email=${encodeURIComponent(email)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setAttemptsLeft(data.attempts_left ?? 0);
      setResendCooldown(data.resend_available_in ?? 0);
      setExpiresIn(data.expires_in ?? 0);
    } catch {
      // Silently ignore polling errors
    }
  }, [email]);

  // Start polling on mount
  useEffect(() => {
    pollStatus();
    pollRef.current = setInterval(pollStatus, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollStatus]);

  // Local countdown timers (decrement between polls)
  useEffect(() => {
    const tick = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
      setExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        setCode("");
        setLoading(false);
        // Refresh status after failed attempt
        pollStatus();
        return;
      }

      // Success — redirect to setup-password
      router.push(
        `/setup-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(data.reset_token)}&type=${type}`,
      );
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setResending(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not resend code");
      } else {
        setCode("");
        // Refresh status to pick up new cooldown
        pollStatus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="flex flex-col gap-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Missing information
        </h1>
        <p className="text-muted-foreground text-sm">
          No email provided. Please start the reset process again.
        </p>
        <Button
          variant="outline"
          className="mx-auto h-11 w-full text-sm font-semibold tracking-wide uppercase"
          onClick={() => router.push("/forgot-password")}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Enter verification code
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          We sent a 6-digit code to{" "}
          <span className="text-foreground font-medium">{email}</span>
        </p>
      </div>

      {/* OTP Input */}
      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={loading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
              <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Status indicators */}
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            {expiresIn > 0
              ? `Expires in ${formatTime(expiresIn)}`
              : "Code expired"}
          </span>
          <span>
            {attemptsLeft > 0
              ? `${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left`
              : "No attempts left"}
          </span>
        </div>

        {error && (
          <p className="text-destructive text-center text-sm">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading || code.length !== 6 || expiresIn === 0}
          className="h-11 w-full text-sm font-semibold tracking-wide uppercase"
        >
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </form>

      {/* Resend */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resending
            ? "Sending..."
            : resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
