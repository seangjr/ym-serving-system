"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchTeamMembersForSwap,
  requestSwap,
} from "@/lib/notifications/actions";

interface SwapRequestDialogProps {
  assignmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SwapRequestDialog({
  assignmentId,
  open,
  onOpenChange,
}: SwapRequestDialogProps) {
  const [teamMembers, setTeamMembers] = useState<
    { id: string; fullName: string }[]
  >([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Fetch team members when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingMembers(true);
      setTargetMemberId("");
      setReason("");
      fetchTeamMembersForSwap(assignmentId)
        .then(setTeamMembers)
        .catch(() => setTeamMembers([]))
        .finally(() => setLoadingMembers(false));
    }
  }, [open, assignmentId]);

  function handleSubmit() {
    if (!targetMemberId) {
      toast.error("Please select a team member to swap with.");
      return;
    }

    startTransition(async () => {
      const result = await requestSwap({
        assignmentId,
        targetMemberId,
        reason: reason || undefined,
      });

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Swap request sent");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-5" />
            Request Swap
          </DialogTitle>
          <DialogDescription>
            Select the team member you&apos;ve arranged to swap with
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Team member select */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="swap-target"
              className="text-sm font-medium"
            >
              Swap with
            </label>
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading team members...
              </div>
            ) : teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No other team members available for swap.
              </p>
            ) : (
              <Select
                value={targetMemberId}
                onValueChange={setTargetMemberId}
              >
                <SelectTrigger id="swap-target" className="w-full">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-48">
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Optional reason */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="swap-reason"
              className="text-sm font-medium"
            >
              Reason{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Textarea
              id="swap-reason"
              placeholder="Reason (optional)"
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !targetMemberId || loadingMembers}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="size-4" />
            )}
            Request Swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
