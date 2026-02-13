"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RosterMember } from "@/lib/teams/queries";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface RosterMemberCardProps {
  member: RosterMember;
}

export function RosterMemberCard({ member }: RosterMemberCardProps) {
  const isLead = member.teams.some((t) => t.role === "lead");

  return (
    <Link href={`/members/${member.id}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardContent className="flex flex-col gap-3 p-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <Avatar>
              {member.avatar_url && (
                <AvatarImage src={member.avatar_url} alt={member.full_name} />
              )}
              <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold truncate">
                  {member.full_name}
                </p>
                {isLead && (
                  <Crown className="size-3.5 shrink-0 text-amber-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {member.email}
              </p>
            </div>
          </div>

          {/* Team badges */}
          {member.teams.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {member.teams.map((team) => (
                <Badge
                  key={team.id}
                  variant="secondary"
                  className="text-xs"
                  style={
                    team.color
                      ? {
                          borderLeftWidth: "3px",
                          borderLeftColor: team.color,
                        }
                      : undefined
                  }
                >
                  {team.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Position chips */}
          {member.positions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {member.positions.map((pos) => (
                <Badge
                  key={`${pos.name}-${pos.proficiency}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {pos.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
