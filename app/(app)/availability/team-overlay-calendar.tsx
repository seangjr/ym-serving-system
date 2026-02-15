"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import * as React from "react";
import type { DayButton } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchTeamAvailability } from "@/lib/availability/actions";
import type { TeamDateAvailability } from "@/lib/availability/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamOverlayCalendarProps {
  teams: { id: string; name: string }[];
  initialTeamId: string;
}

// ---------------------------------------------------------------------------
// Context for passing availability data into DayButton
// ---------------------------------------------------------------------------

const TeamOverlayContext = React.createContext<
  Map<string, TeamDateAvailability>
>(new Map());

// ---------------------------------------------------------------------------
// Custom DayButton showing availability counts
// ---------------------------------------------------------------------------

function TeamOverlayDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const availabilityMap = React.useContext(TeamOverlayContext);

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const dateKey = day.date.toISOString().slice(0, 10);
  const dayData = availabilityMap.get(dateKey);

  let bgClass = "";
  if (dayData) {
    const ratio = dayData.available / dayData.total;
    if (ratio >= 1) {
      bgClass = "bg-green-50 dark:bg-green-900/20";
    } else if (ratio >= 0.5) {
      bgClass = "bg-amber-50 dark:bg-amber-900/20";
    } else {
      bgClass = "bg-red-50 dark:bg-red-900/20";
    }
  }

  const buttonContent = (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={dateKey}
      className={cn(
        "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        bgClass,
        className,
      )}
      {...props}
    >
      {props.children}
      {dayData && (
        <span
          className={cn(
            "text-[10px] font-medium leading-tight",
            dayData.available === dayData.total &&
              "text-green-600 dark:text-green-400",
            dayData.available < dayData.total &&
              dayData.available >= dayData.total * 0.5 &&
              "text-amber-600 dark:text-amber-400",
            dayData.available < dayData.total * 0.5 &&
              "text-red-600 dark:text-red-400",
          )}
        >
          {dayData.available}/{dayData.total}
        </span>
      )}
    </Button>
  );

  if (dayData && dayData.unavailableMembers.length > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-48">
          <p className="font-medium mb-1">Unavailable:</p>
          {dayData.unavailableMembers.map((m) => (
            <p key={m.memberId} className="text-xs">
              {m.memberName}
              {m.reason ? ` - ${m.reason}` : ""}
            </p>
          ))}
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
}

// ---------------------------------------------------------------------------
// TeamOverlayCalendar
// ---------------------------------------------------------------------------

export function TeamOverlayCalendar({
  teams,
  initialTeamId,
}: TeamOverlayCalendarProps) {
  const [teamId, setTeamId] = React.useState(initialTeamId);
  const [month, setMonth] = React.useState(startOfMonth(new Date()));
  const [availabilityMap, setAvailabilityMap] = React.useState<
    Map<string, TeamDateAvailability>
  >(new Map());
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch availability data when team or month changes
  React.useEffect(() => {
    if (!teamId) return;

    setIsLoading(true);
    const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");

    fetchTeamAvailability(teamId, monthStart, monthEnd)
      .then((data) => {
        const map = new Map<string, TeamDateAvailability>();
        for (const d of data) {
          map.set(d.date, d);
        }
        setAvailabilityMap(map);
      })
      .finally(() => setIsLoading(false));
  }, [teamId, month]);

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
        <p className="text-sm text-muted-foreground">
          No teams available for overview.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        {/* Team selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Team:
          </span>
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-48">
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoading && (
            <span className="text-xs text-muted-foreground">Loading...</span>
          )}
        </div>

        {/* Calendar */}
        <TeamOverlayContext.Provider value={availabilityMap}>
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            className="w-full [--cell-size:--spacing(10)]"
            classNames={{
              root: "w-full",
              month: "flex flex-col w-full gap-4",
              table: "w-full border-collapse",
              weekdays: "flex",
              weekday:
                "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
              week: "flex w-full mt-2",
              day: "relative w-full h-full p-0 text-center group/day aspect-square select-none",
            }}
            components={{
              DayButton: TeamOverlayDayButton,
            }}
          />
        </TeamOverlayContext.Provider>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded bg-green-100 dark:bg-green-900/30 border" />
            All available
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded bg-amber-100 dark:bg-amber-900/30 border" />
            Some unavailable
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded bg-red-100 dark:bg-red-900/30 border" />
            {"50%+ unavailable"}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
