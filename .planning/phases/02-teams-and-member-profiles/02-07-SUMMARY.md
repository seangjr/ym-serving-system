---
phase: 02-teams-and-member-profiles
plan: 07
subsystem: database, ui
tags: [supabase, profiles, members, select-dropdown]

# Dependency graph
requires:
  - phase: 02-01
    provides: "member_profiles table, profile queries and actions, notification preferences component"
provides:
  - "Profile personal info (phone, emergency contact, birthdate) reads/writes from shared members table"
  - "member_profiles table only stores serving-specific fields (avatar, join date, notification prefs)"
  - "Reminder days dropdown with fixed height and internal scrolling"
affects: [03-scheduling, future-profile-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Personal info on shared members table, serving-specific on member_profiles"

key-files:
  created: []
  modified:
    - lib/profiles/queries.ts
    - lib/profiles/actions.ts
    - app/(app)/profile/page.tsx
    - components/profiles/notification-preferences.tsx
    - components/profiles/member-profile-view.tsx

key-decisions:
  - "Personal info fields (phone, emergency_contact_name, emergency_contact_phone, birthdate) moved from member_profiles to members table queries/writes"
  - "member_profiles retains only serving-specific fields: avatar_url, joined_serving_at, notification prefs"
  - "Used position=popper with max-h-48 on SelectContent for fixed dropdown height"

patterns-established:
  - "Shared members table for personal info: phone, emergency contact, birthdate are on members, not member_profiles"

# Metrics
duration: 3min
completed: 2026-02-13
---

# Phase 2 Plan 7: Profile Fields Redirect & Dropdown Fix Summary

**Redirected profile personal info to shared members table and constrained reminder days dropdown height**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-13T15:58:46Z
- **Completed:** 2026-02-13T16:02:02Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Profile personal info (phone, emergency contact, birthdate) now reads from and writes to the shared `members` table directly
- Eliminated data duplication between `members` and `member_profiles` tables
- Reminder days dropdown constrained to max-h-48 (~192px) with internal scrolling via popper positioning

## Task Commits

Each task was committed atomically:

1. **Task 1: Redirect profile queries and actions to shared members table** - `f42f7be` (fix)
2. **Task 2: Fix reminder days dropdown height** - `57b821b` (fix)

## Files Created/Modified
- `lib/profiles/queries.ts` - Moved phone, emergency_contact_name, emergency_contact_phone, birthdate to top-level of OwnProfile and MemberProfile interfaces; updated getOwnProfile and getMemberProfile queries to select these from members directly
- `lib/profiles/actions.ts` - updateOwnProfile and adminUpdateMemberProfile now write to members table instead of member_profiles
- `app/(app)/profile/page.tsx` - Reads personal info from top-level profile object instead of nested profileData
- `components/profiles/notification-preferences.tsx` - Added position="popper" and max-h-48 to SelectContent for fixed dropdown height
- `components/profiles/member-profile-view.tsx` - Updated to read phone from top-level member object instead of nested member_profiles

## Decisions Made
- Personal info fields belong on the shared `members` table (used by both ym-attend-4 and ym-serving) -- eliminates duplication
- `member_profiles` retains only serving-specific fields: avatar_url, joined_serving_at, notify_email, notify_assignment_changes, reminder_days_before
- Used `position="popper"` on SelectContent because the default `item-aligned` position doesn't respect max-height constraints well in Radix UI

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated member-profile-view.tsx to read phone from top-level member**
- **Found during:** Task 1 (redirect profile queries)
- **Issue:** `member-profile-view.tsx` accessed `profile?.phone` where `profile = member.member_profiles` -- would break since phone moved to top-level `member` object
- **Fix:** Changed `profile?.phone` / `profile.phone` references to `member.phone`
- **Files modified:** `components/profiles/member-profile-view.tsx`
- **Verification:** Build passes, phone display works correctly
- **Committed in:** f42f7be (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix to prevent runtime error in member profile view. No scope creep.

## Issues Encountered
- Next.js 16 Turbopack build cache issue (`pages-manifest.json` not found) required `.next` directory cleanup between builds -- known environment issue, not related to code changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Profile system correctly uses shared members table for personal info
- No data duplication between members and member_profiles
- Ready for Phase 3 scheduling work

## Self-Check: PASSED

All 5 modified files verified present. Both task commits (f42f7be, 57b821b) verified in git log. SUMMARY.md exists.

---
*Phase: 02-teams-and-member-profiles*
*Completed: 2026-02-13*
