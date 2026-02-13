"use client";

import { Suspense, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { type AuthActionState, login } from "@/lib/auth/actions";
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
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

/**
 * Reads error query param and shows a toast.
 * Wrapped in Suspense because useSearchParams() triggers CSR bailout.
 */
function ErrorToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(error);
    }
  }, [searchParams]);

  return null;
}

export default function LoginPage() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    login,
    {},
  );

  return (
    <div className="flex flex-col gap-8">
      <Suspense>
        <ErrorToast />
      </Suspense>

      {/* Logo / Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">YM Serving</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Sign in to your account
        </p>
      </div>

      {/* Form */}
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            minLength={6}
            className="h-11"
          />
        </div>

        {state.error && (
          <p className="text-destructive text-sm">{state.error}</p>
        )}

        <SubmitButton />
      </form>

      {/* Footer link */}
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Forgot your password?
        </Link>
      </div>
    </div>
  );
}
