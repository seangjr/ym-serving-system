"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addServicePosition } from "@/lib/assignments/actions";
import type { TeamForAssignment } from "@/lib/assignments/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PositionAdderProps {
  serviceId: string;
  teams: TeamForAssignment[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PositionAdder({ serviceId, teams }: PositionAdderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    teams.length === 1 ? teams[0].id : "",
  );
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Group positions by category for the select dropdown
  const positionsByCategory: Record<
    string,
    { id: string; name: string; category: string | null }[]
  > = {};
  if (selectedTeam) {
    for (const pos of selectedTeam.positions) {
      const key = pos.category ?? "General";
      if (!positionsByCategory[key]) positionsByCategory[key] = [];
      positionsByCategory[key].push(pos);
    }
  }

  const handleAdd = () => {
    if (!selectedTeamId || !selectedPositionId) return;

    startTransition(async () => {
      const result = await addServicePosition({
        serviceId,
        teamId: selectedTeamId,
        positionId: selectedPositionId,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Position added");
      setSelectedPositionId("");
      router.refresh();
    });
  };

  if (teams.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3">
      <span className="text-sm font-medium text-muted-foreground">
        Add Position:
      </span>

      {/* Team selector (only show if multiple teams) */}
      {teams.length > 1 && (
        <Select
          value={selectedTeamId}
          onValueChange={(val) => {
            setSelectedTeamId(val);
            setSelectedPositionId("");
          }}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-48">
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                <span className="flex items-center gap-1.5">
                  {team.color && (
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                  )}
                  {team.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Position selector */}
      <Select
        value={selectedPositionId}
        onValueChange={setSelectedPositionId}
        disabled={!selectedTeamId}
      >
        <SelectTrigger size="sm" className="w-48">
          <SelectValue placeholder="Select position" />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-48">
          {Object.entries(positionsByCategory).map(([category, positions]) => (
            <SelectGroup key={category}>
              <SelectLabel>{category}</SelectLabel>
              {positions.map((pos) => (
                <SelectItem key={pos.id} value={pos.id}>
                  {pos.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      {/* Add button */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleAdd}
        disabled={isPending || !selectedTeamId || !selectedPositionId}
      >
        <Plus className="size-4" />
        Add
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline position adder (inside a team card)
// ---------------------------------------------------------------------------

interface InlinePositionAdderProps {
  serviceId: string;
  team: TeamForAssignment;
}

export function InlinePositionAdder({
  serviceId,
  team,
}: InlinePositionAdderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");

  const positionsByCategory = useMemo(() => {
    const groups: Record<
      string,
      { id: string; name: string; category: string | null }[]
    > = {};
    for (const pos of team.positions) {
      const key = pos.category ?? "General";
      if (!groups[key]) groups[key] = [];
      groups[key].push(pos);
    }
    return groups;
  }, [team.positions]);

  const handleAdd = () => {
    if (!selectedPositionId) return;

    startTransition(async () => {
      const result = await addServicePosition({
        serviceId,
        teamId: team.id,
        positionId: selectedPositionId,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Position added");
      setSelectedPositionId("");
      router.refresh();
    });
  };

  if (team.positions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 border-t pt-3">
      <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
        <SelectTrigger size="sm" className="w-full max-w-44">
          <SelectValue placeholder="Add position..." />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-48">
          {Object.entries(positionsByCategory).map(([category, positions]) => (
            <SelectGroup key={category}>
              <SelectLabel>{category}</SelectLabel>
              {positions.map((pos) => (
                <SelectItem key={pos.id} value={pos.id}>
                  {pos.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleAdd}
        disabled={isPending || !selectedPositionId}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
