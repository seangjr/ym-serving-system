"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { CalendarClock, CalendarIcon } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createRecurringPattern } from "@/lib/availability/actions";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Schema (client-side for form validation)
// ---------------------------------------------------------------------------

const formSchema = z
  .object({
    frequency: z.enum(["weekly", "biweekly", "monthly", "nth_weekday"]),
    dayOfWeek: z.number().int().min(0).max(6),
    nthOccurrence: z.number().int().min(1).max(5).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")])
      .optional(),
    reason: z.union([z.string().max(500), z.literal("")]).optional(),
    noEndDate: z.boolean(),
  })
  .refine(
    (data) =>
      data.frequency !== "nth_weekday" || data.nthOccurrence !== undefined,
    {
      message: "Occurrence is required for Nth Weekday frequency.",
      path: ["nthOccurrence"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const NTH_LABELS = ["1st", "2nd", "3rd", "4th", "Last"];

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every Other Week",
  monthly: "Monthly (same day of month)",
  nth_weekday: "Nth Weekday of Month",
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function describePattern(values: Partial<FormValues>): string {
  const dayName =
    values.dayOfWeek !== undefined ? DAY_NAMES[values.dayOfWeek] : "...";
  switch (values.frequency) {
    case "weekly":
      return `Every ${dayName}`;
    case "biweekly":
      return `Every other ${dayName}${values.startDate ? ` starting ${format(parseISO(values.startDate), "MMM d")}` : ""}`;
    case "monthly":
      return values.startDate
        ? `${parseISO(values.startDate).getDate()}th of every month`
        : "Same day of every month";
    case "nth_weekday": {
      const nth =
        values.nthOccurrence !== undefined
          ? (NTH_LABELS[values.nthOccurrence - 1] ??
            `${values.nthOccurrence}th`)
          : "...";
      return `${nth} ${dayName} of every month`;
    }
    default:
      return "Select a frequency...";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RecurringPatternDialogProps {
  targetMemberId: string;
}

export function RecurringPatternDialog({
  targetMemberId,
}: RecurringPatternDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [startDateOpen, setStartDateOpen] = React.useState(false);
  const [endDateOpen, setEndDateOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frequency: "weekly",
      dayOfWeek: 0,
      nthOccurrence: undefined,
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      reason: "",
      noEndDate: true,
    },
  });

  const watchFrequency = form.watch("frequency");
  const watchAll = form.watch();

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createRecurringPattern({
        memberId: targetMemberId,
        frequency: values.frequency,
        dayOfWeek: values.dayOfWeek,
        nthOccurrence:
          values.frequency === "nth_weekday" ? values.nthOccurrence : undefined,
        startDate: values.startDate,
        endDate: values.noEndDate ? undefined : values.endDate || undefined,
        reason: values.reason || undefined,
      });

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Recurring pattern created.");
        setOpen(false);
        form.reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <CalendarClock className="size-4 mr-2" />
          Add Regular Unavailability
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Regular Unavailability</DialogTitle>
          <DialogDescription>
            Set days you&apos;re regularly unable to serve. These will show as
            warnings when team leads try to schedule you.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Preview */}
          <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
            {describePattern(watchAll)}
          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-1.5">
            <Label>Frequency</Label>
            <Select
              value={watchFrequency}
              onValueChange={(v) =>
                form.setValue("frequency", v as FormValues["frequency"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day of Week */}
          <div className="flex flex-col gap-1.5">
            <Label>Day of Week</Label>
            <Select
              value={String(form.watch("dayOfWeek"))}
              onValueChange={(v) =>
                form.setValue("dayOfWeek", Number(v), { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {DAY_NAMES.map((name, i) => (
                  <SelectItem key={name} value={String(i)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nth Occurrence (only for nth_weekday) */}
          {watchFrequency === "nth_weekday" && (
            <div className="flex flex-col gap-1.5">
              <Label>Occurrence</Label>
              <Select
                value={
                  form.watch("nthOccurrence") !== undefined
                    ? String(form.watch("nthOccurrence"))
                    : ""
                }
                onValueChange={(v) =>
                  form.setValue("nthOccurrence", Number(v), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select occurrence" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {NTH_LABELS.map((label, i) => (
                    <SelectItem key={label} value={String(i + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.nthOccurrence && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.nthOccurrence.message}
                </p>
              )}
            </div>
          )}

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <Label>Start Date</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("startDate") && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {form.watch("startDate")
                    ? format(parseISO(form.watch("startDate")), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    form.watch("startDate")
                      ? parseISO(form.watch("startDate"))
                      : undefined
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
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>End Date</Label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.watch("noEndDate")}
                  onChange={(e) => {
                    form.setValue("noEndDate", e.target.checked);
                    if (e.target.checked) {
                      form.setValue("endDate", "");
                    }
                  }}
                  className="rounded"
                />
                No end date (ongoing)
              </label>
            </div>
            {!form.watch("noEndDate") && (
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("endDate") && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {form.watch("endDate")
                      ? format(parseISO(form.watch("endDate") as string), "PPP")
                      : "Pick an end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      form.watch("endDate")
                        ? parseISO(form.watch("endDate") as string)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        form.setValue("endDate", format(date, "yyyy-MM-dd"), {
                          shouldValidate: true,
                        });
                      }
                      setEndDateOpen(false);
                    }}
                    disabled={{
                      before: form.watch("startDate")
                        ? parseISO(form.watch("startDate"))
                        : new Date(),
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="e.g. Work shift, class schedule..."
              {...form.register("reason")}
              className="min-h-12"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Pattern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
