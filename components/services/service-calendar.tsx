"use client";

import { isSameDay, parseISO } from "date-fns";
import * as React from "react";
import type { DayButton } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarService {
  id: string;
  serviceDate: string; // YYYY-MM-DD
  title: string;
  color: string; // hex from service_types
  typeLabel: string;
}

interface ServiceCalendarProps {
  services: CalendarService[];
  month: Date;
  onMonthChange: (month: Date) => void;
  onDayClick?: (date: Date) => void;
}

// ---------------------------------------------------------------------------
// Context to pass services into custom DayButton
// ---------------------------------------------------------------------------

const ServiceCalendarContext = React.createContext<CalendarService[]>([]);

// ---------------------------------------------------------------------------
// Custom DayButton with colored service dots
// ---------------------------------------------------------------------------

function ServiceDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const services = React.useContext(ServiceCalendarContext);

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  // Find services matching this day
  const dayServices = services.filter((s) =>
    isSameDay(parseISO(s.serviceDate), day.date),
  );
  const dotsToShow = dayServices.slice(0, 3);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toISOString().slice(0, 10)}
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
        className,
      )}
      {...props}
    >
      {props.children}
      {dotsToShow.length > 0 && (
        <span className="flex items-center justify-center gap-1">
          {dotsToShow.map((s) => (
            <span
              key={s.id}
              className="size-2 rounded-full ring-1 ring-white/50"
              style={{ backgroundColor: s.color }}
            />
          ))}
        </span>
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// ServiceCalendar
// ---------------------------------------------------------------------------

export function ServiceCalendar({
  services,
  month,
  onMonthChange,
  onDayClick,
}: ServiceCalendarProps) {
  return (
    <ServiceCalendarContext.Provider value={services}>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        className="w-full [--cell-size:--spacing(10)]"
        classNames={{
          root: "w-full",
          month: "flex flex-col w-full gap-4",
          table: "w-full border-collapse",
          weekdays: "flex",
          weekday:
            "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
          week: "flex w-full mt-2",
          day: "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
        }}
        components={{
          DayButton: ServiceDayButton,
        }}
        onDayClick={(date) => {
          if (!onDayClick) return;
          const hasServices = services.some((s) =>
            isSameDay(parseISO(s.serviceDate), date),
          );
          if (hasServices) {
            onDayClick(date);
          }
        }}
      />
    </ServiceCalendarContext.Provider>
  );
}
