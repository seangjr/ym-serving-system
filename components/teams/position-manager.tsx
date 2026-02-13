"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AppRole } from "@/lib/auth/roles";
import {
  createPosition,
  deletePosition,
  updatePosition,
} from "@/lib/teams/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Position {
  id: string;
  name: string;
  category: string | null;
  quantity_needed: number;
  sort_order: number;
  is_active: boolean;
}

interface PositionManagerProps {
  teamId: string;
  positions: Position[];
  userRole: AppRole;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PositionManager({
  teamId,
  positions,
  userRole,
}: PositionManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isAdminOrCommittee = userRole === "admin" || userRole === "committee";

  // Group by category
  const grouped = groupByCategory(positions);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Positions</CardTitle>
            <CardDescription>
              {positions.length}{" "}
              {positions.length === 1 ? "position" : "positions"} defined
            </CardDescription>
          </div>
          {isAdminOrCommittee && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus />
              Add
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Add position form */}
        {showAddForm && isAdminOrCommittee && (
          <AddPositionForm
            teamId={teamId}
            onComplete={() => setShowAddForm(false)}
          />
        )}

        {/* Position list */}
        {positions.length === 0 && !showAddForm ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No positions yet. Add your first position to define the team
              structure.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="flex flex-col gap-2">
                {category !== "__uncategorized__" && (
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {category}
                  </p>
                )}
                {items.map((position) => (
                  <PositionRow
                    key={position.id}
                    position={position}
                    isEditing={editingId === position.id}
                    onEdit={() =>
                      setEditingId(
                        editingId === position.id ? null : position.id,
                      )
                    }
                    canManage={isAdminOrCommittee}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Add position form
// ---------------------------------------------------------------------------

function AddPositionForm({
  teamId,
  onComplete,
}: {
  teamId: string;
  onComplete: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState(1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await createPosition({
        teamId,
        name: name.trim(),
        category: category.trim() || undefined,
        quantityNeeded,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(`Position "${name}" added`);
      setName("");
      setCategory("");
      setQuantityNeeded(1);
      onComplete();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pos-name" className="text-xs">
            Name
          </Label>
          <Input
            id="pos-name"
            placeholder="e.g. Vocalist"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pos-category" className="text-xs">
            Category
          </Label>
          <Input
            id="pos-category"
            placeholder="e.g. Music"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pos-qty" className="text-xs">
            Qty Needed
          </Label>
          <Input
            id="pos-qty"
            type="number"
            min={1}
            max={20}
            value={quantityNeeded}
            onChange={(e) => setQuantityNeeded(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
          {isPending && <Loader2 className="animate-spin" />}
          Add Position
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Position row
// ---------------------------------------------------------------------------

function PositionRow({
  position,
  isEditing,
  onEdit,
  canManage,
}: {
  position: Position;
  isEditing: boolean;
  onEdit: () => void;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggleActive() {
    startTransition(async () => {
      const result = await updatePosition({
        id: position.id,
        isActive: !position.is_active,
      });
      if ("error" in result) {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePosition(position.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Position "${position.name}" deleted`);
      }
    });
  }

  if (isEditing && canManage) {
    return <EditPositionForm position={position} onClose={onEdit} />;
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
        !position.is_active ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{position.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {position.category && (
              <Badge variant="secondary" className="text-xs">
                {position.category}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Qty: {position.quantity_needed}
            </span>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={position.is_active}
            onCheckedChange={handleToggleActive}
            disabled={isPending}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onEdit}
            disabled={isPending}
          >
            <span className="text-xs">Edit</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-xs" disabled={isPending}>
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Position</AlertDialogTitle>
                <AlertDialogDescription>
                  Delete &quot;{position.name}&quot;? This will also remove all
                  related skill assignments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit position form (inline)
// ---------------------------------------------------------------------------

function EditPositionForm({
  position,
  onClose,
}: {
  position: Position;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(position.name);
  const [category, setCategory] = useState(position.category ?? "");
  const [quantityNeeded, setQuantityNeeded] = useState(
    position.quantity_needed,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await updatePosition({
        id: position.id,
        name: name.trim(),
        category: category.trim() || undefined,
        quantityNeeded,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Position updated");
      onClose();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          placeholder="Position name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          type="number"
          min={1}
          max={20}
          value={quantityNeeded}
          onChange={(e) => setQuantityNeeded(Number(e.target.value))}
        />
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
          {isPending && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByCategory(positions: Position[]) {
  const groups: Record<string, Position[]> = {};
  for (const p of positions) {
    const key = p.category ?? "__uncategorized__";
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}
