import { format, parseISO } from "date-fns";
import { ArrowLeft, Clock, FileText, Music } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { getServiceById, getServiceTypes } from "@/lib/services/queries";
import { createClient } from "@/lib/supabase/server";
import { ServiceDetailActions } from "./service-detail-actions";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  const supabase = await createClient();
  const [{ role }, service, serviceTypes] = await Promise.all([
    getUserRole(supabase),
    getServiceById(serviceId),
    getServiceTypes(),
  ]);

  if (!service) notFound();

  const canManage = isAdminOrCommittee(role);

  const formattedDate = format(
    parseISO(service.service_date),
    "EEEE, MMMM d, yyyy",
  );
  const timeDisplay = service.end_time
    ? `${service.start_time} - ${service.end_time}`
    : service.start_time;

  const serviceTypesList = serviceTypes.map((t) => ({
    id: t.id,
    name: t.name,
    label: t.label,
    color: t.color,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Link>

      {/* Header: title + action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{service.title}</h1>
            {service.is_cancelled && (
              <Badge variant="destructive">Cancelled</Badge>
            )}
            {service.service_types && (
              <Badge
                style={{
                  backgroundColor: `${service.service_types.color}20`,
                  color: service.service_types.color,
                  borderColor: `${service.service_types.color}40`,
                }}
              >
                {service.service_types.label}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">{formattedDate}</p>
        </div>
        {canManage && (
          <ServiceDetailActions
            service={{
              id: service.id,
              title: service.title,
              serviceDate: service.service_date,
              startTime: service.start_time,
              endTime: service.end_time ?? undefined,
              durationMinutes: service.duration_minutes ?? undefined,
              serviceTypeId: service.service_type_id ?? undefined,
              rehearsalDate: service.rehearsal_date ?? undefined,
              rehearsalTime: service.rehearsal_time ?? undefined,
              rehearsalNotes: service.rehearsal_notes ?? undefined,
              notes: service.notes ?? undefined,
              isCancelled: service.is_cancelled,
            }}
            serviceTypes={serviceTypesList}
          />
        )}
      </div>

      {/* Service info grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Date
                </dt>
                <dd className="text-sm">{formattedDate}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Time
                </dt>
                <dd className="text-sm">{timeDisplay}</dd>
              </div>
              {service.duration_minutes && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Duration
                  </dt>
                  <dd className="text-sm">
                    {service.duration_minutes} minutes
                  </dd>
                </div>
              )}
              {service.service_types && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Type
                  </dt>
                  <dd className="flex items-center gap-2 text-sm">
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor: service.service_types.color,
                      }}
                    />
                    {service.service_types.label}
                  </dd>
                </div>
              )}
              {service.notes && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Notes
                  </dt>
                  <dd className="text-sm whitespace-pre-wrap">
                    {service.notes}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Rehearsal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="size-4" />
              Rehearsal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {service.rehearsal_date ? (
              <dl className="flex flex-col gap-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Date
                  </dt>
                  <dd className="text-sm">
                    {format(
                      parseISO(service.rehearsal_date),
                      "EEEE, MMMM d, yyyy",
                    )}
                  </dd>
                </div>
                {service.rehearsal_time && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">
                      Time
                    </dt>
                    <dd className="text-sm">{service.rehearsal_time}</dd>
                  </div>
                )}
                {service.rehearsal_notes && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">
                      Notes
                    </dt>
                    <dd className="text-sm whitespace-pre-wrap">
                      {service.rehearsal_notes}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="flex items-center justify-center rounded-lg border border-dashed p-6">
                <p className="text-sm text-muted-foreground">
                  No rehearsal scheduled
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignments placeholder for Phase 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
            <p className="text-sm text-muted-foreground">
              Team assignments will be available after Phase 4 (Scheduling &
              Assignments).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
