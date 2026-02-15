import {
  addDays,
  differenceInWeeks,
  eachDayOfInterval,
  format,
  getDate,
  getDay,
  getMonth,
  parseISO,
} from "date-fns";

// ---------------------------------------------------------------------------
// Types (DB row shape for pattern matching)
// ---------------------------------------------------------------------------

interface RecurringPatternRow {
  member_id: string;
  frequency: "weekly" | "biweekly" | "monthly" | "nth_weekday";
  day_of_week: number;
  nth_occurrence: number | null;
  start_date: string;
  end_date: string | null;
}

// ---------------------------------------------------------------------------
// Safety limit
// ---------------------------------------------------------------------------

/** Maximum range in days to expand recurring patterns (approx 6 months). */
const MAX_EXPANSION_DAYS = 184;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get which nth occurrence of its weekday a date is within its month.
 * E.g. the 2nd Tuesday of the month returns 2.
 */
export function getNthOccurrenceInMonth(date: Date): number {
  const dayOfMonth = getDate(date);
  return Math.ceil(dayOfMonth / 7);
}

/**
 * Check if the given date is the last occurrence of its weekday in its month.
 * True when adding 7 days crosses into the next month.
 */
export function isLastOccurrenceInMonth(date: Date): boolean {
  const nextWeek = addDays(date, 7);
  return getMonth(nextWeek) !== getMonth(date);
}

// ---------------------------------------------------------------------------
// Pattern matching
// ---------------------------------------------------------------------------

/**
 * Determine whether a specific date matches a recurring unavailability pattern.
 *
 * Pure function -- no DB or server dependencies.
 */
export function matchesRecurringPattern(
  date: Date,
  pattern: {
    frequency: string;
    day_of_week: number;
    nth_occurrence: number | null;
    start_date: string;
    end_date: string | null;
  },
): boolean {
  const startDate = parseISO(pattern.start_date);

  // Day of week must match for all frequency types
  if (getDay(date) !== pattern.day_of_week) return false;

  // Date must be on or after pattern start
  if (date < startDate) return false;

  // Date must be on or before pattern end (if set)
  if (pattern.end_date && date > parseISO(pattern.end_date)) return false;

  switch (pattern.frequency) {
    case "weekly":
      return true;

    case "biweekly": {
      const weeksDiff = differenceInWeeks(date, startDate);
      return weeksDiff >= 0 && weeksDiff % 2 === 0;
    }

    case "monthly": {
      // Same day-of-week AND same day-of-month as start_date
      return getDate(date) === getDate(startDate);
    }

    case "nth_weekday": {
      if (pattern.nth_occurrence === null) return false;
      if (pattern.nth_occurrence === 5) {
        // 5 means "last occurrence" of this weekday in the month
        return isLastOccurrenceInMonth(date);
      }
      return getNthOccurrenceInMonth(date) === pattern.nth_occurrence;
    }

    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Pattern expansion
// ---------------------------------------------------------------------------

/**
 * Expand multiple recurring patterns into a Map of date strings to Sets of
 * member IDs. Used for team overlay calendars and batch availability checks.
 *
 * Caps expansion at MAX_EXPANSION_DAYS (184 days / ~6 months) for safety.
 */
export function expandRecurringPatterns(
  patterns: RecurringPatternRow[],
  rangeStart: Date,
  rangeEnd: Date,
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();

  // Cap the range to MAX_EXPANSION_DAYS
  const maxEnd = addDays(rangeStart, MAX_EXPANSION_DAYS);
  const effectiveEnd = rangeEnd > maxEnd ? maxEnd : rangeEnd;

  if (effectiveEnd < rangeStart) return result;

  const days = eachDayOfInterval({ start: rangeStart, end: effectiveEnd });

  for (const day of days) {
    const dateKey = format(day, "yyyy-MM-dd");

    for (const pattern of patterns) {
      if (matchesRecurringPattern(day, pattern)) {
        if (!result.has(dateKey)) {
          result.set(dateKey, new Set());
        }
        // biome-ignore lint/style/noNonNullAssertion: set guaranteed to exist (set above)
        result.get(dateKey)!.add(pattern.member_id);
      }
    }
  }

  return result;
}
