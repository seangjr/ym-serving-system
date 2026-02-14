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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createService, updateService } from "@/lib/services/actions";
import {
  type CreateServiceInput,
  createServiceSchema,
} from "@/lib/services/schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceTypes: { id: string; name: string; label: string; color: string }[];
  editService?: {
    id: string;
    title: string;
    serviceDate: string;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    serviceTypeId?: string;
    rehearsalDate?: string;
    rehearsalTime?: string;
    rehearsalNotes?: string;
    notes?: string;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceFormDialog({
  open,
  onOpenChange,
  serviceTypes,
  editService,
}: ServiceFormDialogProps) {
  const isEdit = !!editService;
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Date picker popover state
  const [serviceDateOpen, setServiceDateOpen] = useState(false);
  const [rehearsalDateOpen, setRehearsalDateOpen] = useState(false);

  const form = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: editService
      ? {
          title: editService.title,
          serviceDate: editService.serviceDate,
          startTime: editService.startTime,
          endTime: editService.endTime ?? undefined,
          durationMinutes: editService.durationMinutes ?? undefined,
          serviceTypeId: editService.serviceTypeId ?? undefined,
          rehearsalDate: editService.rehearsalDate ?? undefined,
          rehearsalTime: editService.rehearsalTime ?? undefined,
          rehearsalNotes: editService.rehearsalNotes ?? undefined,
          notes: editService.notes ?? undefined,
        }
      : {
          title: "",
          serviceDate: "",
          startTime: "",
        },
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) {
      setServerError(null);
      form.reset(
        editService
          ? {
              title: editService.title,
              serviceDate: editService.serviceDate,
              startTime: editService.startTime,
              endTime: editService.endTime ?? undefined,
              durationMinutes: editService.durationMinutes ?? undefined,
              serviceTypeId: editService.serviceTypeId ?? undefined,
              rehearsalDate: editService.rehearsalDate ?? undefined,
              rehearsalTime: editService.rehearsalTime ?? undefined,
              rehearsalNotes: editService.rehearsalNotes ?? undefined,
              notes: editService.notes ?? undefined,
            }
          : {
              title: "",
              serviceDate: "",
              startTime: "",
            },
      );
    }
  }

  function handleSubmit(values: CreateServiceInput) {
    setServerError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateService({ ...values, id: editService.id })
        : await createService(values);

      if ("error" in result) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Service updated" : "Service created");
      onOpenChange(false);
      form.reset();
    });
  }

  const serviceDateValue = form.watch("serviceDate");
  const rehearsalDateValue = form.watch("rehearsalDate");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Service" : "Create Service"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this service's details."
              : "Add a new service to the schedule."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="svc-title">Title</Label>
            <Input
              id="svc-title"
              placeholder="e.g. Sunday Morning Service"
              {...form.register("title")}
              aria-invalid={!!form.formState.errors.title}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Two-column grid for main fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Service Date */}
            <div className="flex flex-col gap-2">
              <Label>Service Date</Label>
              <Popover
                open={serviceDateOpen}
                onOpenChange={setServiceDateOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {serviceDateValue
                      ? format(parseISO(serviceDateValue), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      serviceDateValue
                        ? parseISO(serviceDateValue)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        form.setValue(
                          "serviceDate",
                          format(date, "yyyy-MM-dd"),
                          { shouldValidate: true },
                        );
                      }
                      setServiceDateOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.serviceDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.serviceDate.message}
                </p>
              )}
            </div>

            {/* Service Type */}
            <div className="flex flex-col gap-2">
              <Label>Service Type</Label>
              <Select
                value={form.watch("serviceTypeId") ?? ""}
                onValueChange={(value) =>
                  form.setValue("serviceTypeId", value || undefined, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-48">
                  {serviceTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Time */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="svc-start">Start Time</Label>
              <Input
                id="svc-start"
                type="time"
                {...form.register("startTime")}
                aria-invalid={!!form.formState.errors.startTime}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startTime.message}
                </p>
              )}
            </div>

            {/* End Time */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="svc-end">End Time</Label>
              <Input
                id="svc-end"
                type="time"
                {...form.register("endTime")}
              />
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="svc-duration">Duration (minutes)</Label>
              <Input
                id="svc-duration"
                type="number"
                placeholder="e.g. 90"
                {...form.register("durationMinutes", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Used if end time is not set.
              </p>
            </div>
          </div>

          {/* Rehearsal Details */}
          <div className="flex flex-col gap-3 rounded-md border p-4">
            <h3 className="text-sm font-medium">Rehearsal Details</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Rehearsal Date */}
              <div className="flex flex-col gap-2">
                <Label>Rehearsal Date</Label>
                <Popover
                  open={rehearsalDateOpen}
                  onOpenChange={setRehearsalDateOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {rehearsalDateValue
                        ? format(parseISO(rehearsalDateValue), "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        rehearsalDateValue
                          ? parseISO(rehearsalDateValue)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          form.setValue(
                            "rehearsalDate",
                            format(date, "yyyy-MM-dd"),
                            { shouldValidate: true },
                          );
                        }
                        setRehearsalDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Rehearsal Time */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="svc-reh-time">Rehearsal Time</Label>
                <Input
                  id="svc-reh-time"
                  type="time"
                  {...form.register("rehearsalTime")}
                />
              </div>
            </div>

            {/* Rehearsal Notes */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="svc-reh-notes">Rehearsal Notes</Label>
              <Textarea
                id="svc-reh-notes"
                placeholder="Any notes about the rehearsal..."
                {...form.register("rehearsalNotes")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="svc-notes">Notes</Label>
            <Textarea
              id="svc-notes"
              placeholder="Additional notes about the service..."
              {...form.register("notes")}
            />
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
