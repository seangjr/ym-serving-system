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
import { Checkbox } from "@/components/ui/checkbox";
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
  updateMemberPositions,
  updateMemberTeamRole,
} from "@/lib/teams/actions";

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
  contact_number: string | null;
  skills: {
    position_id: string;
    proficiency: string;
    preference: string;
  }[];
}

interface PositionData {
  id: string;
  name: string;
  category: string | null;
}

interface TeamMemberListProps {
  teamId: string;
  members: MemberData[];
  positions: PositionData[];
  userRole: AppRole;
  callerMemberId: string | null;
}

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
            variant="secondary"
            className="text-xs"
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
        teamId={teamId}
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
  teamId,
  member,
  positions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  member: MemberData;
  positions: PositionData[];
}) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState<Set<string>>(() => {
    return new Set(member.skills.map((s) => s.position_id));
  });

  function toggle(positionId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(positionId)) {
        next.delete(positionId);
      } else {
        next.add(positionId);
      }
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateMemberPositions(
        teamId,
        member.member_id,
        Array.from(checked),
      );
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Positions updated");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Positions — {member.full_name}</DialogTitle>
          <DialogDescription>
            Select the positions this member serves in.
          </DialogDescription>
        </DialogHeader>

        {positions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No positions defined. Add positions first.
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto py-1">
            {positions.map((pos) => (
              <label
                key={pos.id}
                htmlFor={`pos-${pos.id}`}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  id={`pos-${pos.id}`}
                  checked={checked.has(pos.id)}
                  onCheckedChange={() => toggle(pos.id)}
                />
                <span className="text-sm font-medium">{pos.name}</span>
                {pos.category && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {pos.category}
                  </Badge>
                )}
              </label>
            ))}
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
