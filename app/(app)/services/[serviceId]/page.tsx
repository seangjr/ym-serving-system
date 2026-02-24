import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  ArrowLeftRight,
  FileText,
  Music,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SwapApprovalList } from "@/components/assignments/swap-approval-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getEligibleMembers,
  getServiceAssignments,
  getTeamsForAssignment,
  getUnavailableMembersForService,
} from "@/lib/assignments/queries";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { getSwapRequestsForService } from "@/lib/notifications/queries";
import { getServiceById, getServiceTypes } from "@/lib/services/queries";
import { getSetlistForService, getSongs } from "@/lib/songs/queries";
import { createClient } from "@/lib/supabase/server";
import { AssignmentPanel } from "./assignment-panel";
import { AvailabilityBanner } from "./availability-banner";
import { PositionAdder } from "./position-adder";
import { ServiceDetailActions } from "./service-detail-actions";
import { ServiceTabs } from "./service-tabs";
import { SetlistPanel } from "./setlist-panel";

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
  const [
    { role, memberId },
    service,
    serviceTypes,
    assignmentGroups,
    allTeams,
    unavailableMembers,
    pendingSwapRequests,
    setlistItems,
    allSongs,
  ] = await Promise.all([
    getUserRole(supabase),
    getServiceById(serviceId),
    getServiceTypes(),
    getServiceAssignments(serviceId),
    getTeamsForAssignment(),
    getUnavailableMembersForService(serviceId),
    getSwapRequestsForService(serviceId),
    getSetlistForService(serviceId),
    getSongs(),
  ]);

  if (!service) notFound();

  const canManage = isAdminOrCommittee(role);

  // Determine if user can see swap approvals (admin, committee, or team lead)
  let canApproveSwaps = canManage;
  if (!canApproveSwaps && memberId) {
    // Check if user is a team lead for any team in this service
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const teamIds = [...new Set(assignmentGroups.map((g) => g.teamId))];
    if (teamIds.length > 0) {
      const { data: leadCheck } = await admin
        .from("team_members")
        .select("team_id")
        .eq("member_id", memberId)
        .eq("role", "lead")
        .in("team_id", teamIds)
        .limit(1);
      canApproveSwaps = (leadCheck?.length ?? 0) > 0;
    }
  }

  // Fetch eligible members (with conflict info) for each team that has positions
  const teamIdsWithPositions = [
    ...new Set(assignmentGroups.map((g) => g.teamId)),
  ];
  const eligibleMembersEntries = await Promise.all(
    teamIdsWithPositions.map(async (teamId) => {
      const members = await getEligibleMembers(teamId, serviceId);
      return [teamId, members] as const;
    }),
  );
  const eligibleMembersMap = Object.fromEntries(eligibleMembersEntries);

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

  // ---------------------------------------------------------------------------
  // Tab content: Assignments
  // ---------------------------------------------------------------------------

  const assignmentsContent = (
    <div className="flex flex-col gap-4">
      {/* Availability banner */}
      <AvailabilityBanner unavailableMembers={unavailableMembers} />

      {/* Pending swap requests (visible to admin/committee/team lead) */}
      {canApproveSwaps && pendingSwapRequests.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ArrowLeftRight className="size-5" />
            Pending Swap Requests
            <Badge variant="secondary" className="ml-1">
              {pendingSwapRequests.length}
            </Badge>
          </h2>
          <SwapApprovalList swapRequests={pendingSwapRequests} />
        </div>
      )}

      {/* Assignment panel */}
      <div className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="size-5" />
          Assignments
        </h2>

        <AssignmentPanel
          teams={assignmentGroups}
          serviceId={serviceId}
          serviceDate={service.service_date}
          startTime={service.start_time}
          endTime={service.end_time}
          durationMinutes={service.duration_minutes}
          canManage={canManage}
          allTeams={allTeams}
          eligibleMembersMap={eligibleMembersMap}
        />

        {canManage && <PositionAdder serviceId={serviceId} teams={allTeams} />}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Tab content: Setlist
  // ---------------------------------------------------------------------------

  const setlistContent = (
    <SetlistPanel
      items={setlistItems}
      allSongs={allSongs}
      serviceId={serviceId}
      canManage={canManage}
    />
  );

  // ---------------------------------------------------------------------------
  // Tab content: Details
  // ---------------------------------------------------------------------------

  const detailsContent = (
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
                <dd className="text-sm">{service.duration_minutes} minutes</dd>
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
                <dd className="text-sm whitespace-pre-wrap">{service.notes}</dd>
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
  );

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
              startTime: service.start_time.slice(0, 5),
              endTime: service.end_time?.slice(0, 5) ?? undefined,
              durationMinutes: service.duration_minutes ?? undefined,
              serviceTypeId: service.service_type_id ?? undefined,
              rehearsalDate: service.rehearsal_date ?? undefined,
              rehearsalTime: service.rehearsal_time?.slice(0, 5) ?? undefined,
              rehearsalNotes: service.rehearsal_notes ?? undefined,
              notes: service.notes ?? undefined,
              isCancelled: service.is_cancelled,
            }}
            serviceTypes={serviceTypesList}
            teams={allTeams.map((t) => ({ id: t.id, name: t.name }))}
            hasExistingPositions={teamIdsWithPositions.length > 0}
          />
        )}
      </div>

      {/* Tabbed content */}
      <ServiceTabs
        assignmentsContent={assignmentsContent}
        setlistContent={setlistContent}
        detailsContent={detailsContent}
      />
    </div>
  );
}
