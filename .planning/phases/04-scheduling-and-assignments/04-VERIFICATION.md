---
phase: 04-scheduling-and-assignments
verified: 2026-02-14T08:00:00Z
status: human_needed
score: 18/20 must-haves verified
human_verification:
  - test: "Verify database migration was applied to Supabase"
    expected: "Tables service_positions, service_assignments, schedule_templates exist in remote database with correct schema, RLS policies, and indexes"
    why_human: "Migration file exists but Plan 01 SUMMARY indicates 'supabase db push' could not run due to unauthenticated CLI. Cannot verify remote database state programmatically."
  - test: "Assign a member to a position slot via combobox dropdown"
    expected: "Member appears in dropdown with conflict icon (if applicable), assignment creates pending status badge on slot after selection"
    why_human: "Interactive UI workflow requires browser interaction and visual verification of combobox behavior"
  - test: "Create scheduling conflict by assigning member to overlapping services"
    expected: "Conflict dialog appears showing service name, position, and time. After force-assign, persistent AlertTriangle icon with tooltip shows on the slot."
    why_human: "Multi-step workflow with time-based logic requires real service data and visual confirmation of UI state changes"
  - test: "Save service positions as template, then load template on another service"
    expected: "Template save dialog creates named template. Load dialog shows template list filtered by team. Loading applies positions to service, replacing existing positions for that team."
    why_human: "Complex dialog workflow with form submission and side effects on service detail page requires browser interaction"
  - test: "Dashboard stats show real unassigned positions and pending confirmations"
    expected: "After creating services with positions and assignments, dashboard stats cards display correct counts (not hardcoded 0)"
    why_human: "Requires actual service/assignment data in database and visual verification of computed aggregations"
---

# Phase 04: Scheduling & Assignments Verification Report

**Phase Goal:** Team leads and admins can assign members to positions on services, with conflict detection and reusable templates

**Verified:** 2026-02-14T08:00:00Z

**Status:** Human verification needed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

All truths derived from the three plan must_haves:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | service_positions table stores per-service position slots (allowing multiples of the same position) | ✓ VERIFIED | Migration 00006_assignments.sql creates table with service_id, team_id, position_id, sort_order. No UNIQUE constraint on (service_id, position_id). |
| 2 | service_assignments table stores member-to-slot assignments with status state machine (pending/confirmed/declined) | ✓ VERIFIED | Migration creates table with status CHECK constraint, UNIQUE(service_position_id), has_conflict boolean. |
| 3 | schedule_templates table stores reusable position configurations as JSON | ✓ VERIFIED | Migration creates table with positions jsonb column, team_id FK, name/description fields. |
| 4 | RLS policies allow authenticated users to read all three tables; mutations go through admin client | ✓ VERIFIED | Migration enables RLS + SELECT policies for authenticated on all 3 tables. Actions use createAdminClient() for mutations. |
| 5 | Server actions enforce admin/committee/team-lead authorization before mutating assignments | ✓ VERIFIED | actions.ts implements canManageTeamAssignments() helper checking admin/committee via isAdminOrCommittee() and team lead via team_members role query. |
| 6 | Conflict detection query finds overlapping service times for a member on the same date | ✓ VERIFIED | getMemberConflicts() fetches same-date assignments, filters for time overlap in app code, handles null end_time with 120min default. |
| 7 | Service detail page shows position slots grouped by Team then Position Category (two-level hierarchy) | ✓ VERIFIED | AssignmentPanel renders team Cards, each with Collapsible sections per category. Data structure uses TeamAssignmentGroup with categories: Record<string, ServicePositionWithAssignment[]>. |
| 8 | Position categories are expanded by default (not collapsed) | ✓ VERIFIED | Collapsible component uses defaultOpen prop (no explicit value = default true behavior). |
| 9 | Unassigned slots display dashed outline with 'Assign' button | ✓ VERIFIED | AssignmentSlot unassigned state uses "border-dashed border-2 border-muted-foreground/25" className. Button opens Combobox. |
| 10 | Combobox dropdown shows eligible team members with name and conflict warning icon | ✓ VERIFIED | ComboboxItem renders member.fullName with AlertTriangle icon when member.hasConflict is true. Combobox uses object values {value, label, hasConflict}. |
| 11 | Assigned slot displays member name and status badge (pending/confirmed/declined) | ✓ VERIFIED | AssignmentSlot assigned state renders assignment.memberName + Badge with status-specific colors (amber/green/red). |
| 12 | Confirmation dialog appears when assigning a member with overlapping service times | ✓ VERIFIED | assignMember checks conflicts, returns {conflict: ConflictInfo} when conflicts found and forceAssign=false. ConflictDialog opens on conflict result. |
| 13 | Persistent warning badge stays on slot after confirmed conflict assignment | ✓ VERIFIED | assignment.hasConflict persisted in DB, renders AlertTriangle icon with Tooltip in assigned slot UI regardless of force-assign. |
| 14 | Team lead/admin can add positions inline from team's existing positions | ✓ VERIFIED | InlinePositionAdder and PositionAdder components render Select with team_positions from getTeamsForAssignment(). addServicePosition server action inserts into service_positions. |
| 15 | Team lead/admin can remove positions with assignment warning dialog | ✓ VERIFIED | AssignmentSlot handleRemovePosition checks assignment existence, shows AlertDialog confirmation if assigned, calls removeServicePosition action. |
| 16 | Per-assignment notes field is available on each assigned slot | ✓ VERIFIED | AssignmentSlot renders textarea for assignment.notes with debounced save via updateAssignmentNote action. |
| 17 | Admin/committee can save a service's position configuration as a named template | ✓ VERIFIED | SaveTemplateDialog form calls saveTemplate action which queries service_positions for the service+team and stores JSON snapshot. |
| 18 | Admin/committee can load a saved template onto a service, replacing existing positions for that team | ✓ VERIFIED | LoadTemplateDialog calls loadTemplate action which deletes existing service_positions for team+service, then inserts from template positions JSON. |
| 19 | Templates are scoped to a specific team and show position count and creation date | ✓ VERIFIED | schedule_templates has team_id FK. TemplateListItem interface includes positionCount, createdAt. LoadTemplateDialog renders these fields. |
| 20 | Dashboard stats show real unassigned positions count (not hardcoded 0) | ? UNCERTAIN | lib/services/queries.ts getServiceStats() queries service_positions and service_assignments tables, computes unassignedPositions = totalPositions - totalAssignments. Code logic verified, but requires database migration applied and real data to test. |
| 21 | Dashboard stats show real pending confirmations count (not hardcoded 0) | ? UNCERTAIN | getServiceStats() queries service_assignments with status='pending' filter for upcoming services. Code logic verified, but requires database migration applied and real data to test. |

**Score:** 19/21 truths verified, 2 uncertain (require human verification with live data)

### Required Artifacts

#### Plan 01: Database Schema & Server-Side Module

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00006_assignments.sql` | 3 tables (service_positions, service_assignments, schedule_templates) with RLS, indexes, triggers | ✓ VERIFIED | 96 lines, creates all 3 tables, 2 indexes, 3 RLS policies (SELECT for authenticated), 2 updated_at triggers |
| `lib/assignments/schemas.ts` | Zod validation schemas for assignment inputs | ✓ VERIFIED | 89 lines, exports 8 schemas: assignMemberSchema, unassignMemberSchema, updateAssignmentNoteSchema, addServicePositionSchema, removeServicePositionSchema, saveTemplateSchema, loadTemplateSchema, deleteTemplateSchema |
| `lib/assignments/types.ts` | TypeScript interfaces for assignment data | ✓ VERIFIED | 92 lines, exports 7 interfaces: ServicePositionWithAssignment, TeamAssignmentGroup, EligibleMember, ConflictInfo, TeamForAssignment, TemplateListItem, TemplateDetail |
| `lib/assignments/queries.ts` | Query functions for assignments, eligible members, conflicts, templates | ✓ VERIFIED | 457 lines, exports getServiceAssignments, getEligibleMembers, getMemberConflicts, getTemplates, getTemplateById, getTeamsForAssignment (6 functions total) |
| `lib/assignments/actions.ts` | Server actions for assignment CRUD, position management, templates | ✓ VERIFIED | 474 lines, exports assignMember, unassignMember, updateAssignmentNote, addServicePosition, removeServicePosition, saveTemplate, loadTemplate, deleteTemplate, fetchTemplates (9 functions total) |

#### Plan 02: Assignment UI

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/(app)/services/[serviceId]/assignment-panel.tsx` | Main assignment UI component with team/category grouping | ✓ VERIFIED | 127 lines, exports AssignmentPanel with team Cards, Collapsible category sections, InlinePositionAdder integration |
| `app/(app)/services/[serviceId]/assignment-slot.tsx` | Individual position slot with combobox assignment and status display | ✓ VERIFIED | 464 lines, exports AssignmentSlot with unassigned state (dashed border + Combobox) and assigned state (member name + status Badge + conflict icon + notes textarea + remove button) |
| `app/(app)/services/[serviceId]/position-adder.tsx` | Inline position add dropdown for per-service position management | ✓ VERIFIED | 235 lines, exports PositionAdder (multi-team standalone) and InlinePositionAdder (single-team, inside team card) |
| `app/(app)/services/[serviceId]/conflict-dialog.tsx` | AlertDialog for conflict confirmation with service/position/time details | ✓ VERIFIED | 65 lines, exports ConflictDialog displaying ConflictInfo with "Assign Anyway" button |
| `app/(app)/services/[serviceId]/page.tsx` | Updated service detail page fetching assignment data | ✓ VERIFIED | Imports getServiceAssignments, fetches data in Promise.all, renders AssignmentPanel with teams prop |

#### Plan 03: Template Dialogs & Dashboard Stats

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/(app)/services/[serviceId]/template-dialog.tsx` | Save and load template dialogs | ✓ VERIFIED | 413 lines, exports SaveTemplateDialog (react-hook-form + zodResolver) and LoadTemplateDialog (template list with team filter + delete) |
| `app/(app)/services/[serviceId]/service-detail-actions.tsx` | Updated action bar with template buttons | ✓ VERIFIED | Contains "Save as Template" and "Load Template" buttons (verified via grep, buttons render conditionally on canManage) |
| `lib/services/queries.ts` | Updated getServiceStats with real assignment counts | ✓ VERIFIED | getServiceStats() queries service_positions and service_assignments tables for upcoming services, computes unassignedPositions and pendingConfirmations (replaced hardcoded 0 values) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| lib/assignments/actions.ts | supabase/migrations/00006_assignments.sql | Supabase admin client queries against new tables | ✓ WIRED | 18 instances of .from("service_assignments\|service_positions\|schedule_templates") found in actions.ts |
| lib/assignments/queries.ts | supabase/migrations/00006_assignments.sql | RLS-protected reads from new tables | ✓ WIRED | getServiceAssignments queries service_positions with joins to team_positions, serving_teams, service_assignments |
| lib/assignments/actions.ts | lib/assignments/schemas.ts | Zod validation before mutations | ✓ WIRED | 8 instances of .safeParse() found, one per server action, error handling follows established pattern |
| app/(app)/services/[serviceId]/assignment-panel.tsx | lib/assignments/queries.ts | Server-fetched data passed as props from page.tsx | ✓ WIRED | page.tsx calls getServiceAssignments, passes TeamAssignmentGroup[] to AssignmentPanel as teams prop |
| app/(app)/services/[serviceId]/assignment-slot.tsx | lib/assignments/actions.ts | Server action calls for assign/unassign/updateNote | ✓ WIRED | Imports assignMember, unassignMember, updateAssignmentNote; calls within useTransition callbacks with router.refresh() |
| app/(app)/services/[serviceId]/conflict-dialog.tsx | lib/assignments/types.ts | ConflictInfo type for dialog display | ✓ WIRED | Imports ConflictInfo type, uses conflict.serviceName, conflict.serviceTime, conflict.positionName in dialog content |
| app/(app)/services/[serviceId]/template-dialog.tsx | lib/assignments/actions.ts | Server action calls for saveTemplate, loadTemplate, deleteTemplate | ✓ WIRED | Imports saveTemplate, loadTemplate, deleteTemplate, fetchTemplates; calls within form submit handlers and button onClick |
| lib/services/queries.ts | supabase/migrations/00006_assignments.sql | Queries against service_positions and service_assignments for dashboard stats | ✓ WIRED | getServiceStats() queries both tables with joins to services table, filters by upcoming/non-cancelled |

### Requirements Coverage

Phase 04 requirements from ROADMAP (ASGN-01 through ASGN-10):

| Requirement | Status | Supporting Truths |
|-------------|--------|-------------------|
| ASGN-01: Assign members to positions on a service | ✓ SATISFIED | Truths 7-11 (AssignmentPanel + AssignmentSlot UI, assignMember action) |
| ASGN-02: Assignment status tracking (confirmed, pending, declined, unassigned) | ✓ SATISFIED | Truths 2, 11 (service_assignments.status with CHECK constraint, status Badge rendering) |
| ASGN-03: Positions grouped by category with collapsible sections | ✓ SATISFIED | Truths 7-8 (TeamAssignmentGroup categories structure, Collapsible with defaultOpen) |
| ASGN-04: Per-assignment notes | ✓ SATISFIED | Truth 16 (notes field in service_assignments table, textarea with debounced save) |
| ASGN-05: Add/remove positions from a service | ✓ SATISFIED | Truths 14-15 (PositionAdder components, addServicePosition/removeServicePosition actions) |
| ASGN-06: Only members with matching position skills appear in assignment dropdown | ⚠️ PARTIAL | getEligibleMembers filters by team membership but NOT by position skills. This may be intentional (team_members defines positions), requires clarification. |
| ASGN-07: Conflict detection for overlapping services on the same day | ✓ SATISFIED | Truths 6, 12-13 (getMemberConflicts query, ConflictDialog, persistent hasConflict flag) |
| ASGN-08: Save team configuration as reusable template | ✓ SATISFIED | Truth 17 (SaveTemplateDialog, saveTemplate action with JSON snapshot) |
| ASGN-09: Load template when setting up a new service | ✓ SATISFIED | Truth 18 (LoadTemplateDialog, loadTemplate action with position replacement logic) |
| ASGN-10: Multiples of the same position allowed per service | ✓ SATISFIED | Truth 1 (No UNIQUE constraint on (service_id, position_id), PositionAdder allows adding duplicates) |

**Note on ASGN-06:** getEligibleMembers() in queries.ts fetches all team_members for a team without filtering by position skills. This may be correct if team membership already implies position capability (team_members has a position_id FK), but the requirement states "only members with matching position skills". Requires human verification of intended behavior.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | No blocking anti-patterns found |

**Notes:**
- No TODO/FIXME/PLACEHOLDER comments found in implementation files
- No empty return statements or stub implementations detected
- "placeholder" strings found are legitimate UI placeholders (input placeholders, Select placeholders)
- All server actions follow established error handling pattern (safeParse, error.issues[0]?.message)
- Conflict detection properly handles null end_time with calculateEndTime fallback
- Team lead authorization uses consistent canManageTeamAssignments() pattern

### Human Verification Required

#### 1. Database Migration Applied to Remote Supabase

**Test:** Run `supabase db push` to apply migration 00006_assignments.sql, then verify tables exist in Supabase dashboard

**Expected:**
- Tables `service_positions`, `service_assignments`, `schedule_templates` exist
- Columns match migration schema (including status CHECK constraint, has_conflict boolean, positions jsonb)
- RLS policies exist: SELECT for authenticated on all 3 tables
- Indexes exist: idx_service_positions_service_team, idx_service_assignments_member
- Triggers exist: set_service_assignments_updated_at, set_schedule_templates_updated_at

**Why human:** Plan 01 SUMMARY states "supabase db push could not run (Supabase CLI not authenticated). Migration SQL verified by inspection against existing migration patterns (00003, 00005). Push deferred to user." Migration file exists in codebase but cannot verify remote database state programmatically.

#### 2. Member Assignment via Combobox Dropdown

**Test:**
1. Navigate to a service detail page
2. Click "Assign" button on an unassigned position slot
3. Verify combobox dropdown opens and shows team members
4. For members with conflicts, verify amber AlertTriangle icon appears next to name
5. Select a member without conflict
6. Verify slot updates to show member name + "pending" badge (amber background)

**Expected:**
- Combobox search filtering works (type member name to filter)
- Conflict icons display correctly
- Assignment creates pending status badge immediately
- No console errors

**Why human:** Interactive UI workflow requires browser interaction, visual verification of combobox behavior, and confirmation that base-ui Combobox object values pattern works as expected.

#### 3. Scheduling Conflict Detection and Force-Assign

**Test:**
1. Create two services on the same date with overlapping times (e.g., 9:00-11:00 and 10:00-12:00)
2. Assign a member to a position on the first service
3. Attempt to assign the same member to a position on the second service
4. Verify ConflictDialog appears with:
   - Service name, position name, and time of the conflicting service
   - "Assign Anyway" button
5. Click "Assign Anyway"
6. Verify slot shows member name + pending badge + persistent amber AlertTriangle icon with "Scheduling conflict" tooltip

**Expected:**
- Conflict detection triggers for overlapping times (not just same-day)
- Dialog shows correct conflict details
- After force-assign, has_conflict flag persists in database
- Warning icon remains visible even after page refresh

**Why human:** Multi-step workflow requires real service data with time overlap logic. Visual verification needed for dialog content accuracy and persistent warning badge behavior.

#### 4. Template Save and Load Workflow

**Test:**
1. Create a service and add multiple positions for a team using PositionAdder
2. Click "Save as Template" button
3. Fill in template name (e.g., "Sunday Morning Worship Team"), select team
4. Submit form, verify success toast
5. Create a new service
6. Click "Load Template" button
7. Select team filter to show only relevant templates
8. Click on saved template, verify position count and date display
9. Click "Load" button
10. Verify positions appear on the new service, grouped by category

**Expected:**
- SaveTemplateDialog creates template with name, description, team_id, positions JSON
- LoadTemplateDialog shows template list filtered by team
- Template loading replaces existing positions for that team (if any)
- Position counts match between save and load
- Template delete button removes template from list

**Why human:** Complex dialog workflow with form submission, server action calls, side effects on service detail page, and template filtering logic. Requires visual confirmation of UI state changes and data persistence.

#### 5. Dashboard Stats Show Real Assignment Data

**Test:**
1. Create several upcoming services (non-cancelled)
2. Add positions to services using PositionAdder
3. Assign some members (leaving some positions unassigned)
4. Navigate to dashboard
5. Verify "Unassigned Positions" stat shows correct count of service_positions without assignments
6. Verify "Pending Confirmations" stat shows correct count of assignments with status='pending'
7. Assign more members, refresh dashboard
8. Verify stats update correctly

**Expected:**
- Stats are NOT hardcoded to 0
- Unassigned positions count = total service_positions - total service_assignments for upcoming services
- Pending confirmations count = service_assignments with status='pending' for upcoming services
- Stats update in real-time as assignments change

**Why human:** Requires actual service/assignment data in database to test query logic. Visual verification needed to confirm computed aggregations match expected counts and update correctly.

### Gaps Summary

**Database Migration Status:** The migration file `00006_assignments.sql` exists and is committed (eea9ba8), but Plan 01 SUMMARY indicates it was not applied to the remote Supabase database due to unauthenticated CLI. This is a **critical operational gap** — all code exists and is correctly implemented, but the database schema may not be deployed.

**User Action Required:** Run `supabase db push` after `supabase login` to apply migration to production database.

**Implementation Quality:** All 9 created files and 6 modified files are substantive (total 2,416 lines of implementation code). No stub implementations, placeholders, or empty returns found. All patterns follow established codebase conventions (server actions with safeParse, admin client for mutations, revalidatePath, toast notifications, useTransition for optimistic UI).

**Requirement ASGN-06 Ambiguity:** getEligibleMembers() fetches all team_members without filtering by position skills. This may be correct if team membership implies position capability, but requirement wording suggests skill-based filtering. Clarification needed.

**Next Steps:**
1. Apply database migration via `supabase db push`
2. Perform 5 human verification tests outlined above
3. Clarify ASGN-06 requirement intent (team membership vs position skills filter)
4. If all tests pass and migration applied, phase goal is **fully achieved**

---

_Verified: 2026-02-14T08:00:00Z_  
_Verifier: Claude (gsd-verifier)_
