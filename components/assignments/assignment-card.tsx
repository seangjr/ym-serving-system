"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignmentResponseButtons } from "./assignment-response-buttons";
import { SwapRequestDialog } from "./swap-request-dialog";
import { cancelSwap } from "@/lib/notifications/actions";
import type { MyAssignment } from "@/lib/notifications/types";

const STATUS_STYLES: Record<
  "pending" | "confirmed" | "declined",
  string
> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  confirmed:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  declined:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = Number.parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface AssignmentCardProps {
  assignment: MyAssignment;
  pendingSwapId?: string | null;
}

export function AssignmentCard({
  assignment,
  pendingSwapId = null,
}: AssignmentCardProps) {
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelled, setCancelled] = useState(false);

  const hasActivePendingSwap = !!pendingSwapId && !cancelled;

  const handleCancelSwap = () => {
    if (!pendingSwapId) return;
    startCancelTransition(async () => {
      const result = await cancelSwap({ swapRequestId: pendingSwapId });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setCancelled(true);
        toast.success("Swap request cancelled");
      }
    });
  };

  return (
    <>
      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between gap-3 p-3">
          {/* Left: service title, position + team */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-sm">
              {assignment.serviceTitle}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {assignment.positionName} &middot; {assignment.teamName}
            </p>
          </div>

          {/* Middle: date + time */}
          <div className="shrink-0 text-right">
            <p className="text-sm font-medium">
              {formatDate(assignment.serviceDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTime(assignment.startTime)}
            </p>
          </div>

          {/* Right: badge + buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant="secondary"
              className={STATUS_STYLES[assignment.status]}
            >
              {assignment.status}
            </Badge>

            {hasActivePendingSwap ? (
              <Badge
                variant="outline"
                className="inline-flex cursor-pointer items-center gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                onClick={handleCancelSwap}
              >
                {isCancelling ? "..." : "Swap Pending"}
                <X className="size-3" />
              </Badge>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                  onClick={() => setShowSwapDialog(true)}
                  aria-label="Request swap"
                >
                  <ArrowLeftRight className="size-4" />
                </Button>

                <AssignmentResponseButtons
                  assignmentId={assignment.id}
                  currentStatus={assignment.status}
                />
              </>
            )}
          </div>
        </div>
      </Card>

      <SwapRequestDialog
        assignmentId={assignment.id}
        open={showSwapDialog}
        onOpenChange={setShowSwapDialog}
      />
    </>
  );
}
