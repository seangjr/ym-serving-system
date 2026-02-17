"use client";

import { format as formatDate } from "date-fns";
import * as React from "react";
import type { DayButton } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvailabilityCalendarData {
  /** dateString (YYYY-MM-DD) -> reason or null */
  blackoutDates: Map<string, string | null>;
  /** dateString (YYYY-MM-DD) -> reason or null */
  recurringDates: Map<string, string | null>;
}

interface AvailabilityCalendarProps {
  data: AvailabilityCalendarData;
  month: Date;
  onMonthChange: (month: Date) => void;
  mode: "single" | "range";
  selected?: Date | undefined;
  rangeSelected?: { from: Date | undefined; to: Date | undefined };
  onDayClick?: (date: Date) => void;
  onRangeSelect?: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
}

// ---------------------------------------------------------------------------
// Context to pass availability data into custom DayButton
// ---------------------------------------------------------------------------

const AvailabilityCalendarContext =
  React.createContext<AvailabilityCalendarData>({
    blackoutDates: new Map(),
    recurringDates: new Map(),
  });

// ---------------------------------------------------------------------------
// Custom DayButton with availability visualization
// ---------------------------------------------------------------------------

function AvailabilityDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const { blackoutDates, recurringDates } = React.useContext(
    AvailabilityCalendarContext,
  );

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const dateKey = formatDate(day.date, "yyyy-MM-dd");
  const isBlackout = blackoutDates.has(dateKey);
  const isRecurring = !isBlackout && recurringDates.has(dateKey);
  const isPast = day.date < new Date(new Date().toDateString());

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={dateKey}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-0.5 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        isBlackout &&
          !modifiers.selected &&
          !modifiers.range_start &&
          !modifiers.range_end &&
          !modifiers.range_middle &&
          "bg-red-100 dark:bg-red-900/30",
        isRecurring &&
          !modifiers.selected &&
          !modifiers.range_start &&
          !modifiers.range_end &&
          !modifiers.range_middle &&
          "bg-amber-50 dark:bg-amber-900/20",
        isPast && "opacity-50",
        className,
      )}
      style={
        isRecurring &&
        !modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
          ? {
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(251, 146, 60, 0.15) 3px, rgba(251, 146, 60, 0.15) 6px)",
            }
          : undefined
      }
      {...props}
    >
      {props.children}
      {(isBlackout || isRecurring) && (
        <span className="flex items-center justify-center">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isBlackout && "bg-red-500",
              isRecurring && "bg-orange-400",
            )}
          />
        </span>
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// AvailabilityCalendar
// ---------------------------------------------------------------------------

export function AvailabilityCalendar({
  data,
  month,
  onMonthChange,
  mode,
  selected,
  rangeSelected,
  onDayClick,
  onRangeSelect,
}: AvailabilityCalendarProps) {
  const calendarClassNames = {
    root: "w-full",
    month: "flex flex-col w-full gap-4",
    table: "w-full border-collapse",
    weekdays: "flex",
    weekday:
      "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
    week: "flex w-full mt-2",
    day: "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <AvailabilityCalendarContext.Provider value={data}>
      {mode === "range" ? (
        <Calendar
          mode="range"
          month={month}
          onMonthChange={onMonthChange}
          selected={
            rangeSelected?.from
              ? { from: rangeSelected.from, to: rangeSelected.to }
              : undefined
          }
          onSelect={(range) => {
            onRangeSelect?.({
              from: range?.from,
              to: range?.to,
            });
          }}
          disabled={{ before: today }}
          className="w-full [--cell-size:--spacing(10)]"
          classNames={calendarClassNames}
          components={{
            DayButton: AvailabilityDayButton,
          }}
        />
      ) : (
        <Calendar
          mode="single"
          month={month}
          onMonthChange={onMonthChange}
          selected={selected}
          onSelect={(date) => {
            if (date) onDayClick?.(date);
          }}
          disabled={{ before: today }}
          className="w-full [--cell-size:--spacing(10)]"
          classNames={calendarClassNames}
          components={{
            DayButton: AvailabilityDayButton,
          }}
        />
      )}
    </AvailabilityCalendarContext.Provider>
  );
}
