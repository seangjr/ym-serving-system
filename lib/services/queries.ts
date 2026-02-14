import { endOfMonth, format, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ServiceType {
  id: string;
  name: string;
  label: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ServiceSummary {
  id: string;
  title: string;
  service_date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_cancelled: boolean;
  notes: string | null;
  rehearsal_date: string | null;
  rehearsal_time: string | null;
  rehearsal_notes: string | null;
  recurrence_pattern_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  service_types: {
    id: string;
    name: string;
    label: string;
    color: string;
  } | null;
}

export interface ServiceDetail extends ServiceSummary {
  service_type_id: string | null;
}

export interface ServiceStats {
  upcomingCount: number;
  unassignedPositions: number; // Phase 4 placeholder
  pendingConfirmations: number; // Phase 4 placeholder
}

// ---------------------------------------------------------------------------
// Queries (all use RLS-protected client)
// ---------------------------------------------------------------------------

/**
 * Get all services for a given month/year, ordered by date and time.
 * Joins service_types for display info.
 */
export async function getServicesByMonth(
  year: number,
  month: number,
): Promise<ServiceSummary[]> {
  const supabase = await createClient();

  // date-fns months are 0-indexed, but our API uses 1-indexed months
  const monthDate = new Date(year, month - 1, 1);
  const rangeStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const rangeEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("services")
    .select(
      `
      *,
      service_types(id, name, label, color)
    `,
    )
    .gte("service_date", rangeStart)
    .lte("service_date", rangeEnd)
    .order("service_date")
    .order("start_time");

  if (error) throw error;
  return (data ?? []) as ServiceSummary[];
}

/**
 * Get upcoming services (not cancelled), ordered by date.
 * Joins service_types for display info.
 */
export async function getUpcomingServices(
  limit = 10,
): Promise<ServiceSummary[]> {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("services")
    .select(
      `
      *,
      service_types(id, name, label, color)
    `,
    )
    .gte("service_date", today)
    .eq("is_cancelled", false)
    .order("service_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ServiceSummary[];
}

/**
 * Get a single service by ID with service type info.
 * Returns null if not found.
 */
export async function getServiceById(
  serviceId: string,
): Promise<ServiceDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select(
      `
      *,
      service_types(id, name, label, color)
    `,
    )
    .eq("id", serviceId)
    .maybeSingle();

  if (error) throw error;
  return data as ServiceDetail | null;
}

/**
 * Get all active service types, ordered by sort_order.
 */
export async function getServiceTypes(): Promise<ServiceType[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []) as ServiceType[];
}

/**
 * Get basic service stats for the dashboard.
 * Phase 4 will add unassignedPositions and pendingConfirmations.
 */
export async function getServiceStats(): Promise<ServiceStats> {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { count, error } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .gte("service_date", today)
    .eq("is_cancelled", false);

  if (error) throw error;

  return {
    upcomingCount: count ?? 0,
    unassignedPositions: 0, // Phase 4: count positions without assignments
    pendingConfirmations: 0, // Phase 4: count unconfirmed assignments
  };
}
