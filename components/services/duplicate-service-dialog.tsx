"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { duplicateService } from "@/lib/services/actions";
import {
  type DuplicateServiceInput,
  duplicateServiceSchema,
} from "@/lib/services/schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DuplicateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceService: { id: string; title: string; serviceDate: string };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DuplicateServiceDialog({
  open,
  onOpenChange,
  sourceService,
}: DuplicateServiceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  const form = useForm<DuplicateServiceInput>({
    resolver: zodResolver(duplicateServiceSchema),
    defaultValues: {
      sourceServiceId: sourceService.id,
      targetDate: "",
    },
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) {
      setServerError(null);
      form.reset({
        sourceServiceId: sourceService.id,
        targetDate: "",
      });
    }
  }

  function handleSubmit(values: DuplicateServiceInput) {
    setServerError(null);

    startTransition(async () => {
      const result = await duplicateService({
        sourceServiceId: sourceService.id,
        targetDate: values.targetDate,
      });

      if ("error" in result) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Service duplicated");
      onOpenChange(false);
      form.reset();
    });
  }

  const targetDateValue = form.watch("targetDate");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Service</DialogTitle>
          <DialogDescription>
            Copy this service to a new date. Rehearsal details will not be
            copied.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Source service info */}
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-sm font-medium">{sourceService.title}</p>
            <p className="text-xs text-muted-foreground">
              Original date:{" "}
              {format(parseISO(sourceService.serviceDate), "PPP")}
            </p>
          </div>

          {/* Target Date */}
          <div className="flex flex-col gap-2">
            <Label>New Date</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {targetDateValue
                    ? format(parseISO(targetDateValue), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    targetDateValue ? parseISO(targetDateValue) : undefined
                  }
                  onSelect={(date) => {
                    if (date) {
                      form.setValue("targetDate", format(date, "yyyy-MM-dd"), {
                        shouldValidate: true,
                      });
                    }
                    setDateOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.targetDate && (
              <p className="text-sm text-destructive">
                {form.formState.errors.targetDate.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending || !targetDateValue}>
              {isPending && <Loader2 className="animate-spin" />}
              Duplicate Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
