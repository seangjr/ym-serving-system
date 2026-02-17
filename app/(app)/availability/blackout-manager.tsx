"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { X } from "lucide-react";
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

// What the user has selected but not yet confirmed
type PendingSelection =
  | { type: "single"; date: Date }
  | { type: "range"; from: Date; to: Date }
  | { type: "remove"; blackout: BlackoutDate };

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
  const [isRangeMode, setIsRangeMode] = React.useState(false);
  const [month, setMonth] = React.useState(startOfMonth(new Date()));
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState<PendingSelection | null>(null);
  const [rangeSelected, setRangeSelected] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isPending, startTransition] = React.useTransition();

  const calendarData = React.useMemo(
    () => buildCalendarData(blackouts, recurringPatterns, month),
    [blackouts, recurringPatterns, month],
  );

  // Check if a clicked date is already a blackout (for toggle-to-delete)
  function findBlackoutForDate(date: Date): BlackoutDate | undefined {
    const dateStr = format(date, "yyyy-MM-dd");
    return blackouts.find((b) => {
      const start = parseISO(b.startDate);
      const end = parseISO(b.endDate);
      const d = parseISO(dateStr);
      return d >= start && d <= end;
    });
  }

  // Single date click: show confirmation strip for add or remove
  function handleDayClick(date: Date) {
    const existing = findBlackoutForDate(date);
    if (existing) {
      setPending({ type: "remove", blackout: existing });
      setReason("");
      return;
    }
    setPending({ type: "single", date });
    setReason("");
  }

  // Range selection completed
  function handleRangeSelect(range: {
    from: Date | undefined;
    to: Date | undefined;
  }) {
    setRangeSelected(range);
    if (range.from && range.to) {
      setPending({ type: "range", from: range.from, to: range.to });
      setReason("");
    } else {
      setPending(null);
    }
  }

  // Confirm the pending selection
  function handleConfirm() {
    if (!pending) return;

    startTransition(async () => {
      if (pending.type === "remove") {
        const result = await deleteBlackout({ blackoutId: pending.blackout.id });
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success("Blackout removed.");
        }
      } else if (pending.type === "single") {
        const dateStr = format(pending.date, "yyyy-MM-dd");
        const result = await addBlackoutDate({
          memberId: targetMemberId,
          startDate: dateStr,
          reason: reason || undefined,
        });
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success(
            `Blocked: ${format(pending.date, "MMM d, yyyy")}`,
          );
        }
      } else {
        const result = await addBlackoutRange({
          memberId: targetMemberId,
          startDate: format(pending.from, "yyyy-MM-dd"),
          endDate: format(pending.to, "yyyy-MM-dd"),
          reason: reason || undefined,
        });
        if ("error" in result) {
          toast.error(result.error);
        } else {
          toast.success(
            `Blocked: ${format(pending.from, "MMM d")} - ${format(pending.to, "MMM d, yyyy")}`,
          );
        }
      }
      setPending(null);
      setReason("");
      setRangeSelected({ from: undefined, to: undefined });
      setIsRangeMode(false);
    });
  }

  function handleCancel() {
    setPending(null);
    setReason("");
    setRangeSelected({ from: undefined, to: undefined });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Instructions + range toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isRangeMode
            ? "Select a start and end date on the calendar"
            : "Tap a date to block it. Tap a blocked date to remove it."}
        </p>
        <Button
          variant={isRangeMode ? "secondary" : "outline"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => {
            setIsRangeMode(!isRangeMode);
            setPending(null);
            setReason("");
            setRangeSelected({ from: undefined, to: undefined });
          }}
        >
          {isRangeMode ? "Single Date" : "Select Range"}
        </Button>
      </div>

      {/* Calendar — always interactive */}
      <AvailabilityCalendar
        data={calendarData}
        month={month}
        onMonthChange={setMonth}
        mode={isRangeMode ? "range" : "single"}
        rangeSelected={isRangeMode ? rangeSelected : undefined}
        onRangeSelect={isRangeMode ? handleRangeSelect : undefined}
        onDayClick={!isRangeMode ? handleDayClick : undefined}
      />

      {/* Confirmation strip — appears after date selection */}
      {pending && pending.type === "remove" && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-col">
            <p className="text-sm font-medium">
              Remove blackout: {pending.blackout.startDate === pending.blackout.endDate
                ? format(parseISO(pending.blackout.startDate), "EEEE, MMM d, yyyy")
                : `${format(parseISO(pending.blackout.startDate), "MMM d")} — ${format(parseISO(pending.blackout.endDate), "MMM d, yyyy")}`}
            </p>
            {pending.blackout.reason && (
              <p className="text-xs text-muted-foreground">{pending.blackout.reason}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              disabled={isPending}
              className="h-7"
            >
              {isPending ? "Removing..." : "Remove"}
            </Button>
          </div>
        </div>
      )}
      {pending && pending.type !== "remove" && (
        <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {pending.type === "single"
                ? `Block ${format(pending.date, "EEEE, MMM d, yyyy")}`
                : `Block ${format(pending.from, "MMM d")} — ${format(pending.to, "MMM d, yyyy")}`}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={handleCancel}
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
            />
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isPending}
              className="h-8 whitespace-nowrap"
            >
              {isPending ? "Saving..." : "Block"}
            </Button>
          </div>
        </div>
      )}

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

    </div>
  );
}
