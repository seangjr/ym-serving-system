"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
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
import { createRecurringServices } from "@/lib/services/actions";
import { generateRecurringDates } from "@/lib/services/recurrence";
import {
  type CreateRecurringInput,
  createRecurringSchema,
} from "@/lib/services/schemas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecurringServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceTypes: { id: string; name: string; label: string; color: string }[];
}

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecurringServiceDialog({
  open,
  onOpenChange,
  serviceTypes,
}: RecurringServiceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const form = useForm<CreateRecurringInput>({
    resolver: zodResolver(createRecurringSchema),
    defaultValues: {
      titleTemplate: "",
      frequency: "weekly",
      startDate: "",
      endDate: "",
      startTime: "",
    },
  });

  const frequency = form.watch("frequency");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  // Compute preview count client-side
  const previewCount = useMemo(() => {
    if (!frequency || !startDate || !endDate) return 0;
    try {
      const dates = generateRecurringDates({
        frequency,
        startDate,
        endDate,
      });
      return dates.length;
    } catch {
      return 0;
    }
  }, [frequency, startDate, endDate]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) {
      setServerError(null);
      form.reset({
        titleTemplate: "",
        frequency: "weekly",
        startDate: "",
        endDate: "",
        startTime: "",
      });
    }
  }

  function handleSubmit(values: CreateRecurringInput) {
    setServerError(null);

    if (previewCount > 52) {
      setServerError("Maximum 52 services per pattern. Adjust end date.");
      return;
    }

    startTransition(async () => {
      const result = await createRecurringServices(values);

      if ("error" in result) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(`Created ${result.count} services`);
      onOpenChange(false);
      form.reset();
    });
  }

  const startDateValue = form.watch("startDate");
  const endDateValue = form.watch("endDate");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Recurring Services</DialogTitle>
          <DialogDescription>
            Generate multiple services from a recurring pattern.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Title Template */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="rec-title">Title Template</Label>
            <Input
              id="rec-title"
              placeholder="e.g. Sunday Morning Service"
              {...form.register("titleTemplate")}
              aria-invalid={!!form.formState.errors.titleTemplate}
            />
            {form.formState.errors.titleTemplate && (
              <p className="text-sm text-destructive">
                {form.formState.errors.titleTemplate.message}
              </p>
            )}
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Frequency */}
            <div className="flex flex-col gap-2">
              <Label>Frequency</Label>
              <Select
                value={form.watch("frequency")}
                onValueChange={(value) =>
                  form.setValue(
                    "frequency",
                    value as "weekly" | "biweekly" | "monthly",
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-48">
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day of Week */}
            <div className="flex flex-col gap-2">
              <Label>Day of Week</Label>
              <Select
                value={
                  form.watch("dayOfWeek") !== undefined
                    ? String(form.watch("dayOfWeek"))
                    : ""
                }
                onValueChange={(value) =>
                  form.setValue(
                    "dayOfWeek",
                    value ? Number(value) : undefined,
                    {
                      shouldValidate: true,
                    },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Auto (from start date)" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-48">
                  {DAY_LABELS.map((label, i) => (
                    <SelectItem key={label} value={String(i)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional. Derived from start date if not set.
              </p>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-2">
              <Label>Start Date</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {startDateValue
                      ? format(parseISO(startDateValue), "PPP")
                      : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      startDateValue ? parseISO(startDateValue) : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        form.setValue("startDate", format(date, "yyyy-MM-dd"), {
                          shouldValidate: true,
                        });
                      }
                      setStartDateOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-2">
              <Label>End Date</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {endDateValue
                      ? format(parseISO(endDateValue), "PPP")
                      : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDateValue ? parseISO(endDateValue) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        form.setValue("endDate", format(date, "yyyy-MM-dd"), {
                          shouldValidate: true,
                        });
                      }
                      setEndDateOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>

            {/* Start Time */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="rec-start-time">Start Time</Label>
              <Input
                id="rec-start-time"
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
              <Label htmlFor="rec-end-time">End Time</Label>
              <Input
                id="rec-end-time"
                type="time"
                {...form.register("endTime")}
              />
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
          </div>

          {/* Preview count */}
          {previewCount > 0 && (
            <div
              className={`rounded-md border p-3 text-sm ${
                previewCount > 52
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border bg-muted/50 text-muted-foreground"
              }`}
            >
              {previewCount > 52 ? (
                <>
                  Maximum 52 services per pattern. Currently {previewCount}{" "}
                  would be created. Adjust the end date.
                </>
              ) : (
                <>
                  This will create <strong>{previewCount}</strong>{" "}
                  {previewCount === 1 ? "service" : "services"}.
                </>
              )}
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || previewCount === 0 || previewCount > 52}
            >
              {isPending && <Loader2 className="animate-spin" />}
              Create{" "}
              {previewCount > 0 ? `${previewCount} Services` : "Services"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
