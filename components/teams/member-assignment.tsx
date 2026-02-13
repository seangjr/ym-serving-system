"use client";

import { ChevronsUpDown, Loader2, UserPlus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AppRole } from "@/lib/auth/roles";
import { addMemberToTeam, fetchAllMembers } from "@/lib/teams/actions";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MemberAssignmentProps {
  teamId: string;
  existingMemberIds: string[];
  userRole: AppRole;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MemberAssignment({
  teamId,
  existingMemberIds,
  userRole,
}: MemberAssignmentProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<
    { id: string; full_name: string; email: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canManage = userRole === "admin" || userRole === "committee";

  // Load members when popover opens
  useEffect(() => {
    if (open && members.length === 0) {
      setIsLoading(true);
      fetchAllMembers()
        .then((data) => setMembers(data))
        .catch(() => toast.error("Failed to load members"))
        .finally(() => setIsLoading(false));
    }
  }, [open, members.length]);

  function handleSelect(memberId: string) {
    startTransition(async () => {
      const result = await addMemberToTeam(teamId, memberId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      const member = members.find((m) => m.id === memberId);
      toast.success(`Added ${member?.full_name ?? "member"} to team`);
      setOpen(false);
    });
  }

  // Filter out already assigned members
  const availableMembers = members.filter(
    (m) => !existingMemberIds.includes(m.id),
  );

  if (!canManage && userRole !== "member") return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus />
          Add Member
          <ChevronsUpDown className="ml-1 size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No members found.</CommandEmpty>
                <CommandGroup>
                  {availableMembers.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={`${member.full_name} ${member.email}`}
                      onSelect={() => handleSelect(member.id)}
                      disabled={isPending}
                      className="flex flex-col items-start gap-0"
                    >
                      <span className="text-sm font-medium truncate">
                        {member.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
