"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OwnPositionSkill } from "@/lib/profiles/queries";

interface PositionPreferencesProps {
  positions: OwnPositionSkill[];
}

export function PositionPreferences({ positions }: PositionPreferencesProps) {
  if (!positions || positions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            You haven&apos;t been assigned to any positions yet. Contact your
            team leader to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group positions by team
  const grouped = new Map<
    string,
    {
      team: { id: string; name: string; color: string | null };
      skills: {
        positionName: string;
        category: string | null;
        proficiency: string;
        preference: string;
      }[];
    }
  >();

  for (const skill of positions) {
    const team = skill.team_positions?.serving_teams;
    if (!team) continue;

    const key = team.id;
    if (!grouped.has(key)) {
      grouped.set(key, { team, skills: [] });
    }
    grouped.get(key)?.skills.push({
      positionName: skill.team_positions.name,
      category: skill.team_positions.category,
      proficiency: skill.proficiency,
      preference: skill.preference,
    });
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.values()).map(({ team, skills }) => (
        <Card key={team.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {team.color && (
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
              )}
              {team.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <Badge
                  key={`${team.id}-${skill.positionName}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {skill.positionName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
