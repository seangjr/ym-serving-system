"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resolveSwap } from "@/lib/notifications/actions";
import type { SwapRequestWithContext } from "@/lib/notifications/queries";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

interface SwapApprovalListProps {
  swapRequests: SwapRequestWithContext[];
}

export function SwapApprovalList({
  swapRequests,
}: SwapApprovalListProps) {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const pendingRequests = swapRequests.filter(
    (sr) => !resolvedIds.has(sr.id),
  );

  if (pendingRequests.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {pendingRequests.map((sr) => (
        <SwapApprovalItem
          key={sr.id}
          swapRequest={sr}
          onResolved={(id) =>
            setResolvedIds((prev) => new Set([...prev, id]))
          }
        />
      ))}
    </div>
  );
}

function SwapApprovalItem({
  swapRequest,
  onResolved,
}: {
  swapRequest: SwapRequestWithContext;
  onResolved: (id: string) => void;
}) {
  const [isPendingApprove, startApprove] = useTransition();
  const [isPendingReject, startReject] = useTransition();

  const isPending = isPendingApprove || isPendingReject;

  function handleApprove() {
    startApprove(async () => {
      const result = await resolveSwap({
        swapRequestId: swapRequest.id,
        action: "approved",
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Swap approved");
        onResolved(swapRequest.id);
      }
    });
  }

  function handleReject() {
    startReject(async () => {
      const result = await resolveSwap({
        swapRequestId: swapRequest.id,
        action: "rejected",
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Swap rejected");
        onResolved(swapRequest.id);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span className="truncate">{swapRequest.requesterName}</span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{swapRequest.targetName}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {swapRequest.positionName}
        </p>
        {swapRequest.reason && (
          <p className="mt-1 truncate text-xs text-muted-foreground italic">
            &quot;{swapRequest.reason}&quot;
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          {relativeTime(swapRequest.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400"
          disabled={isPending}
          onClick={handleApprove}
          aria-label="Approve swap"
        >
          {isPendingApprove ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
          disabled={isPending}
          onClick={handleReject}
          aria-label="Reject swap"
        >
          {isPendingReject ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
