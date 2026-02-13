import Link from "next/link";
import { Crown, Users } from "lucide-react";
import { Suspense } from "react";
import { RosterMemberCard } from "@/components/teams/roster-member-card";
import { RosterSearch } from "@/components/teams/roster-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RosterMember } from "@/lib/teams/queries";
import { getTeamRoster, getTeams } from "@/lib/teams/queries";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PROFICIENCY_COLORS: Record<string, string> = {
  beginner: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  intermediate:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  advanced:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  expert: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Team Roster",
};

export default async function TeamRosterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; team?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q ?? "";
  const teamFilter = params.team ?? "";

  const [members, teams] = await Promise.all([
    getTeamRoster(searchQuery || undefined, teamFilter || undefined),
    getTeams(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Team Roster</h1>
          <Badge variant="secondary" className="ml-1">
            {members.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          All serving members across teams
        </p>
      </div>

      {/* Search + Team Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Suspense fallback={null}>
          <RosterSearch defaultValue={searchQuery} />
        </Suspense>

        {/* Team filter chips */}
        {teams.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <TeamFilterChip
              href="/team-roster"
              label="All"
              active={!teamFilter}
            />
            {teams.map((team) => (
              <TeamFilterChip
                key={team.id}
                href={`/team-roster?team=${team.id}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
                label={team.name}
                active={teamFilter === team.id}
                color={team.color}
              />
            ))}
          </div>
        )}
      </div>

      {/* Members: Desktop table + Mobile cards */}
      {members.length > 0 ? (
        <>
          {/* Desktop: table layout */}
          <div className="hidden md:block">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Positions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <RosterTableRow key={member.id} member={member} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile: card grid */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {members.map((member) => (
              <RosterMemberCard key={member.id} member={member} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="mb-3 size-10 text-muted-foreground/50" />
          <p className="text-lg font-medium">No members found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery
              ? `No results for "${searchQuery}". Try a different search term.`
              : "No serving members have been assigned to teams yet."}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop table row
// ---------------------------------------------------------------------------

function RosterTableRow({ member }: { member: RosterMember }) {
  const isLead = member.teams.some((t) => t.role === "lead");

  return (
    <TableRow className="group">
      <TableCell>
        <Link
          href={`/members/${member.id}`}
          className="flex items-center gap-3"
        >
          <Avatar>
            {member.avatar_url && (
              <AvatarImage src={member.avatar_url} alt={member.full_name} />
            )}
            <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate group-hover:underline">
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
        </Link>
      </TableCell>
      <TableCell>
        {member.teams.length > 0 ? (
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
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </TableCell>
      <TableCell>
        {member.positions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {member.positions.map((pos) => (
              <Badge
                key={`${pos.name}-${pos.proficiency}`}
                variant="outline"
                className={`text-xs ${PROFICIENCY_COLORS[pos.proficiency] ?? ""}`}
              >
                {pos.name}
                {pos.proficiency && pos.proficiency !== "beginner" && (
                  <span className="ml-1 opacity-75">
                    (
                    {pos.proficiency.charAt(0).toUpperCase() +
                      pos.proficiency.slice(1)}
                    )
                  </span>
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Team filter chip (server component - uses <a> tags for URL-based filtering)
// ---------------------------------------------------------------------------

function TeamFilterChip({
  href,
  label,
  active,
  color,
}: {
  href: string;
  label: string;
  active: boolean;
  color?: string | null;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {color && (
        <span
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </a>
  );
}
