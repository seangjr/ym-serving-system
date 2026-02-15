"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ManageableMember {
  id: string;
  fullName: string;
}

interface MemberSelectorProps {
  members: ManageableMember[];
  currentMemberId: string;
  ownMemberId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MemberSelector({
  members,
  currentMemberId,
  ownMemberId,
}: MemberSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const value = currentMemberId === ownMemberId ? "__self__" : currentMemberId;

  function handleChange(memberId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (memberId === "__self__") {
      params.delete("member");
    } else {
      params.set("member", memberId);
    }
    const query = params.toString();
    router.push(`/availability${query ? `?${query}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Managing:
      </span>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Select member" />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-48">
          <SelectItem value="__self__">My Availability</SelectItem>
          {members
            .filter((m) => m.id !== ownMemberId)
            .map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.fullName}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
