import { Users } from "lucide-react";
import { Suspense } from "react";
import { RosterMemberCard } from "@/components/teams/roster-member-card";
import { RosterSearch } from "@/components/teams/roster-search";
import { Badge } from "@/components/ui/badge";
import { getTeamRoster, getTeams } from "@/lib/teams/queries";

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

      {/* Member grid */}
      {members.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member) => (
            <RosterMemberCard key={member.id} member={member} />
          ))}
        </div>
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
