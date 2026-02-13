"use client";

import { Crown, MoreHorizontal, Trash2, UserCog } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppRole } from "@/lib/auth/roles";
import {
  removeMemberFromTeam,
  updateMemberPositionSkill,
  updateMemberTeamRole,
} from "@/lib/teams/actions";
import type { Preference, Proficiency } from "@/lib/teams/schemas";
import { preferenceLevels, proficiencyLevels } from "@/lib/teams/schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemberData {
  id: string;
  member_id: string;
  role: "lead" | "member";
  joined_at: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  skills: {
    position_id: string;
    proficiency: string;
    preference: string;
  }[];
}

interface PositionData {
  id: string;
  name: string;
}

interface TeamMemberListProps {
  teamId: string;
  members: MemberData[];
  positions: PositionData[];
  userRole: AppRole;
  callerMemberId: string | null;
}

// ---------------------------------------------------------------------------
// Proficiency badge styles
// ---------------------------------------------------------------------------

const PROFICIENCY_COLORS: Record<string, string> = {
  beginner: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  intermediate:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  advanced:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  expert:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
};

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

export function TeamMemberList({
  teamId,
  members,
  positions,
  userRole,
  callerMemberId,
}: TeamMemberListProps) {
  const canManage = userRole === "admin" || userRole === "committee";

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No members assigned to this team yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        {members.length} {members.length === 1 ? "member" : "members"}
      </p>

      {/* Desktop: table layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Skills</TableHead>
              {canManage && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                teamId={teamId}
                member={member}
                positions={positions}
                canManage={canManage}
                isSelf={member.member_id === callerMemberId}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            teamId={teamId}
            member={member}
            positions={positions}
            canManage={canManage}
            isSelf={member.member_id === callerMemberId}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop row
// ---------------------------------------------------------------------------

function MemberRow({
  teamId,
  member,
  positions,
  canManage,
  isSelf,
}: {
  teamId: string;
  member: MemberData;
  positions: PositionData[];
  canManage: boolean;
  isSelf: boolean;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {member.avatar_url && (
              <AvatarImage src={member.avatar_url} alt={member.full_name} />
            )}
            <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {member.full_name}
              {isSelf && (
                <span className="ml-1 text-xs text-muted-foreground">
                  (you)
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {member.email}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <RoleBadge role={member.role} />
      </TableCell>
      <TableCell>
        <SkillBadges skills={member.skills} positions={positions} />
      </TableCell>
      {canManage && (
        <TableCell>
          <MemberActions
            teamId={teamId}
            member={member}
            positions={positions}
            isSelf={isSelf}
          />
        </TableCell>
      )}
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Mobile card
// ---------------------------------------------------------------------------

function MemberCard({
  teamId,
  member,
  positions,
  canManage,
  isSelf,
}: {
  teamId: string;
  member: MemberData;
  positions: PositionData[];
  canManage: boolean;
  isSelf: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size="sm">
            {member.avatar_url && (
              <AvatarImage src={member.avatar_url} alt={member.full_name} />
            )}
            <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {member.full_name}
              {isSelf && (
                <span className="ml-1 text-xs text-muted-foreground">
                  (you)
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {member.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RoleBadge role={member.role} />
          {canManage && (
            <MemberActions
              teamId={teamId}
              member={member}
              positions={positions}
              isSelf={isSelf}
            />
          )}
        </div>
      </div>
      {member.skills.length > 0 && (
        <SkillBadges skills={member.skills} positions={positions} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: "lead" | "member" }) {
  if (role === "lead") {
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
        <Crown className="size-3" />
        Lead
      </Badge>
    );
  }
  return <Badge variant="secondary">Member</Badge>;
}

// ---------------------------------------------------------------------------
// Skill badges
// ---------------------------------------------------------------------------

function SkillBadges({
  skills,
  positions,
}: {
  skills: MemberData["skills"];
  positions: PositionData[];
}) {
  if (skills.length === 0) {
    return <span className="text-xs text-muted-foreground">--</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((skill) => {
        const pos = positions.find((p) => p.id === skill.position_id);
        if (!pos) return null;
        return (
          <Badge
            key={skill.position_id}
            variant="outline"
            className={`text-xs ${PROFICIENCY_COLORS[skill.proficiency] ?? ""}`}
          >
            {pos.name}
          </Badge>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member actions dropdown
// ---------------------------------------------------------------------------

function MemberActions({
  teamId,
  member,
  positions,
  isSelf,
}: {
  teamId: string;
  member: MemberData;
  positions: PositionData[];
  isSelf: boolean;
}) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRoleChange() {
    const newRole = member.role === "lead" ? "member" : "lead";
    startTransition(async () => {
      const result = await updateMemberTeamRole(
        teamId,
        member.member_id,
        newRole,
      );
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(
          `${member.full_name} ${newRole === "lead" ? "promoted to Lead" : "set to Member"}`,
        );
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeMemberFromTeam(teamId, member.member_id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`${member.full_name} removed from team`);
      }
      setShowRemoveDialog(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" disabled={isPending}>
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Actions for {member.full_name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRoleChange} disabled={isSelf}>
            <UserCog className="size-4" />
            {member.role === "lead" ? "Demote to Member" : "Promote to Lead"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowSkillDialog(true)}>
            <UserCog className="size-4" />
            Assign Positions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowRemoveDialog(true)}
            disabled={isSelf}
          >
            <Trash2 className="size-4" />
            Remove from Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove confirmation dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {member.full_name} from this team? Their skill assignments
              will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Skill editing dialog */}
      <SkillEditDialog
        open={showSkillDialog}
        onOpenChange={setShowSkillDialog}
        member={member}
        positions={positions}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Skill edit dialog
// ---------------------------------------------------------------------------

function SkillEditDialog({
  open,
  onOpenChange,
  member,
  positions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberData;
  positions: PositionData[];
}) {
  const [isPending, startTransition] = useTransition();
  const [localSkills, setLocalSkills] = useState<
    Record<string, { proficiency: Proficiency; preference: Preference }>
  >(() => {
    const map: Record<
      string,
      { proficiency: Proficiency; preference: Preference }
    > = {};
    for (const s of member.skills) {
      map[s.position_id] = {
        proficiency: s.proficiency as Proficiency,
        preference: s.preference as Preference,
      };
    }
    return map;
  });

  function handleSave() {
    startTransition(async () => {
      const entries = Object.entries(localSkills);
      let hasError = false;

      for (const [positionId, skill] of entries) {
        const result = await updateMemberPositionSkill(
          member.member_id,
          positionId,
          skill.proficiency,
          skill.preference,
        );
        if ("error" in result) {
          toast.error(result.error);
          hasError = true;
          break;
        }
      }

      if (!hasError) {
        toast.success("Skills updated");
        onOpenChange(false);
      }
    });
  }

  function updateSkill(
    positionId: string,
    field: "proficiency" | "preference",
    value: string,
  ) {
    setLocalSkills((prev) => ({
      ...prev,
      [positionId]: {
        proficiency:
          prev[positionId]?.proficiency ?? ("beginner" as Proficiency),
        preference: prev[positionId]?.preference ?? ("willing" as Preference),
        [field]: value,
      },
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Positions — {member.full_name}</DialogTitle>
          <DialogDescription>
            For each position in this team, set how experienced this member is
            (proficiency) and how much they want to serve in this role
            (preference).
          </DialogDescription>
        </DialogHeader>

        {positions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No positions defined. Add positions first.
          </p>
        ) : (
          <div className="flex flex-col gap-4 max-h-80 overflow-y-auto">
            {positions.map((pos) => {
              const skill = localSkills[pos.id];
              return (
                <div key={pos.id} className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">{pos.name}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Experience Level
                      </span>
                      <Select
                        value={skill?.proficiency ?? "beginner"}
                        onValueChange={(v) =>
                          updateSkill(pos.id, "proficiency", v)
                        }
                      >
                        <SelectTrigger size="sm">
                          <SelectValue placeholder="Proficiency" />
                        </SelectTrigger>
                        <SelectContent>
                          {proficiencyLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        How skilled is this member at this position?
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Willingness
                      </span>
                      <Select
                        value={skill?.preference ?? "willing"}
                        onValueChange={(v) =>
                          updateSkill(pos.id, "preference", v)
                        }
                      >
                        <SelectTrigger size="sm">
                          <SelectValue placeholder="Preference" />
                        </SelectTrigger>
                        <SelectContent>
                          {preferenceLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        How much does this member want to serve here?
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || positions.length === 0}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
