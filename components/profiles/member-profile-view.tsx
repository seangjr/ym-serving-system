import { Crown, Mail, Phone as PhoneIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberProfile } from "@/lib/profiles/queries";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MemberProfileViewProps {
  member: MemberProfile;
}

// NOTE: All authenticated users can currently see all profile fields.
// In a future iteration, phone and emergency contact could be restricted
// to admin/committee and same-team members for privacy.

export function MemberProfileView({ member }: MemberProfileViewProps) {
  const profile = member.member_profiles;
  const teams = member.team_members ?? [];
  const skills = member.member_position_skills ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left column: Identity + Contact */}
      <div className="flex flex-col gap-6">
        {/* Identity card */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
            <Avatar className="size-24 text-2xl">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={member.full_name} />
              )}
              <AvatarFallback className="text-2xl">
                {getInitials(member.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{member.full_name}</h2>
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="size-4" />
                {member.email}
              </a>
              {member.contact_number ? (
                <a
                  href={`tel:${member.contact_number}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <PhoneIcon className="size-4" />
                  {member.contact_number}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <PhoneIcon className="size-4" />
                  Not provided
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right column: Teams + Positions */}
      <div className="flex flex-col gap-6">
        {/* Teams section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Teams</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length > 0 ? (
              <div className="space-y-3">
                {teams.map((tm) => (
                  <div
                    key={tm.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <Link
                      href={`/teams/${tm.team_id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                    >
                      {tm.serving_teams?.color && (
                        <span
                          className="inline-block size-3 rounded-full"
                          style={{
                            backgroundColor: tm.serving_teams.color,
                          }}
                        />
                      )}
                      {tm.serving_teams?.name ?? "Unknown Team"}
                    </Link>
                    {tm.role === "lead" ? (
                      <Badge className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        <Crown className="size-3" />
                        Lead
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Member</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not assigned to any teams yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Positions & Skills section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Positions & Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {skills.length > 0 ? (
              <SkillsByTeam skills={skills} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No position skills assigned yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skills grouped by team (matching position-preferences.tsx pattern)
// ---------------------------------------------------------------------------

function SkillsByTeam({
  skills,
}: {
  skills: MemberProfile["member_position_skills"];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => {
        const pos = skill.team_positions;
        return (
          <Badge
            key={`${pos?.id ?? pos?.name}-${skill.proficiency}`}
            variant="secondary"
            className="text-xs"
          >
            {pos?.name ?? "Unknown"}
          </Badge>
        );
      })}
    </div>
  );
}
