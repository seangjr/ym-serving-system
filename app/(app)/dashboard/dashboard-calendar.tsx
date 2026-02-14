"use client";

import { useState } from "react";

import {
  type CalendarService,
  ServiceCalendar,
} from "@/components/services/service-calendar";

// ---------------------------------------------------------------------------
// Client wrapper for ServiceCalendar with month state
// ---------------------------------------------------------------------------

interface DashboardCalendarProps {
  services: CalendarService[];
}

export function DashboardCalendar({ services }: DashboardCalendarProps) {
  const [month, setMonth] = useState(() => new Date());

  return (
    <ServiceCalendar
      services={services}
      month={month}
      onMonthChange={setMonth}
    />
  );
}
