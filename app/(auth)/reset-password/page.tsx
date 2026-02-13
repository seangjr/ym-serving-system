"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { resetPassword, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full text-sm font-semibold tracking-wide uppercase"
    >
      {pending ? "Sending..." : "Send reset link"}
    </Button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    resetPassword,
    {},
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Reset password</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {/* Success message */}
      {state.success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          {state.success}
        </div>
      )}

      {/* Form */}
      {!state.success && (
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
              className="h-11"
            />
          </div>

          {state.error && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}

          <SubmitButton />
        </form>
      )}

      {/* Footer link */}
      <div className="text-center">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
