"use client";

import { useTransition } from "react";
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
import { respondToAssignment } from "@/lib/notifications/actions";
import { Loader2 } from "lucide-react";

interface DeclineDialogProps {
  assignmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeclined?: () => void;
}

export function DeclineDialog({
  assignmentId,
  open,
  onOpenChange,
  onDeclined,
}: DeclineDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleDecline() {
    startTransition(async () => {
      await respondToAssignment({
        assignmentId,
        status: "declined",
      });
      onOpenChange(false);
      onDeclined?.();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Decline Assignment?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to decline this assignment? Your team lead will
            be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              handleDecline();
            }}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Decline
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
