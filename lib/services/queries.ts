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
  unassignedPositions: number;
  pendingConfirmations: number;
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
 * Get all service types (including inactive), ordered by sort_order.
 * Used by admin type management UI.
 */
export async function getAllServiceTypes(): Promise<ServiceType[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_types")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return (data ?? []) as ServiceType[];
}

/**
 * Get service stats for the dashboard with real assignment data.
 *
 * - upcomingCount: number of upcoming non-cancelled services
 * - unassignedPositions: service_positions for upcoming services without assignments
 * - pendingConfirmations: service_assignments with status='pending' for upcoming services
 */
export async function getServiceStats(): Promise<ServiceStats> {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // 1. Count upcoming non-cancelled services
  const { count: upcomingCount, error: upcomingError } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .gte("service_date", today)
    .eq("is_cancelled", false);

  if (upcomingError) throw upcomingError;

  // 2. Get IDs of upcoming non-cancelled services
  const { data: upcomingServices, error: idsError } = await supabase
    .from("services")
    .select("id")
    .gte("service_date", today)
    .eq("is_cancelled", false);

  if (idsError) throw idsError;

  const upcomingIds = (upcomingServices ?? []).map((s) => s.id);

  if (upcomingIds.length === 0) {
    return {
      upcomingCount: upcomingCount ?? 0,
      unassignedPositions: 0,
      pendingConfirmations: 0,
    };
  }

  // 3. Count total service_positions for upcoming services
  const { count: totalPositions, error: posError } = await supabase
    .from("service_positions")
    .select("id", { count: "exact", head: true })
    .in("service_id", upcomingIds);

  if (posError) throw posError;

  // 4. Count service_assignments for upcoming services (via service_positions join)
  const { count: totalAssignments, error: assignError } = await supabase
    .from("service_assignments")
    .select("id, service_positions!inner(service_id)", {
      count: "exact",
      head: true,
    })
    .in("service_positions.service_id", upcomingIds);

  if (assignError) throw assignError;

  // 5. Count pending service_assignments for upcoming services
  const { count: pendingCount, error: pendingError } = await supabase
    .from("service_assignments")
    .select("id, service_positions!inner(service_id)", {
      count: "exact",
      head: true,
    })
    .in("service_positions.service_id", upcomingIds)
    .eq("status", "pending");

  if (pendingError) throw pendingError;

  return {
    upcomingCount: upcomingCount ?? 0,
    unassignedPositions: (totalPositions ?? 0) - (totalAssignments ?? 0),
    pendingConfirmations: pendingCount ?? 0,
  };
}
