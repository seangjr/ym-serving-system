"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignmentResponseButtons } from "./assignment-response-buttons";
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
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-3 p-3">
        {/* Left: position + team */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-sm">
            {assignment.positionName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {assignment.teamName}
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
          <AssignmentResponseButtons
            assignmentId={assignment.id}
            currentStatus={assignment.status}
          />
        </div>
      </div>
    </Card>
  );
}
