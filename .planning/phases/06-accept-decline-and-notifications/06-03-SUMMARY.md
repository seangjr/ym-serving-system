---
phase: 06-accept-decline-and-notifications
plan: 03
subsystem: ui, notifications
tags: [supabase-realtime, notifications, popover, sonner, bell-icon, react-context]

# Dependency graph
requires:
  - phase: 06-accept-decline-and-notifications
    provides: notifications table, RLS, Realtime publication, lib/notifications module (types, queries, actions, send)
  - phase: 04-scheduling-and-assignments
    provides: service_assignments table, assignMember/unassignMember actions
provides:
  - NotificationContextProvider with Supabase Realtime postgres_changes subscription
  - NotificationBell component with unread count badge
  - NotificationPopover with mark-all-read and notification list
  - NotificationItem with read/unread styling and relative time
  - Sonner toast on new notification arrival
  - Assignment notifications emitted on assign/unassign
  - CalendarOff + Bell icons in sidebar ICON_MAP
affects: [06-04 (swap request notifications), 06-05 (reminder notifications)]

# Tech tracking
tech-stack:
  added: []
  patterns: [Supabase Realtime postgres_changes for live notification delivery, optimistic UI updates for mark-as-read]

key-files:
  created:
    - components/notifications/notification-provider.tsx
    - components/notifications/notification-bell.tsx
    - components/notifications/notification-popover.tsx
    - components/notifications/notification-item.tsx
  modified:
    - app/(app)/layout.tsx
    - lib/assignments/actions.ts
    - components/app-sidebar.tsx

key-decisions:
  - "Optimistic UI updates for markAsRead/markAllRead with revert on error"
  - "Notification failures in assignMember/unassignMember wrapped in try/catch (never break assignment flow)"
  - "Sticky header bar with backdrop-blur for bell icon placement (consistent across all pages)"
  - "NotificationContextProvider only rendered when memberId exists (graceful fallback for edge cases)"

patterns-established:
  - "Realtime subscription: channel per member with postgres_changes INSERT filter on recipient_member_id"
  - "Relative time helper: custom zero-dependency function instead of external library"
  - "Optimistic state: update local state immediately, revert on server action error"

requirements-completed: [NOTF-01, NOTF-02, NOTF-04]

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 6 Plan 03: Notification Bell UI Summary

**In-app notification bell with Supabase Realtime subscription, popover dropdown, sonner toast alerts, and assignment notification emitters on assign/unassign**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T15:46:33Z
- **Completed:** 2026-02-17T15:50:36Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Bell icon with unread count badge in sticky header bar across all app pages
- Notification popover with read/unread distinction (blue dot + bold text), mark-all-read, and empty state
- Supabase Realtime subscription delivers new notifications live (no page refresh) with sonner toast + View action
- assignMember() and unassignMember() now emit assignment_new/assignment_changed notifications with position and service details
- CalendarOff and Bell icons added to sidebar ICON_MAP (fixes Pitfall 7 from research)

## Task Commits

Each task was committed atomically:

1. **Task 1: Notification React context with Supabase Realtime subscription and bell/popover UI** - `c2f93cd` (feat)
2. **Task 2: Wire notification UI into app layout and emit notifications on assign/unassign** - `d7a1ef8` (feat)

## Files Created/Modified
- `components/notifications/notification-provider.tsx` - React context with Supabase Realtime subscription, markAsRead/markAllRead with optimistic updates
- `components/notifications/notification-bell.tsx` - Bell icon button with unread count badge (9+ cap), Popover trigger
- `components/notifications/notification-popover.tsx` - Popover content with notification list, mark-all-read, empty state
- `components/notifications/notification-item.tsx` - Individual notification row with blue dot, relative time, click-to-navigate
- `app/(app)/layout.tsx` - Updated with NotificationContextProvider, sticky header bar, bell icon
- `lib/assignments/actions.ts` - assignMember emits assignment_new, unassignMember emits assignment_changed
- `components/app-sidebar.tsx` - Added CalendarOff and Bell to ICON_MAP

## Decisions Made
- Optimistic UI updates for markAsRead/markAllRead -- instantly updates local state, reverts on server action error for snappy UX
- Notification failures in assignMember/unassignMember are wrapped in try/catch so they never break the assignment flow
- Sticky header bar with bg-background/95 backdrop-blur gives the bell icon a consistent position across all pages (like GitHub's top bar)
- NotificationContextProvider only rendered when memberId exists -- users without a member record still see the app without notifications
- assignMember insert changed to use .select('id').single() to capture the new assignment ID for notification metadata

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Notification bell fully operational for all future notification types
- Any new notification created via createNotification() will appear live in the bell popover
- Swap request notifications (Plan 04) will automatically surface through the same bell UI
- Reminder notifications (Plan 05) will also use the same infrastructure

## Self-Check: PASSED

All 7 files verified present. Both commits (c2f93cd, d7a1ef8) verified in git log.

---
*Phase: 06-accept-decline-and-notifications*
*Completed: 2026-02-17*
