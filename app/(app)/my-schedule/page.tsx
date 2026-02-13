export default function MySchedulePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your upcoming assignments and availability
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-12">
        <p className="text-center text-sm text-muted-foreground">
          No assignments yet. Your schedule will appear here.
        </p>
      </div>
    </div>
  );
}
