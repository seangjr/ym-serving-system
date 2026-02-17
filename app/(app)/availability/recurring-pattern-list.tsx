"use client";

import { format, parseISO } from "date-fns";
import { CalendarClock, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteRecurringPattern } from "@/lib/availability/actions";
import type { RecurringPattern } from "@/lib/availability/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const NTH_LABELS = ["1st", "2nd", "3rd", "4th", "Last"];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function describePattern(pattern: RecurringPattern): string {
  const dayName = DAY_NAMES[pattern.dayOfWeek];
  switch (pattern.frequency) {
    case "weekly":
      return `Every ${dayName}`;
    case "biweekly":
      return `Every other ${dayName}`;
    case "monthly":
      return `${parseISO(pattern.startDate).getDate()}th of every month`;
    case "nth_weekday": {
      const nth =
        pattern.nthOccurrence !== null
          ? (NTH_LABELS[pattern.nthOccurrence - 1] ??
            `${pattern.nthOccurrence}th`)
          : "...";
      return `${nth} ${dayName} of every month`;
    }
    default:
      return "Unknown pattern";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RecurringPatternListProps {
  patterns: RecurringPattern[];
  targetMemberId: string;
}

export function RecurringPatternList({
  patterns,
  targetMemberId: _targetMemberId,
}: RecurringPatternListProps) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete(patternId: string) {
    startTransition(async () => {
      const result = await deleteRecurringPattern({ patternId });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Recurring pattern removed.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" />
          Regular Unavailability
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Days you&apos;re regularly unable to serve (e.g. work shifts, classes)
        </p>
      </CardHeader>
      <CardContent>
        {patterns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No regular unavailability set
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              e.g. &quot;Every Wednesday&quot; or &quot;Every other Sunday&quot;
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {patterns.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {describePattern(p)}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      From {format(parseISO(p.startDate), "MMM d, yyyy")}
                    </span>
                    <span>
                      {p.endDate
                        ? `until ${format(parseISO(p.endDate), "MMM d, yyyy")}`
                        : "Ongoing"}
                    </span>
                  </div>
                  {p.reason && (
                    <span className="text-xs text-muted-foreground">
                      {p.reason}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(p.id)}
                  disabled={isPending}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
