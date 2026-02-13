import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MemberAssignment } from "@/components/teams/member-assignment";
import { PositionManager } from "@/components/teams/position-manager";
import { TeamFormDialog } from "@/components/teams/team-form-dialog";
import { TeamMemberList } from "@/components/teams/team-member-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isAdminOrCommittee as checkAdminOrCommittee,
  getUserRole,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getTeamDetail } from "@/lib/teams/queries";

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { role, memberId: callerMemberId } = await getUserRole(supabase);

  // Fetch team data
  const team = await getTeamDetail(teamId);

  if (!team) {
    notFound();
  }

  // Check authorization: admin/committee OR team lead
  const isCallerAdminOrCommittee = checkAdminOrCommittee(role);
  const isCallerTeamLead = team.members.some(
    (m) => m.member_id === callerMemberId && m.role === "lead",
  );

  if (!isCallerAdminOrCommittee && !isCallerTeamLead) {
    redirect("/");
  }

  const existingMemberIds = team.members.map((m) => m.member_id);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href="/teams">
              <ArrowLeft className="size-4" />
              Back to Teams
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Color dot */}
            <div
              className="size-4 rounded-full shrink-0"
              style={{ backgroundColor: team.color ?? "#6b7280" }}
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
              {team.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {team.description}
                </p>
              )}
            </div>
          </div>

          {isCallerAdminOrCommittee && (
            <TeamFormDialog
              mode="edit"
              team={team}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Main content: Positions + Members */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Positions */}
        <PositionManager
          teamId={team.id}
          positions={team.positions}
          userRole={role}
        />

        {/* Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Members</CardTitle>
              <MemberAssignment
                teamId={team.id}
                existingMemberIds={existingMemberIds}
                userRole={role}
              />
            </div>
          </CardHeader>
          <CardContent>
            <TeamMemberList
              teamId={team.id}
              members={team.members}
              positions={team.positions}
              userRole={role}
              callerMemberId={callerMemberId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
