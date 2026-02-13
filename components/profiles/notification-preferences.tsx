"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPreferences } from "@/lib/profiles/actions";
import {
  type NotificationPreferencesInput,
  notificationPreferencesSchema,
} from "@/lib/profiles/schemas";

interface NotificationPreferencesProps {
  initialPreferences: {
    notify_email: boolean;
    notify_assignment_changes: boolean;
    reminder_days_before: number;
  };
}

export function NotificationPreferences({
  initialPreferences,
}: NotificationPreferencesProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      notify_email: initialPreferences.notify_email,
      notify_assignment_changes: initialPreferences.notify_assignment_changes,
      reminder_days_before: initialPreferences.reminder_days_before,
    },
  });

  function onSubmit(data: NotificationPreferencesInput) {
    startTransition(async () => {
      const result = await updateNotificationPreferences(data);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Notification preferences updated");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Choose how and when you want to be notified about serving activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="notify_email"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Email Notifications
                    </FormLabel>
                    <FormDescription>
                      Receive email notifications about service updates and
                      announcements.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notify_assignment_changes"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Assignment Changes
                    </FormLabel>
                    <FormDescription>
                      Notify me when my serving assignments are added, changed,
                      or removed.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminder_days_before"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remind Me Before Service</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Select reminder timing" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="max-h-48">
                      <SelectItem value="0">No reminder</SelectItem>
                      {Array.from({ length: 14 }, (_, i) => i + 1).map(
                        (days) => (
                          <SelectItem key={days} value={String(days)}>
                            {days} {days === 1 ? "day" : "days"} before
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Get a reminder notification before your upcoming service
                    assignment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Preferences
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
