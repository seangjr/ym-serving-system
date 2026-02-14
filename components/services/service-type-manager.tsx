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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createServiceType,
  deleteServiceType,
  updateServiceType,
} from "@/lib/services/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceTypeItem {
  id: string;
  name: string;
  label: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

interface ServiceTypeManagerProps {
  serviceTypes: ServiceTypeItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceTypeManager({ serviceTypes }: ServiceTypeManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {serviceTypes.length} {serviceTypes.length === 1 ? "type" : "types"}{" "}
          defined
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="size-4" />
          Add Type
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && <AddTypeForm onComplete={() => setShowAddForm(false)} />}

      {/* Type list */}
      {serviceTypes.length === 0 && !showAddForm ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No service types yet. Add your first type to categorize services.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {serviceTypes.map((st) => (
            <TypeRow
              key={st.id}
              serviceType={st}
              isEditing={editingId === st.id}
              onEdit={() => setEditingId(editingId === st.id ? null : st.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add type form (inline)
// ---------------------------------------------------------------------------

function AddTypeForm({ onComplete }: { onComplete: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#6366f1");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

    const name = label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    startTransition(async () => {
      const result = await createServiceType({
        name,
        label: label.trim(),
        color,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(`Service type "${label}" added`);
      setLabel("");
      setColor("#6366f1");
      onComplete();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="st-label" className="text-xs">
            Label
          </Label>
          <Input
            id="st-label"
            placeholder="e.g. Sunday Morning"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="st-color" className="text-xs">
            Colour
          </Label>
          <div className="flex items-center gap-2">
            <span
              className="size-6 shrink-0 rounded border"
              style={{ backgroundColor: color }}
            />
            <Input
              id="st-color"
              placeholder="#6366f1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !label.trim()}>
          {isPending && <Loader2 className="animate-spin" />}
          Add Type
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Type row
// ---------------------------------------------------------------------------

function TypeRow({
  serviceType,
  isEditing,
  onEdit,
}: {
  serviceType: ServiceTypeItem;
  isEditing: boolean;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteServiceType(serviceType.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Service type "${serviceType.label}" deleted`);
      }
    });
  }

  if (isEditing) {
    return <EditTypeForm serviceType={serviceType} onClose={onEdit} />;
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
        !serviceType.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: serviceType.color }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{serviceType.label}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onEdit} disabled={isPending}>
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service Type</AlertDialogTitle>
              <AlertDialogDescription>
                Delete &quot;{serviceType.label}&quot;? Services using this type
                will lose their type association.
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit type form (inline)
// ---------------------------------------------------------------------------

function EditTypeForm({
  serviceType,
  onClose,
}: {
  serviceType: ServiceTypeItem;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState(serviceType.label);
  const [color, setColor] = useState(serviceType.color);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

    const name = label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    startTransition(async () => {
      const result = await updateServiceType({
        id: serviceType.id,
        name,
        label: label.trim(),
        color,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Service type updated");
      onClose();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-3"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`st-edit-label-${serviceType.id}`}
            className="text-xs"
          >
            Label
          </Label>
          <Input
            id={`st-edit-label-${serviceType.id}`}
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`st-edit-color-${serviceType.id}`}
            className="text-xs"
          >
            Colour
          </Label>
          <div className="flex items-center gap-2">
            <span
              className="size-6 shrink-0 rounded border"
              style={{ backgroundColor: color }}
            />
            <Input
              id={`st-edit-color-${serviceType.id}`}
              placeholder="#6366f1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !label.trim()}>
          {isPending && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
}
