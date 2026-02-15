"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { CalendarX2, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addBlackoutDate,
  addBlackoutRange,
  deleteBlackout,
} from "@/lib/availability/actions";
import { expandRecurringPatterns } from "@/lib/availability/recurrence";
import type { BlackoutDate, RecurringPattern } from "@/lib/availability/types";
import {
  AvailabilityCalendar,
  type AvailabilityCalendarData,
} from "./availability-calendar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlackoutManagerProps {
  blackouts: BlackoutDate[];
  recurringPatterns: RecurringPattern[];
  targetMemberId: string;
  isManagingOther: boolean;
}

type Mode = "view" | "single" | "range";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCalendarData(
  blackouts: BlackoutDate[],
  recurringPatterns: RecurringPattern[],
  month: Date,
): AvailabilityCalendarData {
  const blackoutDates = new Map<string, string | null>();
  const recurringDates = new Map<string, string | null>();

  // Expand blackout date ranges into individual dates
  for (const b of blackouts) {
    const start = parseISO(b.startDate);
    const end = parseISO(b.endDate);
    const days = eachDayOfInterval({ start, end });
    for (const d of days) {
      blackoutDates.set(format(d, "yyyy-MM-dd"), b.reason);
    }
  }

  // Expand recurring patterns for the visible month
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const dbPatterns = recurringPatterns.map((p) => ({
    member_id: p.memberId,
    frequency: p.frequency,
    day_of_week: p.dayOfWeek,
    nth_occurrence: p.nthOccurrence,
    start_date: p.startDate,
    end_date: p.endDate,
  }));
  const expanded = expandRecurringPatterns(dbPatterns, monthStart, monthEnd);

  for (const [dateKey, _memberIds] of expanded) {
    // Find matching pattern for reason
    const matchingPattern = recurringPatterns.find((p) => {
      const startDate = parseISO(p.startDate);
      const dateObj = parseISO(dateKey);
      return (
        dateObj >= startDate && (!p.endDate || dateObj <= parseISO(p.endDate))
      );
    });
    recurringDates.set(dateKey, matchingPattern?.reason ?? null);
  }

  return { blackoutDates, recurringDates };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlackoutManager({
  blackouts,
  recurringPatterns,
  targetMemberId,
  isManagingOther: _isManagingOther,
}: BlackoutManagerProps) {
  const [mode, setMode] = React.useState<Mode>("view");
  const [month, setMonth] = React.useState(startOfMonth(new Date()));
  const [reason, setReason] = React.useState("");
  const [rangeSelected, setRangeSelected] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isPending, startTransition] = React.useTransition();

  const calendarData = React.useMemo(
    () => buildCalendarData(blackouts, recurringPatterns, month),
    [blackouts, recurringPatterns, month],
  );

  // Future blackouts only for the list below calendar
  const futureBlackouts = blackouts.filter(
    (b) => parseISO(b.endDate) >= new Date(new Date().toDateString()),
  );

  function handleSingleClick(date: Date) {
    if (mode !== "single") return;
    startTransition(async () => {
      const dateStr = format(date, "yyyy-MM-dd");
      const result = await addBlackoutDate({
        memberId: targetMemberId,
        startDate: dateStr,
        reason: reason || undefined,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Blackout date added: ${format(date, "MMM d, yyyy")}`);
        setReason("");
      }
    });
  }

  function handleRangeSubmit() {
    const from = rangeSelected.from;
    const to = rangeSelected.to;
    if (!from || !to) {
      toast.error("Please select both start and end dates.");
      return;
    }
    startTransition(async () => {
      const result = await addBlackoutRange({
        memberId: targetMemberId,
        startDate: format(from, "yyyy-MM-dd"),
        endDate: format(to, "yyyy-MM-dd"),
        reason: reason || undefined,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(
          `Blackout range added: ${format(from, "MMM d")} - ${format(to, "MMM d, yyyy")}`,
        );
        setReason("");
        setRangeSelected({ from: undefined, to: undefined });
      }
    });
  }

  function handleDelete(blackoutId: string) {
    startTransition(async () => {
      const result = await deleteBlackout({ blackoutId });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Blackout date removed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center rounded-lg border p-0.5">
          <Button
            variant={mode === "view" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("view")}
            className="h-7 px-3 text-xs"
          >
            View
          </Button>
          <Button
            variant={mode === "single" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setMode("single");
              setRangeSelected({ from: undefined, to: undefined });
            }}
            className="h-7 px-3 text-xs"
          >
            Add Date
          </Button>
          <Button
            variant={mode === "range" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("range")}
            className="h-7 px-3 text-xs"
          >
            Add Range
          </Button>
        </div>
        {isPending && (
          <span className="text-xs text-muted-foreground">Saving...</span>
        )}
      </div>

      {/* Reason input (shown in single or range mode) */}
      {(mode === "single" || mode === "range") && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-8 text-sm"
          />
          {mode === "range" && rangeSelected.from && rangeSelected.to && (
            <Button
              size="sm"
              onClick={handleRangeSubmit}
              disabled={isPending}
              className="h-8 whitespace-nowrap"
            >
              Add Range
            </Button>
          )}
        </div>
      )}

      {/* Calendar */}
      <AvailabilityCalendar
        data={calendarData}
        month={month}
        onMonthChange={setMonth}
        mode={mode === "range" ? "range" : "single"}
        rangeSelected={mode === "range" ? rangeSelected : undefined}
        onRangeSelect={mode === "range" ? setRangeSelected : undefined}
        onDayClick={mode === "single" ? handleSingleClick : undefined}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-red-500" />
          Blackout
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-orange-400" />
          Recurring
        </div>
      </div>

      {/* Blackout list */}
      {futureBlackouts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium flex items-center gap-1.5">
            <CalendarX2 className="size-3.5" />
            Upcoming Blackout Dates
          </h3>
          <div className="flex flex-col gap-1">
            {futureBlackouts.map((b) => {
              const isSingleDay = b.startDate === b.endDate;
              const dateDisplay = isSingleDay
                ? format(parseISO(b.startDate), "MMM d, yyyy")
                : `${format(parseISO(b.startDate), "MMM d")} - ${format(parseISO(b.endDate), "MMM d, yyyy")}`;
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
        </div>
      )}
    </div>
  );
}
