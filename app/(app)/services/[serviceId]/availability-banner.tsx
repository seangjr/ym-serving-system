"use client";

import { CalendarOff, ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UnavailableMemberItem {
  memberId: string;
  memberName: string;
  reason: string | null;
}

interface AvailabilityBannerProps {
  unavailableMembers: UnavailableMemberItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AvailabilityBanner({
  unavailableMembers,
}: AvailabilityBannerProps) {
  const [open, setOpen] = useState(false);

  if (unavailableMembers.length === 0) return null;

  const count = unavailableMembers.length;
  const label =
    count === 1
      ? "1 member unavailable on this date"
      : `${count} members unavailable on this date`;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-left text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60">
        <CalendarOff className="size-4 shrink-0" />
        <span className="flex-1">{label}</span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/20">
          <ul className="flex flex-col gap-1.5">
            {unavailableMembers.map((member) => (
              <li
                key={member.memberId}
                className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300"
              >
                <span className="font-medium">{member.memberName}</span>
                {member.reason && (
                  <span className="text-amber-600 dark:text-amber-400">
                    -- {member.reason}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
