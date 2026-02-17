---
phase: 06-accept-decline-and-notifications
plan: 04
subsystem: ui, api
tags: [react, next.js, server-actions, supabase, swap-requests, pre-arranged-model]

# Dependency graph
requires:
  - phase: 06-accept-decline-and-notifications
    provides: notifications table, swap_requests table, createNotification dispatch, schemas, provider pattern
  - phase: 04-scheduling-and-assignments
    provides: service_assignments table, assignment types, canManageTeamAssignments pattern
provides:
  - requestSwap server action (ownership check, duplicate prevention, team lead notification)
  - resolveSwap server action (approve with reassign or reject with notification, race condition protection)
  - SwapRequestDialog component for requesting pre-arranged swaps
  - SwapApprovalList component for team lead approval on service detail
  - getSwapRequestsForService, getActiveSwapForAssignment, getTeamMembersForSwap queries
  - fetchTeamMembersForSwap server action wrapper
affects: [06-05 (swap notifications use same bell UI), UAT (swap flow end-to-end)]

# Tech tracking
tech-stack:
  added: []
  patterns: [pre-arranged swap model (offline agreement, no in-system acceptance), atomic swap approval with race condition protection]

key-files:
  created:
    - components/assignments/swap-request-dialog.tsx
    - components/assignments/swap-approval-list.tsx
  modified:
    - lib/notifications/actions.ts
    - lib/notifications/queries.ts
    - components/assignments/assignment-card.tsx
    - app/(app)/my-schedule/page.tsx
    - app/(app)/services/[serviceId]/page.tsx

key-decisions:
  - "Pre-arranged swap model: target member selected at creation, no in-system acceptance required"
  - "Race condition protection: atomic UPDATE WHERE status='pending' with rowCount check on approval"
  - "Swap button on assignment card; 'Swap Pending' badge replaces button when active swap exists"
  - "Service detail page shows swap approvals only to admin/committee/team lead"
  - "Team lead detection via team_members.role='lead' query on service detail page"

patterns-established:
  - "Swap request lifecycle: pending -> approved/rejected with resolved_by + resolved_at tracking"
  - "fetchTeamMembersForSwap server action wrapper crosses server-only import boundary for client components"
  - "SwapApprovalList uses local resolvedIds state for optimistic removal of approved/rejected items"

requirements-completed: [RESP-03, RESP-04]

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 6 Plan 04: Swap Request Workflow Summary

**Pre-arranged swap request system with member-initiated dialog, team lead approval on service detail, atomic reassignment with race condition protection, and full notification lifecycle**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T15:54:25Z
- **Completed:** 2026-02-17T15:59:19Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- requestSwap server action with ownership verification, duplicate pending swap prevention, same-team validation, and team lead notification
- resolveSwap server action with approve (atomic reassign + notify requester + notify target) and reject (notify requester) paths, race condition protection via conditional UPDATE
- SwapRequestDialog with team member Select dropdown, optional reason textarea, and toast feedback
- SwapApprovalList showing requester->target, position, reason, and approve/reject buttons per pending swap
- Assignment card extended with swap button or "Swap Pending" badge, integrated into My Schedule page with active swap status fetching
- Service detail page shows "Pending Swap Requests" section with count badge for admin/committee/team leads

## Task Commits

Each task was committed atomically:

1. **Task 1: requestSwap and resolveSwap server actions with swap queries** - `36d6417` (feat)
2. **Task 2: Swap request dialog on My Schedule and approval list on service detail** - `c3f72d4` (feat)

## Files Created/Modified
- `lib/notifications/actions.ts` - Added requestSwap, resolveSwap, fetchTeamMembersForSwap server actions
- `lib/notifications/queries.ts` - Added getSwapRequestsForService, getActiveSwapForAssignment, getTeamMembersForSwap queries
- `components/assignments/swap-request-dialog.tsx` - Dialog with team member select + optional reason for requesting pre-arranged swaps
- `components/assignments/swap-approval-list.tsx` - Pending swap list with approve/reject buttons for team lead review
- `components/assignments/assignment-card.tsx` - Added swap button (ArrowLeftRight) or "Swap Pending" badge, SwapRequestDialog integration
- `app/(app)/my-schedule/page.tsx` - Fetches active swap status per assignment, passes hasActivePendingSwap prop
- `app/(app)/services/[serviceId]/page.tsx` - Fetches pending swaps, shows SwapApprovalList section for authorized users

## Decisions Made
- Pre-arranged swap model: member selects specific target at creation time, no in-system acceptance required from target (offline agreement sufficient)
- Race condition protection on approval: atomic UPDATE with WHERE status='pending' and rowCount check prevents double-resolution
- Swap button displayed alongside confirm/decline; "Swap Pending" badge replaces button when active pending swap exists
- Service detail page detects team lead access via team_members query (not cached flag) for swap approval visibility
- fetchTeamMembersForSwap uses dynamic import to cross server-only boundary (consistent with existing fetchTeamAvailability pattern)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Swap request workflow fully operational end-to-end
- All swap notification types (swap_requested, swap_approved, swap_rejected) emit through existing notification bell infrastructure
- Swap approval visible on service detail page for team leads, integrated with existing assignment panel
- Active swap status reflected on My Schedule assignment cards

## Self-Check: PASSED

All 7 files verified present. Both commits (36d6417, c3f72d4) verified in git log.

---
*Phase: 06-accept-decline-and-notifications*
*Completed: 2026-02-17*
