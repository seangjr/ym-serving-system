"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updatePassword, type AuthActionState } from "@/lib/auth/actions";
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
      {pending ? "Updating..." : "Update password"}
    </Button>
  );
}

export default function UpdatePasswordPage() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    updatePassword,
    {},
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Enter your new password below
        </p>
      </div>

      {/* Form */}
      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="New password"
            required
            autoComplete="new-password"
            minLength={6}
            className="h-11"
          />
          <p className="text-muted-foreground text-xs">Minimum 6 characters</p>
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
            minLength={6}
            className="h-11"
          />
        </div>

        {state.error && (
          <p className="text-destructive text-sm">{state.error}</p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
