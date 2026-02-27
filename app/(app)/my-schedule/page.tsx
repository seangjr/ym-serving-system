import { ArrowLeftRight, CalendarCheck } from "lucide-react";
import {
  getMyAssignments,
  getActiveSwapForAssignment,
  getIncomingSwapRequests,
} from "@/lib/notifications/queries";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { IncomingSwapCard } from "@/components/assignments/incoming-swap-card";

export default async function MySchedulePage() {
  const [assignments, incomingSwaps] = await Promise.all([
    getMyAssignments(),
    getIncomingSwapRequests(),
  ]);

  // Fetch active swap for each assignment in parallel
  const swapStatuses = await Promise.all(
    assignments.map(async (a) => {
      const swap = await getActiveSwapForAssignment(a.id);
      return {
        assignmentId: a.id,
        pendingSwapId: swap?.id ?? null,
      };
    }),
  );

  const swapMap = new Map(
    swapStatuses.map((s) => [s.assignmentId, s.pendingSwapId]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your upcoming assignments
        </p>
      </div>

      {/* Incoming swap requests section */}
      {incomingSwaps.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="size-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Incoming Swap Requests ({incomingSwaps.length})
            </h2>
          </div>
          {incomingSwaps.map((swap) => (
            <IncomingSwapCard key={swap.id} swap={swap} />
          ))}
        </div>
      )}

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
              pendingSwapId={swapMap.get(assignment.id) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
