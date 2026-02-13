# Phase 1 Plan 3 Rework: Role Infrastructure Alignment with ym-attend-4

**One-liner:** Replaced JWT-based role system with DB-query-based role resolution using shared Supabase tables (members/assignments/roles).

## Why This Rework Was Needed

The original 01-03 implementation created its own role infrastructure:
- `app_role` enum type
- `user_roles` table
- `custom_access_token_hook` function for embedding roles in JWTs
- JWT parsing on the client to extract roles

This was **wrong** because the YM Serving system shares a Supabase project with ym-attend-4, which already has:
- `roles` table (7 existing roles: Admin, Zone Leader, CG Leader, Pastor, Member, New Friend, playwright-auth-role)
- `members` table (350+ records with `auth_user_id` linking to Supabase auth)
- `assignments` table (394 records linking member_id to role_id with scope_type/scope_id)

Creating duplicate role infrastructure would have caused conflicts and data inconsistency.

## What Changed

### Task 1: Migration Replacement
- **Deleted:** `supabase/migrations/00001_roles_and_rls.sql` (185 lines of wrong infrastructure)
- **Created:** `supabase/migrations/00002_serving_committee_role.sql` (6 lines -- just inserts "Committee" role)
- Commit: `73cabf4`

### Task 2: Service Role Admin Client
- **Created:** `lib/supabase/admin.ts` with `createAdminClient()` using `SUPABASE_SERVICE_ROLE_KEY`
- Bypasses RLS for server-side role lookups
- Commit: `3ff446b`

### Task 3: Role Module Rewrite
- **Rewrote:** `lib/auth/roles.ts` -- removed all JWT parsing, added async DB queries
- `getUserRole()` now: takes `SupabaseClient` (not `Session`), returns `Promise<{ role, memberId }>` (not `AppRole`)
- Queries: `members` (by auth_user_id) -> `assignments` (by member_id) -> `roles` (name)
- Role hierarchy: admin > committee > member (same as before)
- **Updated callers:** `app/(app)/page.tsx` and `app/(app)/layout.tsx` to use new async signature
- **Updated sidebar:** Added `Shield` icon to icon map for new admin-only "Admin" nav item
- Commit: `d224d80`

### Task 4: Environment Variables
- **Updated:** `.env.local.example` with `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY`
- Both server-only (no `NEXT_PUBLIC_` prefix)
- Commit: `0cc444c`

### Task 5: Middleware Public Routes
- **Updated:** `lib/supabase/middleware.ts` to allow `/forgot-password`, `/verify`, `/setup-password`
- Prepares for upcoming auth flow improvements
- Commit: `797f9f6`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated callers of getUserRole**
- **Found during:** Task 3
- **Issue:** Changing `getUserRole` from sync `(Session) => AppRole` to async `(SupabaseClient) => { role, memberId }` broke `app/(app)/page.tsx` and `app/(app)/layout.tsx`
- **Fix:** Updated both files to use `await getUserRole(supabase)` and destructure `{ role }`
- **Files modified:** `app/(app)/page.tsx`, `app/(app)/layout.tsx`

**2. [Rule 3 - Blocking] Added Shield icon to sidebar icon map**
- **Found during:** Task 3
- **Issue:** New admin-only nav item uses "Shield" icon but `ICON_MAP` in `app-sidebar.tsx` didn't include it
- **Fix:** Added `Shield` import from `lucide-react` and added to `ICON_MAP`
- **Files modified:** `components/app-sidebar.tsx`

**3. [Rule 1 - Bug] Removed unused mapDbRoleToAppRole function**
- **Found during:** Task 3
- **Issue:** Biome lint flagged `mapDbRoleToAppRole` as unused (role mapping is done inline in getUserRole)
- **Fix:** Removed the function definition
- **Files modified:** `lib/auth/roles.ts`

**4. [Rule 1 - Bug] Fixed import ordering**
- **Found during:** Task 3
- **Issue:** Biome lint flagged unsorted imports in modified files
- **Fix:** Reordered imports to satisfy Biome's `organizeImports` rule
- **Files modified:** `app/(app)/page.tsx`, `app/(app)/layout.tsx`, `components/app-sidebar.tsx`

## Key Files

### Created
- `supabase/migrations/00002_serving_committee_role.sql`
- `lib/supabase/admin.ts`

### Modified
- `lib/auth/roles.ts` (complete rewrite)
- `app/(app)/page.tsx` (getUserRole signature update)
- `app/(app)/layout.tsx` (getUserRole signature update)
- `components/app-sidebar.tsx` (Shield icon added)
- `lib/supabase/middleware.ts` (new public routes)
- `.env.local.example` (new env vars)

### Deleted
- `supabase/migrations/00001_roles_and_rls.sql`

## Decisions Made

1. **No custom access token hook** -- Roles are queried from DB at runtime, not embedded in JWTs
2. **getUserRole returns memberId** -- Callers often need the member ID for subsequent queries; returning it avoids duplicate lookups
3. **Role mapping is inline** -- Simple if/else in getUserRole rather than a separate mapping function (only 3 roles to check)
4. **Admin gets dedicated nav item** -- Admin role now sees an "Admin" link in sidebar (committee does not)

## Duration

~7 minutes
