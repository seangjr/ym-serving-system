"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OwnPositionSkill } from "@/lib/profiles/queries";

interface PositionPreferencesProps {
  positions: OwnPositionSkill[];
}

const PROFICIENCY_STYLES: Record<string, string> = {
  beginner: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  advanced:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  expert: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

const PREFERENCE_STYLES: Record<string, string> = {
  primary: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  secondary:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  willing: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

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
            <div className="space-y-3">
              {skills.map((skill) => (
                <div
                  key={`${team.id}-${skill.positionName}`}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="text-sm font-medium">
                    {skill.positionName}
                  </span>
                  {skill.category && (
                    <Badge variant="outline" className="text-xs">
                      {skill.category}
                    </Badge>
                  )}
                  <Badge
                    className={
                      PROFICIENCY_STYLES[skill.proficiency] ??
                      PROFICIENCY_STYLES.beginner
                    }
                  >
                    {skill.proficiency}
                  </Badge>
                  <Badge
                    className={
                      PREFERENCE_STYLES[skill.preference] ??
                      PREFERENCE_STYLES.willing
                    }
                  >
                    {skill.preference}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
