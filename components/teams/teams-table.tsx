"use client";

import { Pencil, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppRole } from "@/lib/auth/roles";
import { deleteTeam } from "@/lib/teams/actions";
import { TeamFormDialog } from "./team-form-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  memberCount: number;
  leadName: string | null;
}

interface TeamsTableProps {
  teams: TeamData[];
  userRole: AppRole;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamsTable({ teams, userRole }: TeamsTableProps) {
  const isAdminOrCommittee = userRole === "admin" || userRole === "committee";

  return (
    <>
      {/* Desktop: table layout */}
      <div className="hidden md:block">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdminOrCommittee && <TableHead className="w-[80px]" />}
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TeamTableRow
                    key={team.id}
                    team={team}
                    userRole={userRole}
                    isAdminOrCommittee={isAdminOrCommittee}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {teams.map((team) => (
          <TeamMobileCard
            key={team.id}
            team={team}
            userRole={userRole}
            isAdminOrCommittee={isAdminOrCommittee}
          />
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Desktop table row — entire row is clickable to navigate
// ---------------------------------------------------------------------------

function TeamTableRow({
  team,
  userRole,
  isAdminOrCommittee,
}: {
  team: TeamData;
  userRole: AppRole;
  isAdminOrCommittee: boolean;
}) {
  const router = useRouter();

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => router.push(`/teams/${team.id}`)}
    >
      {isAdminOrCommittee && (
        <TableCell>
          <TeamActions team={team} userRole={userRole} />
        </TableCell>
      )}
      <TableCell>
        <span className="inline-flex items-center gap-2 font-medium">
          <span
            className="inline-block size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: team.color ?? "#6b7280" }}
          />
          {team.name}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
        {team.description || "--"}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          <Users className="size-3 mr-1" />
          {team.memberCount}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Mobile card — entire card is clickable to navigate
// ---------------------------------------------------------------------------

function TeamMobileCard({
  team,
  userRole,
  isAdminOrCommittee,
}: {
  team: TeamData;
  userRole: AppRole;
  isAdminOrCommittee: boolean;
}) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={() => router.push(`/teams/${team.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2 font-medium min-w-0">
            <span
              className="inline-block size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: team.color ?? "#6b7280" }}
            />
            <span className="truncate">{team.name}</span>
          </span>
          {isAdminOrCommittee && (
            <div
              role="toolbar"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <TeamActions team={team} userRole={userRole} />
            </div>
          )}
        </div>
        {team.description && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
            {team.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Actions (edit + delete) — stopPropagation prevents row navigation
// ---------------------------------------------------------------------------

function TeamActions({
  team,
  userRole,
}: {
  team: TeamData;
  userRole: AppRole;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isAdmin = userRole === "admin";

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTeam(team.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`"${team.name}" deleted`);
      }
      setDeleteOpen(false);
    });
  }

  return (
    <div
      role="toolbar"
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <TeamFormDialog
        mode="edit"
        team={team}
        trigger={
          <Button variant="ghost" size="icon-xs">
            <Pencil className="size-3.5" />
            <span className="sr-only">Edit team</span>
          </Button>
        }
      />

      {isAdmin && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5 text-destructive" />
            <span className="sr-only">Delete team</span>
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{team.name}&quot;? This
                will remove all team members, positions, and skills. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
