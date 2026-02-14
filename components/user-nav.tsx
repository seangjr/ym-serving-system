"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { AppRole } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UserNavProps {
  user: { email: string; role: AppRole };
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="flex flex-col gap-2 px-1 group-data-[collapsible=icon]:px-0">
      <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
        <span className="truncate text-sm text-muted-foreground">
          {user.email}
        </span>
        <Badge variant="secondary" className="text-[10px] capitalize">
          {user.role}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start gap-2 text-muted-foreground group-data-[collapsible=icon]:justify-center"
        onClick={handleSignOut}
      >
        <LogOut className="size-4 shrink-0" />
        <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
      </Button>
    </div>
  );
}
