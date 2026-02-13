"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserWithRole } from "@/lib/auth/admin-actions";
import { updateUserRole } from "@/lib/auth/admin-actions";
import type { AppRole } from "@/lib/auth/roles";

// ---------------------------------------------------------------------------
// Serving role labels + styling
// ---------------------------------------------------------------------------

const SERVING_ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  committee: "Committee",
  member: "Member",
};

const SERVING_ROLES: AppRole[] = ["admin", "committee", "member"];

// Roles managed by the serving system -- everything else is read-only
const MANAGED_ROLE_NAMES = new Set(["admin", "committee"]);

function getOtherRoles(roles: string[]): string[] {
  return roles.filter((r) => !MANAGED_ROLE_NAMES.has(r.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface UserRoleTableProps {
  users: UserWithRole[];
  currentMemberId: string | null;
}

export function UserRoleTable({ users, currentMemberId }: UserRoleTableProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {users.length} {users.length === 1 ? "user" : "users"} with accounts
      </p>

      {/* Desktop: table layout */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Serving Role</TableHead>
              <TableHead>Other Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentMemberId}
              />
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            isSelf={user.id === currentMemberId}
          />
        ))}
        {users.length === 0 && (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
            <p className="text-sm text-muted-foreground">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop row
// ---------------------------------------------------------------------------

function UserRow({ user, isSelf }: { user: UserWithRole; isSelf: boolean }) {
  const otherRoles = getOtherRoles(user.roles);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.fullName || "Unnamed"}
        {isSelf && (
          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <RoleSelect user={user} disabled={isSelf} />
      </TableCell>
      <TableCell>
        <RoleBadges roles={otherRoles} />
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Mobile card
// ---------------------------------------------------------------------------

function UserCard({ user, isSelf }: { user: UserWithRole; isSelf: boolean }) {
  const otherRoles = getOtherRoles(user.roles);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">
            {user.fullName || "Unnamed"}
            {isSelf && (
              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
        <RoleSelect user={user} disabled={isSelf} />
      </div>
      {otherRoles.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">Other:</span>
          <RoleBadges roles={otherRoles} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role select dropdown
// ---------------------------------------------------------------------------

function RoleSelect({
  user,
  disabled,
}: {
  user: UserWithRole;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const newRole = value as AppRole;
    if (newRole === user.highestServingRole) return;

    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(
          `Updated ${user.fullName || "user"} to ${SERVING_ROLE_LABELS[newRole]}`,
        );
      }
    });
  }

  return (
    <Select
      value={user.highestServingRole}
      onValueChange={handleChange}
      disabled={disabled || isPending}
    >
      <SelectTrigger size="sm" className={isPending ? "opacity-50" : ""}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SERVING_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {SERVING_ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ---------------------------------------------------------------------------
// Read-only role badges
// ---------------------------------------------------------------------------

function RoleBadges({ roles }: { roles: string[] }) {
  if (roles.length === 0) {
    return <span className="text-xs text-muted-foreground">--</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} variant="secondary" className="text-xs">
          {role}
        </Badge>
      ))}
    </div>
  );
}
