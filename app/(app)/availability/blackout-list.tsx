"use client";

import { format, parseISO } from "date-fns";
import { CalendarX2, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteBlackout } from "@/lib/availability/actions";
import type { BlackoutDate } from "@/lib/availability/types";

interface BlackoutListProps {
  blackouts: BlackoutDate[];
}

export function BlackoutList({ blackouts }: BlackoutListProps) {
  const [isPending, startTransition] = React.useTransition();

  const futureBlackouts = blackouts.filter(
    (b) => parseISO(b.endDate) >= new Date(new Date().toDateString()),
  );

  function handleDelete(blackoutId: string) {
    startTransition(async () => {
      const result = await deleteBlackout({ blackoutId });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Blackout removed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium flex items-center gap-1.5">
        <CalendarX2 className="size-3.5" />
        Blocked Dates
      </h3>
      {futureBlackouts.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          No upcoming blackout dates
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {futureBlackouts.map((b) => {
            const isSingleDay = b.startDate === b.endDate;
            const dateDisplay = isSingleDay
              ? format(parseISO(b.startDate), "MMM d, yyyy")
              : `${format(parseISO(b.startDate), "MMM d")} – ${format(parseISO(b.endDate), "MMM d, yyyy")}`;
            return (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{dateDisplay}</span>
                  {b.reason && (
                    <span className="text-xs text-muted-foreground">
                      {b.reason}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(b.id)}
                  disabled={isPending}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
