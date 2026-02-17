// ---------------------------------------------------------------------------
// Notification data types
// ---------------------------------------------------------------------------

/** Notification type discriminator. */
export type NotificationType =
  | "assignment_new"
  | "assignment_changed"
  | "assignment_declined"
  | "swap_requested"
  | "swap_approved"
  | "swap_rejected"
  | "reminder";

/** A notification record from the database. */
export interface Notification {
  id: string;
  recipientMemberId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Extended notification with optional quick-action for toast rendering. */
export interface NotificationWithAction extends Notification {
  quickAction?: {
    label: string;
    url: string;
  };
}

// ---------------------------------------------------------------------------
// Swap request data types (pre-arranged model)
// ---------------------------------------------------------------------------

/** Swap request status discriminator. */
export type SwapRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

/** A swap request record from the database. */
export interface SwapRequest {
  id: string;
  assignmentId: string;
  requesterMemberId: string;
  requesterName: string;
  targetMemberId: string;
  targetName: string;
  status: SwapRequestStatus;
  reason: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// My Schedule types
// ---------------------------------------------------------------------------

/** An assignment shown on the My Schedule page. */
export interface MyAssignment {
  id: string;
  memberId: string;
  serviceId: string;
  serviceTitle: string;
  serviceDate: string;
  startTime: string;
  endTime: string | null;
  positionName: string;
  teamName: string;
  teamColor: string | null;
  status: "pending" | "confirmed" | "declined";
  notes: string | null;
}
