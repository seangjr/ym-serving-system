"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { respondToAssignment } from "@/lib/notifications/actions";
import { DeclineDialog } from "./decline-dialog";

interface AssignmentResponseButtonsProps {
  assignmentId: string;
  currentStatus: "pending" | "confirmed" | "declined";
}

export function AssignmentResponseButtons({
  assignmentId,
  currentStatus,
}: AssignmentResponseButtonsProps) {
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  function handleConfirm() {
    setOptimisticStatus("confirmed");
    startTransition(async () => {
      const result = await respondToAssignment({
        assignmentId,
        status: "confirmed",
      });
      if ("error" in result) {
        // Revert on error
        setOptimisticStatus(currentStatus);
      }
    });
  }

  function handleDeclined() {
    setOptimisticStatus("declined");
  }

  const isConfirmed = optimisticStatus === "confirmed";
  const isDeclined = optimisticStatus === "declined";

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant={isConfirmed ? "default" : "ghost"}
          size="icon-sm"
          className={
            isConfirmed
              ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
              : "text-muted-foreground hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400"
          }
          disabled={isPending}
          onClick={handleConfirm}
          aria-label="Confirm assignment"
        >
          {isPending && optimisticStatus === "confirmed" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </Button>

        <Button
          variant={isDeclined ? "default" : "ghost"}
          size="icon-sm"
          className={
            isDeclined
              ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
              : "text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
          }
          disabled={isPending}
          onClick={() => setShowDeclineDialog(true)}
          aria-label="Decline assignment"
        >
          <X className="size-4" />
        </Button>
      </div>

      <DeclineDialog
        assignmentId={assignmentId}
        open={showDeclineDialog}
        onOpenChange={setShowDeclineDialog}
        onDeclined={handleDeclined}
      />
    </>
  );
}
