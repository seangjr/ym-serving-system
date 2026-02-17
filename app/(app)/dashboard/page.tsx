import type { CalendarService } from "@/components/services/service-calendar";
import { ServiceList } from "@/components/services/service-list";
import { ServiceStats } from "@/components/services/service-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserRole, isAdmin, isAdminOrCommittee } from "@/lib/auth/roles";
import {
  getAllServiceTypes,
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

  const isAdminUser = isAdmin(role);

  const [monthServices, upcoming, stats, serviceTypes, allServiceTypes] =
    await Promise.all([
      getServicesByMonth(currentYear, currentMonth),
      getUpcomingServices(10),
      getServiceStats(),
      getServiceTypes(),
      isAdminUser ? getAllServiceTypes() : Promise.resolve([]),
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
    startTime: s.start_time.slice(0, 5),
    endTime: s.end_time?.slice(0, 5) ?? undefined,
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
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        {isAdminOrCommittee(role) && (
          <DashboardActions
            serviceTypes={serviceTypesList}
            allServiceTypes={allServiceTypes.map((t) => ({
              id: t.id,
              name: t.name,
              label: t.label,
              color: t.color,
              sortOrder: t.sort_order,
              isActive: t.is_active,
            }))}
            isAdmin={isAdminUser}
          />
        )}
      </div>

      {/* Stats cards */}
      <ServiceStats stats={stats} />

      {/* Main content: Calendar + Upcoming list */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* Calendar: 3 of 5 cols on desktop */}
        <div className="lg:col-span-3">
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <DashboardCalendar services={calendarServices} />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming list: 2 of 5 cols on desktop */}
        <div className="lg:col-span-2">
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm">Upcoming Services</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
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
