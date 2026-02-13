"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { type ReactNode, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTeam, updateTeam } from "@/lib/teams/actions";
import {
  type CreateTeamInput,
  createTeamSchema,
  type UpdateTeamInput,
} from "@/lib/teams/schemas";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TeamFormDialogProps {
  mode: "create" | "edit";
  team?: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
  };
  trigger: ReactNode;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamFormDialog({
  mode,
  team,
  trigger,
  onSuccess,
}: TeamFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = mode === "edit" && team;

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: isEdit ? team.name : "",
      description: isEdit ? (team.description ?? "") : "",
      color: isEdit ? (team.color ?? "#3b82f6") : "#3b82f6",
    },
  });

  function handleSubmit(values: CreateTeamInput) {
    setServerError(null);

    startTransition(async () => {
      let result: { success: true; teamId?: string } | { error: string };

      if (isEdit) {
        const updateData: UpdateTeamInput = { id: team.id, ...values };
        result = await updateTeam(updateData);
      } else {
        result = await createTeam(values);
      }

      if ("error" in result) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Team updated" : "Team created");
      setOpen(false);
      form.reset();
      onSuccess?.();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setServerError(null);
          form.reset({
            name: isEdit ? team.name : "",
            description: isEdit ? (team.description ?? "") : "",
            color: isEdit ? (team.color ?? "#3b82f6") : "#3b82f6",
          });
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Team" : "Create Team"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this team's details."
              : "Add a new serving team to manage."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="team-name">Name</Label>
            <Input
              id="team-name"
              placeholder="e.g. Worship Team"
              {...form.register("name")}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              placeholder="Brief description of this team..."
              {...form.register("description")}
              aria-invalid={!!form.formState.errors.description}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="team-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="team-color"
                type="color"
                className="h-9 w-12 cursor-pointer rounded-md border p-1"
                {...form.register("color")}
              />
              <Input
                placeholder="#3b82f6"
                className="flex-1"
                {...form.register("color")}
              />
            </div>
            {form.formState.errors.color && (
              <p className="text-sm text-destructive">
                {form.formState.errors.color.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
