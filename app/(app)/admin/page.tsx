import { redirect } from "next/navigation";
import { UserRoleTable } from "@/components/admin/user-role-table";
import { getUsers } from "@/lib/auth/admin-actions";
import { getUserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { role, memberId } = await getUserRole(supabase);

  if (role !== "admin") {
    redirect("/dashboard");
  }

  const result = await getUsers();

  if ("error" in result) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user roles for the serving system
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-12">
          <p className="text-center text-sm text-destructive">{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user roles for the serving system
        </p>
      </div>
      <UserRoleTable users={result.users} currentMemberId={memberId} />
    </div>
  );
}
