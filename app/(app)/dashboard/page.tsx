export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage upcoming services and team assignments
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-12">
        <p className="text-center text-sm text-muted-foreground">
          No services yet. This page will show the services dashboard.
        </p>
      </div>
    </div>
  );
}
