import Link from "next/link";

import { Button } from "@/components/ui/button";

const errorMessages: Record<string, string> = {
  auth_code_error:
    "There was a problem verifying your authentication code. Please try again.",
  session_expired: "Your session has expired. Please sign in again.",
  access_denied: "You do not have permission to access this resource.",
  default: "Something went wrong. Please try again.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const errorType = typeof params.error === "string" ? params.error : "default";
  const message = errorMessages[errorType] ?? errorMessages.default;

  return (
    <div className="flex flex-col gap-8 text-center">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Authentication error
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">{message}</p>
      </div>

      {/* Action */}
      <Button
        asChild
        className="h-11 w-full text-sm font-semibold tracking-wide uppercase"
      >
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
