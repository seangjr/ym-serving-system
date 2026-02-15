// ---------------------------------------------------------------------------
// Assignment data types
// ---------------------------------------------------------------------------

/** A single position slot on a service, with its assignment (if any). */
export interface ServicePositionWithAssignment {
  id: string;
  serviceId: string;
  teamId: string;
  positionId: string;
  positionName: string;
  category: string | null;
  sortOrder: number;
  assignment: {
    id: string;
    memberId: string;
    memberName: string;
    status: "pending" | "confirmed" | "declined";
    notes: string | null;
    hasConflict: boolean;
    assignedAt: string;
  } | null;
}

/** Positions grouped by team, then by category. */
export interface TeamAssignmentGroup {
  teamId: string;
  teamName: string;
  teamColor: string | null;
  categories: Record<string, ServicePositionWithAssignment[]>;
}

/** A member eligible for assignment, with optional conflict info. */
export interface EligibleMember {
  id: string;
  fullName: string;
  hasConflict: boolean;
  conflictDetails: {
    serviceName: string;
    serviceTime: string;
    positionName: string;
  } | null;
  isUnavailable: boolean;
  unavailabilityReason: string | null;
  /** Position IDs this member has skills for (from member_position_skills). */
  positionIds: string[];
}

/** Unavailability details for the confirmation dialog. */
export interface UnavailabilityInfo {
  memberName: string;
  reason: string | null;
  type: "blackout" | "recurring";
}

/** Conflict details for the confirmation dialog. */
export interface ConflictInfo {
  assignmentId: string;
  serviceName: string;
  serviceTime: string;
  positionName: string;
}

/** Team data for the assignment page (position adder + eligible members). */
export interface TeamForAssignment {
  id: string;
  name: string;
  color: string | null;
  positions: {
    id: string;
    name: string;
    category: string | null;
  }[];
  members: {
    id: string;
    fullName: string;
  }[];
}

/** Template list item for browsing. */
export interface TemplateListItem {
  id: string;
  name: string;
  description: string | null;
  serviceTypeId: string | null;
  serviceTypeLabel: string | null;
  positionCount: number;
  createdAt: string;
}

/** A position entry stored in a template (positions only, no member assignments). */
export interface TemplatePosition {
  teamId: string;
  teamName: string;
  positionId: string;
  positionName: string;
  category: string | null;
  sortOrder: number;
}

/** Full template detail for loading. */
export interface TemplateDetail {
  id: string;
  name: string;
  description: string | null;
  serviceTypeId: string | null;
  positions: TemplatePosition[];
}
