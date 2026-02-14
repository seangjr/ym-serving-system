"use server";

import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { getUserRole, isAdmin, isAdminOrCommittee } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateRecurringDates } from "./recurrence";
import {
  createRecurringSchema,
  createServiceSchema,
  duplicateServiceSchema,
  serviceTypeSchema,
  updateServiceSchema,
  updateServiceTypeSchema,
} from "./schemas";

// ---------------------------------------------------------------------------
// Service CRUD
// ---------------------------------------------------------------------------

export async function createService(
  data: unknown,
): Promise<{ success: true; serviceId: string } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = createServiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid service data.",
    };
  }

  const admin = createAdminClient();
  const { data: service, error } = await admin
    .from("services")
    .insert({
      title: parsed.data.title,
      service_date: parsed.data.serviceDate,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime || null,
      duration_minutes: parsed.data.durationMinutes ?? null,
      service_type_id: parsed.data.serviceTypeId || null,
      rehearsal_date: parsed.data.rehearsalDate || null,
      rehearsal_time: parsed.data.rehearsalTime || null,
      rehearsal_notes: parsed.data.rehearsalNotes || null,
      notes: parsed.data.notes || null,
      created_by: memberId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true, serviceId: service.id };
}

export async function updateService(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = updateServiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid service data.",
    };
  }

  const { id, ...fields } = parsed.data;

  // Map camelCase to snake_case for the DB columns
  const updates: Record<string, unknown> = {};
  if (fields.title !== undefined) updates.title = fields.title;
  if (fields.serviceDate !== undefined)
    updates.service_date = fields.serviceDate;
  if (fields.startTime !== undefined) updates.start_time = fields.startTime;
  if (fields.endTime !== undefined) updates.end_time = fields.endTime;
  if (fields.durationMinutes !== undefined)
    updates.duration_minutes = fields.durationMinutes;
  if (fields.serviceTypeId !== undefined)
    updates.service_type_id = fields.serviceTypeId;
  if (fields.rehearsalDate !== undefined)
    updates.rehearsal_date = fields.rehearsalDate;
  if (fields.rehearsalTime !== undefined)
    updates.rehearsal_time = fields.rehearsalTime;
  if (fields.rehearsalNotes !== undefined)
    updates.rehearsal_notes = fields.rehearsalNotes;
  if (fields.notes !== undefined) updates.notes = fields.notes;

  const admin = createAdminClient();
  const { error } = await admin.from("services").update(updates).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteService(
  serviceId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  // Validate UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(serviceId)) {
    return { error: "Invalid service ID." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("services").delete().eq("id", serviceId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function duplicateService(
  data: unknown,
): Promise<{ success: true; serviceId: string } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = duplicateServiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid duplicate data.",
    };
  }

  const admin = createAdminClient();

  // Fetch source service
  const { data: source, error: fetchError } = await admin
    .from("services")
    .select("*")
    .eq("id", parsed.data.sourceServiceId)
    .single();

  if (fetchError || !source) {
    return { error: "Source service not found." };
  }

  // Insert new service with same fields but new date
  // Do NOT copy recurrence_pattern_id
  const { data: newService, error: insertError } = await admin
    .from("services")
    .insert({
      title: source.title,
      service_date: parsed.data.targetDate,
      start_time: source.start_time,
      end_time: source.end_time,
      duration_minutes: source.duration_minutes,
      service_type_id: source.service_type_id,
      rehearsal_date: null, // Reset rehearsal for duplicated service
      rehearsal_time: null,
      rehearsal_notes: null,
      notes: source.notes,
      is_cancelled: false,
      created_by: memberId,
      // Phase 4: Also copy assignments. Phase 7: Also copy setlist items.
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  revalidatePath("/dashboard");
  return { success: true, serviceId: newService.id };
}

// ---------------------------------------------------------------------------
// Recurring services
// ---------------------------------------------------------------------------

export async function createRecurringServices(
  data: unknown,
): Promise<{ success: true; count: number } | { error: string }> {
  const supabase = await createClient();
  const { role, memberId } = await getUserRole(supabase);
  if (!isAdminOrCommittee(role)) {
    return { error: "Unauthorized. Admin or Committee access required." };
  }

  const parsed = createRecurringSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid recurrence data.",
    };
  }

  const admin = createAdminClient();

  // Generate recurring dates
  const dates = generateRecurringDates({
    frequency: parsed.data.frequency,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  });

  if (dates.length === 0) {
    return { error: "No dates generated for the given range." };
  }

  // Insert recurrence pattern record
  const { data: pattern, error: patternError } = await admin
    .from("service_recurrence_patterns")
    .insert({
      frequency: parsed.data.frequency,
      day_of_week: parsed.data.dayOfWeek ?? null,
      service_type_id: parsed.data.serviceTypeId || null,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime || null,
      duration_minutes: parsed.data.durationMinutes ?? null,
      title_template: parsed.data.titleTemplate,
      created_by: memberId,
    })
    .select("id")
    .single();

  if (patternError) return { error: patternError.message };

  // Bulk insert services (one per generated date)
  const serviceRows = dates.map((date) => ({
    title: parsed.data.titleTemplate,
    service_date: format(date, "yyyy-MM-dd"),
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime || null,
    duration_minutes: parsed.data.durationMinutes ?? null,
    service_type_id: parsed.data.serviceTypeId || null,
    recurrence_pattern_id: pattern.id,
    created_by: memberId,
  }));

  const { error: insertError } = await admin
    .from("services")
    .insert(serviceRows);

  if (insertError) return { error: insertError.message };

  revalidatePath("/dashboard");
  return { success: true, count: dates.length };
}

// ---------------------------------------------------------------------------
// Service type management (admin only)
// ---------------------------------------------------------------------------

export async function createServiceType(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdmin(role)) {
    return { error: "Unauthorized. Admin access required." };
  }

  const parsed = serviceTypeSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid service type data.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("service_types").insert({
    name: parsed.data.name,
    label: parsed.data.label,
    color: parsed.data.color,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateServiceType(
  data: unknown,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdmin(role)) {
    return { error: "Unauthorized. Admin access required." };
  }

  const parsed = updateServiceTypeSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid service type data.",
    };
  }

  const { id, ...fields } = parsed.data;

  const updates: Record<string, unknown> = {};
  if (fields.name !== undefined) updates.name = fields.name;
  if (fields.label !== undefined) updates.label = fields.label;
  if (fields.color !== undefined) updates.color = fields.color;

  const admin = createAdminClient();
  const { error } = await admin
    .from("service_types")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteServiceType(
  serviceTypeId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { role } = await getUserRole(supabase);
  if (!isAdmin(role)) {
    return { error: "Unauthorized. Admin access required." };
  }

  // Validate UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(serviceTypeId)) {
    return { error: "Invalid service type ID." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("service_types")
    .delete()
    .eq("id", serviceTypeId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
