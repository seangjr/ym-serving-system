import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { TeamFormDialog } from "@/components/teams/team-form-dialog";
import { TeamsTable } from "@/components/teams/teams-table";
import { Button } from "@/components/ui/button";
import { getUserRole, isAdminOrCommittee } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getTeamsWithLeads } from "@/lib/teams/queries";

export default async function TeamsPage() {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);

  if (!isAdminOrCommittee(role)) {
    redirect("/");
  }

  const teams = await getTeamsWithLeads();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage serving teams, positions, and members
          </p>
        </div>

        <TeamFormDialog
          mode="create"
          trigger={
            <Button>
              <Plus />
              Create Team
            </Button>
          }
        />
      </div>

      {teams.length > 0 ? (
        <TeamsTable teams={teams} userRole={role} />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-12">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              No teams yet. Create your first serving team to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
