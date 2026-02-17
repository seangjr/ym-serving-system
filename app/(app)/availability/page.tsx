import { redirect } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import {
  getManageableMembers,
  getMyBlackouts,
  getMyRecurringPatterns,
  getTeamsForOverlay,
} from "@/lib/availability/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BlackoutList } from "./blackout-list";
import { BlackoutManager } from "./blackout-manager";
import { MemberSelector } from "./member-selector";
import { RecurringPatternDialog } from "./recurring-pattern-dialog";
import { RecurringPatternList } from "./recurring-pattern-list";
import { TeamOverlayCalendar } from "./team-overlay-calendar";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const { member: memberParam } = await searchParams;

  const supabase = await createClient();
  const { role, memberId: callerId } = await getUserRole(supabase);

  if (!callerId) redirect("/login");

  // Determine target member
  let targetMemberId = callerId;
  let isManagingOther = false;

  if (memberParam && memberParam !== callerId) {
    // Verify authorization
    if (isAdminOrCommittee(role)) {
      targetMemberId = memberParam;
      isManagingOther = true;
    } else {
      // Check team lead access
      const admin = createAdminClient();
      const { data: leaderTeams } = await admin
        .from("team_members")
        .select("team_id")
        .eq("member_id", callerId)
        .eq("role", "lead");

      if (leaderTeams && leaderTeams.length > 0) {
        const leaderTeamIds = leaderTeams.map((t) => t.team_id);
        const { data: sharedTeam } = await admin
          .from("team_members")
          .select("team_id")
          .eq("member_id", memberParam)
          .in("team_id", leaderTeamIds)
          .limit(1);

        if (sharedTeam && sharedTeam.length > 0) {
          targetMemberId = memberParam;
          isManagingOther = true;
        }
      }
    }
  }

  // Check if user is a team lead (admin/committee or leads any team)
  let isTeamLead = isAdminOrCommittee(role);
  if (!isTeamLead) {
    const admin = createAdminClient();
    const { data: leaderTeams } = await admin
      .from("team_members")
      .select("team_id")
      .eq("member_id", callerId)
      .eq("role", "lead")
      .limit(1);
    isTeamLead = !!leaderTeams && leaderTeams.length > 0;
  }

  // Fetch data in parallel
  const dataPromises: [
    Promise<Awaited<ReturnType<typeof getMyBlackouts>>>,
    Promise<Awaited<ReturnType<typeof getMyRecurringPatterns>>>,
    Promise<{ id: string; fullName: string }[]>,
    Promise<{ id: string; name: string }[]>,
  ] = [
    getMyBlackouts(targetMemberId),
    getMyRecurringPatterns(targetMemberId),
    isTeamLead ? getManageableMembers(callerId, role) : Promise.resolve([]),
    isTeamLead ? getTeamsForOverlay(callerId, role) : Promise.resolve([]),
  ];

  const [blackouts, recurringPatterns, manageableMembers, teams] =
    await Promise.all(dataPromises);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Availability</h1>
        <p className="text-sm text-muted-foreground">
          Manage your blackout dates and recurring unavailability
        </p>
      </div>

      <Tabs defaultValue="my-availability">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="my-availability">My Availability</TabsTrigger>
            {isTeamLead && (
              <TabsTrigger value="team-overview">Team Overview</TabsTrigger>
            )}
          </TabsList>
          {isTeamLead && (
            <MemberSelector
              members={manageableMembers}
              currentMemberId={targetMemberId}
              ownMemberId={callerId}
            />
          )}
        </div>

        <TabsContent value="my-availability" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <BlackoutManager
                blackouts={blackouts}
                recurringPatterns={recurringPatterns}
                targetMemberId={targetMemberId}
                isManagingOther={isManagingOther}
              />
            </div>
            <div className="flex flex-col gap-6">
              <BlackoutList blackouts={blackouts} />
              <RecurringPatternList
                patterns={recurringPatterns}
                targetMemberId={targetMemberId}
              />
              <RecurringPatternDialog targetMemberId={targetMemberId} />
            </div>
          </div>
        </TabsContent>

        {isTeamLead && (
          <TabsContent value="team-overview" className="mt-4">
            <TeamOverlayCalendar
              teams={teams}
              initialTeamId={teams[0]?.id ?? ""}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
