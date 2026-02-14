import { addMonths, addWeeks, isBefore, isEqual, parseISO } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly";

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Safety limit
// ---------------------------------------------------------------------------

/** Maximum number of recurring instances to generate (approx. 1 year of weekly). */
const MAX_INSTANCES = 52;

// ---------------------------------------------------------------------------
// Recurring date generation
// ---------------------------------------------------------------------------

/**
 * Generate an array of dates based on a recurrence pattern.
 *
 * - `weekly`:   every 1 week from startDate
 * - `biweekly`: every 2 weeks from startDate
 * - `monthly`:  every 1 month from startDate
 *
 * Dates are generated inclusive of startDate and up to (inclusive of) endDate.
 * Capped at MAX_INSTANCES (52) for safety.
 */
export function generateRecurringDates(config: RecurrenceConfig): Date[] {
  const { frequency, startDate, endDate } = config;
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const dates: Date[] = [];
  let current = start;

  while (
    (isBefore(current, end) || isEqual(current, end)) &&
    dates.length < MAX_INSTANCES
  ) {
    dates.push(current);

    switch (frequency) {
      case "weekly":
        current = addWeeks(current, 1);
        break;
      case "biweekly":
        current = addWeeks(current, 2);
        break;
      case "monthly":
        current = addMonths(current, 1);
        break;
    }
  }

  return dates;
}
