import { CalendarCheck } from "lucide-react";
import { getMyAssignments } from "@/lib/notifications/queries";
import { getActiveSwapForAssignment } from "@/lib/notifications/queries";
import { AssignmentCard } from "@/components/assignments/assignment-card";

export default async function MySchedulePage() {
  const assignments = await getMyAssignments();

  // Fetch active swap status for each assignment in parallel
  const swapStatuses = await Promise.all(
    assignments.map(async (a) => {
      const swap = await getActiveSwapForAssignment(a.id);
      return { assignmentId: a.id, hasPendingSwap: swap !== null };
    }),
  );

  const swapMap = new Map(
    swapStatuses.map((s) => [s.assignmentId, s.hasPendingSwap]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your upcoming assignments
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12">
          <CalendarCheck className="size-10 text-muted-foreground/50" />
          <p className="text-center text-sm text-muted-foreground">
            No upcoming assignments
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              hasActivePendingSwap={swapMap.get(assignment.id) ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
