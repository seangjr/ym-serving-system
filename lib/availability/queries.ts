import { eachDayOfInterval, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { expandRecurringPatterns, matchesRecurringPattern } from "./recurrence";
import type {
  BlackoutDate,
  RecurringPattern,
  TeamDateAvailability,
  UnavailableMember,
} from "./types";

// ---------------------------------------------------------------------------
// Row → domain type mappers
// ---------------------------------------------------------------------------

function toBlackoutDate(row: Record<string, unknown>): BlackoutDate {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    reason: row.reason as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
  };
}

function toRecurringPattern(row: Record<string, unknown>): RecurringPattern {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    frequency: row.frequency as RecurringPattern["frequency"],
    dayOfWeek: row.day_of_week as number,
    nthOccurrence: row.nth_occurrence as number | null,
    startDate: row.start_date as string,
    endDate: row.end_date as string | null,
    reason: row.reason as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Blackout date queries
// ---------------------------------------------------------------------------

/** Get all blackout dates for a member (own view), ordered by start_date desc. */
export async function getMyBlackouts(
  memberId: string,
): Promise<BlackoutDate[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_blackout_dates")
    .select("*")
    .eq("member_id", memberId)
    .order("start_date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toBlackoutDate);
}

/** Get all blackout dates for another member (same query, different semantic). */
export async function getMemberBlackouts(
  memberId: string,
): Promise<BlackoutDate[]> {
  return getMyBlackouts(memberId);
}

// ---------------------------------------------------------------------------
// Recurring pattern queries
// ---------------------------------------------------------------------------

/** Get all recurring patterns for a member, ordered by created_at desc. */
export async function getMyRecurringPatterns(
  memberId: string,
): Promise<RecurringPattern[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_recurring_unavailability")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toRecurringPattern);
}

/** Get all recurring patterns for another member. */
export async function getMemberRecurringPatterns(
  memberId: string,
): Promise<RecurringPattern[]> {
  return getMyRecurringPatterns(memberId);
}

// ---------------------------------------------------------------------------
// Batch availability check (critical for scheduling integration)
// ---------------------------------------------------------------------------

/**
 * Check which members are unavailable on a specific date.
 *
 * Returns a Map of memberId -> { reason, type }. Blackout dates take
 * precedence over recurring patterns when both match the same member.
 */
export async function getUnavailableMembersForDate(
  memberIds: string[],
  serviceDate: string,
): Promise<
  Map<string, { reason: string | null; type: "blackout" | "recurring" }>
> {
  if (memberIds.length === 0) return new Map();

  const unavailableMap = new Map<
    string,
    { reason: string | null; type: "blackout" | "recurring" }
  >();
  const supabase = await createClient();

  // 1. Check one-time blackout dates
  const { data: blackouts } = await supabase
    .from("member_blackout_dates")
    .select("member_id, reason")
    .in("member_id", memberIds)
    .lte("start_date", serviceDate)
    .gte("end_date", serviceDate);

  for (const b of blackouts ?? []) {
    unavailableMap.set(b.member_id, {
      reason: b.reason,
      type: "blackout",
    });
  }

  // 2. Check recurring patterns
  const { data: patterns } = await supabase
    .from("member_recurring_unavailability")
    .select(
      "member_id, frequency, day_of_week, nth_occurrence, start_date, end_date, reason",
    )
    .in("member_id", memberIds)
    .lte("start_date", serviceDate);

  const targetDate = parseISO(serviceDate);

  for (const p of patterns ?? []) {
    // Skip if past the pattern end date
    if (p.end_date && serviceDate > p.end_date) continue;

    if (matchesRecurringPattern(targetDate, p)) {
      // Blackout takes precedence -- only add recurring if not already marked
      if (!unavailableMap.has(p.member_id)) {
        unavailableMap.set(p.member_id, {
          reason: p.reason,
          type: "recurring",
        });
      }
    }
  }

  return unavailableMap;
}

// ---------------------------------------------------------------------------
// Team availability for overlay calendar
// ---------------------------------------------------------------------------

/**
 * Get availability data for a team across a date range.
 * Used for the team overlay calendar showing "X/Y available" per day.
 */
export async function getTeamAvailability(
  teamId: string,
  monthStart: string,
  monthEnd: string,
): Promise<TeamDateAvailability[]> {
  const supabase = await createClient();

  // 1. Get all team members
  const { data: teamMembers, error: membersError } = await supabase
    .from("team_members")
    .select("member_id, members(id, full_name)")
    .eq("team_id", teamId);

  if (membersError) throw membersError;
  if (!teamMembers || teamMembers.length === 0) return [];

  const memberIds = teamMembers.map(
    (tm: Record<string, unknown>) => tm.member_id as string,
  );
  const memberNameMap = new Map<string, string>();
  for (const tm of teamMembers) {
    const member = tm.members as unknown as {
      id: string;
      full_name: string;
    } | null;
    memberNameMap.set(tm.member_id as string, member?.full_name ?? "Unknown");
  }

  // 2. Get all blackouts for team members in date range
  const { data: blackouts } = await supabase
    .from("member_blackout_dates")
    .select("member_id, start_date, end_date, reason")
    .in("member_id", memberIds)
    .lte("start_date", monthEnd)
    .gte("end_date", monthStart);

  // 3. Get all recurring patterns for team members
  const { data: patterns } = await supabase
    .from("member_recurring_unavailability")
    .select(
      "member_id, frequency, day_of_week, nth_occurrence, start_date, end_date, reason",
    )
    .in("member_id", memberIds)
    .lte("start_date", monthEnd);

  // 4. Expand recurring patterns for the date range
  const expandedRecurring = expandRecurringPatterns(
    (patterns ?? []) as {
      member_id: string;
      frequency: "weekly" | "biweekly" | "monthly" | "nth_weekday";
      day_of_week: number;
      nth_occurrence: number | null;
      start_date: string;
      end_date: string | null;
    }[],
    parseISO(monthStart),
    parseISO(monthEnd),
  );

  // 5. Build per-day availability
  const days = eachDayOfInterval({
    start: parseISO(monthStart),
    end: parseISO(monthEnd),
  });

  const result: TeamDateAvailability[] = [];

  for (const day of days) {
    const dateKey = format(day, "yyyy-MM-dd");
    const unavailableMembers: UnavailableMember[] = [];
    const seen = new Set<string>();

    // Check blackout dates
    for (const b of blackouts ?? []) {
      if (
        b.start_date <= dateKey &&
        b.end_date >= dateKey &&
        !seen.has(b.member_id)
      ) {
        seen.add(b.member_id);
        unavailableMembers.push({
          memberId: b.member_id,
          memberName: memberNameMap.get(b.member_id) ?? "Unknown",
          reason: b.reason,
          type: "blackout",
        });
      }
    }

    // Check expanded recurring patterns
    const recurringMemberIds = expandedRecurring.get(dateKey);
    if (recurringMemberIds) {
      for (const mId of recurringMemberIds) {
        if (!seen.has(mId)) {
          seen.add(mId);
          // Find the matching pattern to get the reason
          const matchingPattern = (patterns ?? []).find(
            (p: Record<string, unknown>) => p.member_id === mId,
          );
          unavailableMembers.push({
            memberId: mId,
            memberName: memberNameMap.get(mId) ?? "Unknown",
            reason: (matchingPattern?.reason as string) ?? null,
            type: "recurring",
          });
        }
      }
    }

    result.push({
      date: dateKey,
      total: memberIds.length,
      available: memberIds.length - unavailableMembers.length,
      unavailableMembers,
    });
  }

  return result;
}
