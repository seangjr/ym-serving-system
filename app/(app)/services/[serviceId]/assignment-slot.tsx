"use client";

import { AlertTriangle, MessageSquare, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  assignMember,
  removeServicePosition,
  unassignMember,
  updateAssignmentNote,
} from "@/lib/assignments/actions";
import type {
  ConflictInfo,
  EligibleMember,
  ServicePositionWithAssignment,
} from "@/lib/assignments/types";
import { ConflictDialog } from "./conflict-dialog";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AssignmentSlotProps {
  position: ServicePositionWithAssignment;
  eligibleMembers: EligibleMember[];
  serviceId: string;
  canManage: boolean;
}

// ---------------------------------------------------------------------------
// Status badge colours (per plan)
// ---------------------------------------------------------------------------

const statusStyles: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssignmentSlot({
  position,
  eligibleMembers,
  serviceId,
  canManage,
}: AssignmentSlotProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingConflict, setPendingConflict] = useState<{
    conflict: ConflictInfo;
    memberId: string;
    memberName: string;
  } | null>(null);
  const [showNotes, setShowNotes] = useState(!!position.assignment?.notes);
  const [noteValue, setNoteValue] = useState(position.assignment?.notes ?? "");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const noteTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // -----------------------------------------------------------------------
  // Assign handler
  // -----------------------------------------------------------------------

  const handleAssign = useCallback(
    (memberId: string) => {
      const member = eligibleMembers.find((m) => m.id === memberId);
      if (!member) return;

      startTransition(async () => {
        const result = await assignMember({
          servicePositionId: position.id,
          memberId,
          serviceId,
        });

        if ("conflict" in result) {
          setPendingConflict({
            conflict: result.conflict,
            memberId,
            memberName: member.fullName,
          });
          setConflictDialogOpen(true);
          return;
        }

        if ("error" in result) {
          toast.error(result.error);
          return;
        }

        toast.success("Member assigned");
        router.refresh();
      });
    },
    [eligibleMembers, position.id, serviceId, router],
  );

  // -----------------------------------------------------------------------
  // Force-assign (after conflict confirmation)
  // -----------------------------------------------------------------------

  const handleForceAssign = useCallback(() => {
    if (!pendingConflict) return;

    startTransition(async () => {
      const result = await assignMember({
        servicePositionId: position.id,
        memberId: pendingConflict.memberId,
        serviceId,
        forceAssign: true,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Member assigned (with conflict)");
      setConflictDialogOpen(false);
      setPendingConflict(null);
      router.refresh();
    });
  }, [pendingConflict, position.id, serviceId, router]);

  // -----------------------------------------------------------------------
  // Unassign handler
  // -----------------------------------------------------------------------

  const handleUnassign = useCallback(() => {
    startTransition(async () => {
      const result = await unassignMember({
        servicePositionId: position.id,
        serviceId,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Member unassigned");
      router.refresh();
    });
  }, [position.id, serviceId, router]);

  // -----------------------------------------------------------------------
  // Notes handler (save on blur with debounce)
  // -----------------------------------------------------------------------

  const handleNoteSave = useCallback(
    (value: string) => {
      if (!position.assignment) return;
      if (value === (position.assignment.notes ?? "")) return;

      if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
      noteTimeoutRef.current = setTimeout(() => {
        startTransition(async () => {
          const result = await updateAssignmentNote({
            // biome-ignore lint/style/noNonNullAssertion: guarded by early return above
            assignmentId: position.assignment!.id,
            serviceId,
            notes: value,
          });

          if ("error" in result) {
            toast.error(result.error);
            return;
          }
        });
      }, 500);
    },
    [position.assignment, serviceId],
  );

  // -----------------------------------------------------------------------
  // Remove position handler
  // -----------------------------------------------------------------------

  const handleRemovePosition = useCallback(() => {
    if (position.assignment) {
      setRemoveDialogOpen(true);
      return;
    }

    startTransition(async () => {
      const result = await removeServicePosition({
        servicePositionId: position.id,
        serviceId,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Position removed");
      router.refresh();
    });
  }, [position.assignment, position.id, serviceId, router]);

  const confirmRemovePosition = useCallback(() => {
    startTransition(async () => {
      const result = await removeServicePosition({
        servicePositionId: position.id,
        serviceId,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Position and assignment removed");
      setRemoveDialogOpen(false);
      router.refresh();
    });
  }, [position.id, serviceId, router]);

  // -----------------------------------------------------------------------
  // Render: Assigned state
  // -----------------------------------------------------------------------

  if (position.assignment) {
    const { assignment } = position;
    return (
      <>
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          {/* Position name */}
          <span className="text-sm font-medium">{position.positionName}</span>

          <div className="ml-auto flex items-center gap-2">
            {/* Conflict warning icon */}
            {assignment.hasConflict && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>Scheduling conflict</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Member name */}
            <span className="text-sm">{assignment.memberName}</span>

            {/* Status badge */}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[assignment.status] ?? ""}`}
            >
              {assignment.status}
            </span>

            {canManage && (
              <>
                {/* Notes toggle */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowNotes(!showNotes)}
                  title="Notes"
                >
                  <MessageSquare className="size-3" />
                </Button>

                {/* Unassign */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleUnassign}
                  disabled={isPending}
                  title="Unassign"
                >
                  <X className="size-3" />
                </Button>

                {/* Remove position */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleRemovePosition}
                  disabled={isPending}
                  title="Remove position"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Notes input (shown when toggled) */}
        {showNotes && canManage && (
          <div className="ml-4 mt-1 mb-1 flex items-center gap-1">
            <input
              type="text"
              placeholder="Add a note..."
              className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={noteValue}
              onChange={(e) => {
                setNoteValue(e.target.value);
                handleNoteSave(e.target.value);
              }}
              onBlur={() => handleNoteSave(noteValue)}
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowNotes(false)}
              title="Close notes"
              className="shrink-0 text-muted-foreground"
            >
              <X className="size-3" />
            </Button>
          </div>
        )}

        {/* Conflict dialog */}
        <ConflictDialog
          open={conflictDialogOpen}
          onOpenChange={setConflictDialogOpen}
          conflict={pendingConflict?.conflict ?? null}
          memberName={pendingConflict?.memberName ?? ""}
          onConfirm={handleForceAssign}
          isPending={isPending}
        />

        {/* Remove position confirmation dialog */}
        <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Remove {position.positionName}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {assignment.memberName} is currently assigned to this position
                and will be unassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={confirmRemovePosition}
                disabled={isPending}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Unassigned state
  // -----------------------------------------------------------------------

  return (
    <>
      <div className="flex items-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 px-3 py-2">
        {/* Position name */}
        <span className="text-sm font-medium text-muted-foreground">
          {position.positionName}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {canManage && (
            <>
              {/* Combobox to assign */}
              <Combobox<string>
                open={comboboxOpen}
                onOpenChange={setComboboxOpen}
                value={null}
                onValueChange={(val) => {
                  if (val) {
                    handleAssign(val);
                    setComboboxOpen(false);
                  }
                }}
                itemToStringLabel={(memberId) =>
                  eligibleMembers.find((m) => m.id === memberId)
                    ?.fullName ?? ""
                }
              >
                <ComboboxInput
                  placeholder="Search members..."
                  className="h-7 w-40 text-xs"
                  showClear={false}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {eligibleMembers.map((member) => (
                      <ComboboxItem key={member.id} value={member.id}>
                        <span className="flex items-center gap-1.5">
                          {member.fullName}
                          {member.hasConflict && (
                            <AlertTriangle className="size-3.5 text-amber-500" />
                          )}
                        </span>
                      </ComboboxItem>
                    ))}
                    <ComboboxEmpty>No matching members</ComboboxEmpty>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {/* Remove position */}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleRemovePosition}
                disabled={isPending}
                title="Remove position"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Conflict dialog */}
      <ConflictDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
        conflict={pendingConflict?.conflict ?? null}
        memberName={pendingConflict?.memberName ?? ""}
        onConfirm={handleForceAssign}
        isPending={isPending}
      />
    </>
  );
}
