"use client";

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
import type { ConflictInfo, UnavailabilityInfo } from "@/lib/assignments/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: ConflictInfo | null;
  memberName: string;
  onConfirm: () => void;
  isPending: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConflictDialog({
  open,
  onOpenChange,
  conflict,
  memberName,
  onConfirm,
  isPending,
}: ConflictDialogProps) {
  if (!conflict) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Scheduling Conflict</AlertDialogTitle>
          <AlertDialogDescription>
            {memberName} is assigned as {conflict.positionName} on{" "}
            {conflict.serviceName} ({conflict.serviceTime}). Assign anyway?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            {isPending ? "Assigning..." : "Assign Anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Unavailability Dialog
// ---------------------------------------------------------------------------

interface UnavailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unavailability: UnavailabilityInfo | null;
  memberName: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function UnavailabilityDialog({
  open,
  onOpenChange,
  unavailability,
  memberName,
  onConfirm,
  isPending,
}: UnavailabilityDialogProps) {
  if (!unavailability) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Member Unavailable</AlertDialogTitle>
          <AlertDialogDescription>
            {memberName} has marked this date as unavailable
            {unavailability.reason ? `: "${unavailability.reason}"` : "."}{" "}
            Assign anyway?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            {isPending ? "Assigning..." : "Assign Anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
