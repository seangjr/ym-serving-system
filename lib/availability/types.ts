// ---------------------------------------------------------------------------
// Availability data types
// ---------------------------------------------------------------------------

/** Recurring pattern frequency types. */
export type RecurringFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "nth_weekday";

/** A one-time blackout date or date range. */
export interface BlackoutDate {
  id: string;
  memberId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

/** A recurring unavailability pattern. */
export interface RecurringPattern {
  id: string;
  memberId: string;
  frequency: RecurringFrequency;
  dayOfWeek: number;
  nthOccurrence: number | null;
  startDate: string;
  endDate: string | null;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

/** An unavailable member entry (used in availability lookups). */
export interface UnavailableMember {
  memberId: string;
  memberName: string;
  reason: string | null;
  type: "blackout" | "recurring";
}

/** Availability summary for a single date within a team context. */
export interface TeamDateAvailability {
  date: string;
  total: number;
  available: number;
  unavailableMembers: UnavailableMember[];
}
