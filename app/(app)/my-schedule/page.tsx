import { CalendarCheck } from "lucide-react";
import { getMyAssignments } from "@/lib/notifications/queries";
import { AssignmentCard } from "@/components/assignments/assignment-card";

export default async function MySchedulePage() {
  const assignments = await getMyAssignments();

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
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}
