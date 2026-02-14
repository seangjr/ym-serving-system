"use client";

import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  EligibleMember,
  TeamAssignmentGroup,
  TeamForAssignment,
} from "@/lib/assignments/types";
import { AssignmentSlot } from "./assignment-slot";
import { InlinePositionAdder } from "./position-adder";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AssignmentPanelProps {
  teams: TeamAssignmentGroup[];
  serviceId: string;
  serviceDate: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  canManage: boolean;
  allTeams: TeamForAssignment[];
  eligibleMembersMap: Record<string, EligibleMember[]>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssignmentPanel({
  teams,
  serviceId,
  canManage,
  allTeams,
  eligibleMembersMap,
}: AssignmentPanelProps) {
  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center rounded-lg border border-dashed p-8">
          <p className="text-sm text-muted-foreground">
            No positions assigned yet. Use &quot;Add Position&quot; below to
            start scheduling.
          </p>
        </CardContent>
      </Card>
    );
  }

  // -----------------------------------------------------------------------
  // Team cards
  // -----------------------------------------------------------------------

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {teams.map((team) => {
        const categoryEntries = Object.entries(team.categories);
        const teamData = allTeams.find((t) => t.id === team.teamId);

        return (
          <Card key={team.teamId}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {team.teamColor && (
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: team.teamColor }}
                  />
                )}
                {team.teamName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {categoryEntries.map(([category, positions]) => (
                <Collapsible key={category} defaultOpen>
                  <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground [&[data-state=open]>svg]:rotate-0 [&[data-state=closed]>svg]:-rotate-90">
                    <ChevronDown className="size-4 shrink-0 transition-transform duration-200" />
                    {category}
                    <span className="ml-auto text-xs text-muted-foreground/60">
                      {positions.length}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col gap-1.5 pl-1 pt-1">
                    {positions.map((position) => (
                      <AssignmentSlot
                        key={position.id}
                        position={position}
                        eligibleMembers={
                          eligibleMembersMap[team.teamId] ??
                          teamData?.members.map((m) => ({
                            id: m.id,
                            fullName: m.fullName,
                            hasConflict: false,
                            conflictDetails: null,
                          })) ??
                          []
                        }
                        serviceId={serviceId}
                        canManage={canManage}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {canManage && teamData && (
                <InlinePositionAdder serviceId={serviceId} team={teamData} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
