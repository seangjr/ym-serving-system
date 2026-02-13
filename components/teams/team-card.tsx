"use client";

import { Crown, Pencil, Trash2, Users } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AppRole } from "@/lib/auth/roles";
import { deleteTeam } from "@/lib/teams/actions";
import { TeamFormDialog } from "./team-form-dialog";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    memberCount: number;
    leadName: string | null;
  };
  userRole: AppRole;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamCard({ team, userRole }: TeamCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isAdminOrCommittee = userRole === "admin" || userRole === "committee";
  const isAdmin = userRole === "admin";

  function handleCardClick() {
    router.push(`/teams/${team.id}`);
  }

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
    <Card
      className="group relative cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={handleCardClick}
    >
      {/* Color accent bar */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: team.color ?? "#6b7280" }}
      />

      <CardHeader className="pl-8">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{team.name}</CardTitle>
            {team.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {team.description}
              </CardDescription>
            )}
          </div>

          {/* Action buttons */}
          {isAdminOrCommittee && (
            <div
              role="toolbar"
              className="flex items-center gap-1 shrink-0"
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
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon-xs">
                      <Trash2 className="size-3.5 text-destructive" />
                      <span className="sr-only">Delete team</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Team</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{team.name}&quot;?
                        This will remove all team members, positions, and
                        skills. This action cannot be undone.
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
          )}
        </div>
      </CardHeader>

      <CardContent className="pl-8">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
          </span>
          {team.leadName && (
            <span className="inline-flex items-center gap-1.5">
              <Crown className="size-3.5 text-amber-500" />
              {team.leadName}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
