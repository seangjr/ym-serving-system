import type { CalendarService } from "@/components/services/service-calendar";
import { ServiceList } from "@/components/services/service-list";
import { ServiceStats } from "@/components/services/service-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import {
  getServiceStats,
  getServicesByMonth,
  getServiceTypes,
  getUpcomingServices,
} from "@/lib/services/queries";
import { createClient } from "@/lib/supabase/server";
import { DashboardActions } from "./dashboard-actions";
import { DashboardCalendar } from "./dashboard-calendar";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed for query

  const [monthServices, upcoming, stats, serviceTypes] = await Promise.all([
    getServicesByMonth(currentYear, currentMonth),
    getUpcomingServices(10),
    getServiceStats(),
    getServiceTypes(),
  ]);

  // Transform services for calendar display
  const calendarServices: CalendarService[] = monthServices.map((s) => ({
    id: s.id,
    serviceDate: s.service_date,
    title: s.title,
    color: s.service_types?.color ?? "#6b7280",
    typeLabel: s.service_types?.label ?? "Service",
  }));

  // Transform upcoming services for list display
  const upcomingList = upcoming.map((s) => ({
    id: s.id,
    title: s.title,
    serviceDate: s.service_date,
    startTime: s.start_time,
    endTime: s.end_time ?? undefined,
    serviceType: s.service_types
      ? {
          id: s.service_types.id,
          name: s.service_types.name,
          label: s.service_types.label,
          color: s.service_types.color,
        }
      : undefined,
    isCancelled: s.is_cancelled,
  }));

  const serviceTypesList = serviceTypes.map((t) => ({
    id: t.id,
    name: t.name,
    label: t.label,
    color: t.color,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage upcoming services and team assignments
          </p>
        </div>
        {isAdminOrCommittee(role) && (
          <DashboardActions serviceTypes={serviceTypesList} />
        )}
      </div>

      {/* Stats cards */}
      <ServiceStats stats={stats} />

      {/* Main content: Calendar + Upcoming list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Calendar: 3 of 5 cols on desktop */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardCalendar services={calendarServices} />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming list: 2 of 5 cols on desktop */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Services</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceList
                services={upcomingList}
                userRole={role}
                serviceTypes={serviceTypesList}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
