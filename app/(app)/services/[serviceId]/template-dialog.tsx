"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteTemplate,
  fetchTemplates,
  loadTemplate,
  saveTemplate,
} from "@/lib/assignments/actions";
import type { SaveTemplateInput } from "@/lib/assignments/schemas";
import { saveTemplateSchema } from "@/lib/assignments/schemas";
import type { TemplateListItem } from "@/lib/assignments/types";

// ---------------------------------------------------------------------------
// SaveTemplateDialog
// ---------------------------------------------------------------------------

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  serviceId,
}: SaveTemplateDialogProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaveTemplateInput>({
    resolver: zodResolver(saveTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      serviceId,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({ name: "", description: "", serviceId });
    }
  }, [open, reset, serviceId]);

  function onSubmit(data: SaveTemplateInput) {
    startTransition(async () => {
      const result = await saveTemplate(data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Template saved");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save all position slots on this service as a reusable template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Template name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g. Standard Sunday Service"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="template-description"
              placeholder="Brief description of this template..."
              rows={2}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <input type="hidden" {...register("serviceId")} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// LoadTemplateDialog
// ---------------------------------------------------------------------------

interface LoadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceTypeId: string | null;
  hasExistingPositions: boolean;
}

export function LoadTemplateDialog({
  open,
  onOpenChange,
  serviceId,
  serviceTypeId,
  hasExistingPositions,
}: LoadTemplateDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Fetch templates when dialog opens (filtered by service type)
  useEffect(() => {
    if (!open) {
      setSelectedTemplateId(null);
      return;
    }

    setIsLoading(true);
    fetchTemplates(serviceTypeId ?? undefined)
      .then((data) => {
        setTemplates(data);
      })
      .catch(() => {
        toast.error("Failed to load templates");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [open, serviceTypeId]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  function handleLoad() {
    if (!selectedTemplateId) return;

    startTransition(async () => {
      const result = await loadTemplate({
        templateId: selectedTemplateId,
        serviceId,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Template loaded");
      onOpenChange(false);
    });
  }

  function handleDelete(templateId: string) {
    startTransition(async () => {
      const result = await deleteTemplate({ templateId });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
      }
      toast.success("Template deleted");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Load Template</DialogTitle>
          <DialogDescription>
            Select a template to apply to this service. This will replace all
            existing positions.
          </DialogDescription>
        </DialogHeader>

        {/* Template list */}
        <ScrollArea className="max-h-64">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed py-8">
              <p className="text-sm text-muted-foreground">
                No templates found
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                    selectedTemplateId === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {template.name}
                    </p>
                    {template.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{template.positionCount} positions</span>
                      <span>
                        {format(parseISO(template.createdAt), "d MMM yyyy")}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-8 shrink-0 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                    disabled={isPending}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                    <span className="sr-only">Delete template</span>
                  </Button>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Warning for existing positions */}
        {hasExistingPositions && selectedTemplate && (
          <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            This will replace all existing positions on this service.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleLoad}
            disabled={isPending || !selectedTemplateId}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Load Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
