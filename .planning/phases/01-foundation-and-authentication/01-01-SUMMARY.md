---
phase: 01-foundation-and-authentication
plan: 01
subsystem: auth
tags: [supabase, ssr, cookies, middleware, pkce, next.js]

# Dependency graph
requires: []
provides:
  - Browser Supabase client factory (lib/supabase/client.ts)
  - Server Supabase client factory with cookie handling (lib/supabase/server.ts)
  - Middleware session refresh and auth redirect (lib/supabase/middleware.ts + middleware.ts)
  - PKCE auth code exchange route handler (app/auth/callback/route.ts)
  - Email OTP verification route handler (app/auth/confirm/route.ts)
  - Sign-out route handler (app/auth/signout/route.ts)
  - Environment variable template (.env.local.example)
affects: [01-02, 01-03, 01-04, 01-05]

# Tech tracking
tech-stack:
  added: ["@supabase/supabase-js@2.95.3", "@supabase/ssr@0.8.0"]
  patterns: ["createBrowserClient/createServerClient factories", "getAll/setAll cookie pattern", "middleware-based token refresh", "getUser() over getSession() for server auth"]

key-files:
  created:
    - lib/supabase/client.ts
    - lib/supabase/server.ts
    - lib/supabase/middleware.ts
    - middleware.ts
    - app/auth/callback/route.ts
    - app/auth/confirm/route.ts
    - app/auth/signout/route.ts
    - .env.local.example
  modified:
    - package.json
    - pnpm-lock.yaml
    - .gitignore

key-decisions:
  - "Used NEXT_PUBLIC_SUPABASE_ANON_KEY (not PUBLISHABLE_KEY) for env var naming — wider ecosystem compatibility"
  - "Added /update-password to middleware allow-list alongside /login, /auth/*, /reset-password"
  - "Redirect authenticated users away from /login and /reset-password to / via middleware"
  - "Error redirects go to /login?error=... rather than separate error pages"

patterns-established:
  - "Client factory pattern: createClient() in lib/supabase/ for both browser and server contexts"
  - "Server cookie pattern: getAll/setAll with try/catch in setAll for Server Component compatibility"
  - "Middleware auth guard: updateSession() checks getUser() and redirects unauthenticated users"
  - "Route handler pattern: async GET/POST with createClient() from server factory"

# Metrics
duration: 4min
completed: 2026-02-13
---

# Phase 1 Plan 1: Supabase Client Infrastructure Summary

**Cookie-based Supabase SSR auth with middleware token refresh, PKCE callback handlers, and sign-out route using @supabase/ssr**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-13T08:12:43Z
- **Completed:** 2026-02-13T08:16:58Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Browser and server Supabase client factories using @supabase/ssr with getAll/setAll cookie pattern
- Middleware intercepts all non-static requests, refreshes auth tokens, and redirects unauthenticated users to /login
- PKCE callback route exchanges auth codes for sessions (supports password reset email links)
- Email OTP verification route and sign-out route handler with proper session clearing
- Environment variable template documenting all required Supabase config

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Supabase packages and create client factories** - `e98e83b` (feat)
2. **Task 2: Create middleware and auth route handlers** - `2ba4aa2` (feat)

## Files Created/Modified
- `lib/supabase/client.ts` - Browser Supabase client factory using createBrowserClient
- `lib/supabase/server.ts` - Server Supabase client factory with cookie store getAll/setAll
- `lib/supabase/middleware.ts` - Session refresh logic with auth redirect rules
- `middleware.ts` - Next.js middleware entry point with static file exclusion matcher
- `app/auth/callback/route.ts` - PKCE code exchange for OAuth/email link flows
- `app/auth/confirm/route.ts` - Email OTP verification handler
- `app/auth/signout/route.ts` - Sign-out with session clear and path revalidation
- `.env.local.example` - Template for required Supabase environment variables
- `package.json` - Added @supabase/supabase-js and @supabase/ssr dependencies
- `pnpm-lock.yaml` - Updated lockfile
- `.gitignore` - Added exception for .env.local.example

## Decisions Made
- Used `NEXT_PUBLIC_SUPABASE_ANON_KEY` naming (not `PUBLISHABLE_KEY`) for broader ecosystem compatibility per research recommendation
- Added `/update-password` to middleware's public route allow-list (plan mentioned `/login`, `/auth/*`, `/reset-password` but `/update-password` is also needed for the password update flow after clicking a reset link)
- Error redirects target `/login?error=...` instead of separate error pages for simplicity — error pages can be added later
- Redirect authenticated users away from `/login` and `/reset-password` to prevent showing auth pages to logged-in users

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated .gitignore to allow .env.local.example**
- **Found during:** Task 1 (creating .env.local.example)
- **Issue:** The `.env*` pattern in .gitignore blocked committing `.env.local.example`
- **Fix:** Added `!.env.local.example` exception to .gitignore
- **Files modified:** .gitignore
- **Verification:** `git add .env.local.example` succeeds
- **Committed in:** e98e83b (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added /update-password to middleware allow-list**
- **Found during:** Task 2 (creating middleware)
- **Issue:** Plan specified allowing `/login`, `/auth/*`, `/reset-password` but omitted `/update-password`. Users clicking a password reset email link land on `/auth/callback` which redirects to `/update-password` — without allowing this path, authenticated users would be redirected to `/` and unauthenticated users would be redirected to `/login`, breaking the password update flow.
- **Fix:** Added `!request.nextUrl.pathname.startsWith("/update-password")` check to the middleware's unauthenticated redirect condition
- **Files modified:** lib/supabase/middleware.ts
- **Verification:** Build passes; middleware logic correctly allows all auth-related paths
- **Committed in:** 2ba4aa2 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Next.js 16 shows a deprecation warning for "middleware" file convention, suggesting "proxy" instead. The middleware still compiles and functions correctly. This is a future migration concern, not a current blocker.

## User Setup Required

**External services require manual configuration.** Before the auth system can function, users must:

1. **Set environment variables** in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Dashboard > Project Settings > API > Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase Dashboard > Project Settings > API > anon public key
   - `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` for development

2. **Configure Supabase Dashboard:**
   - Enable Email/Password auth provider (Authentication > Providers > Email)
   - Add site URL to redirect allowlist (Authentication > URL Configuration)
   - Add redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/confirm`

## Next Phase Readiness
- Supabase client infrastructure fully operational for both browser and server contexts
- Middleware ready to protect all routes once login page exists (Plan 01-02)
- Auth callback handlers ready for password reset email link flows (Plan 01-03)
- Sign-out route ready for integration into app shell navigation (Plan 01-04)

## Self-Check: PASSED

All 9 files verified present. Both task commits (e98e83b, 2ba4aa2) confirmed in git log.

---
*Phase: 01-foundation-and-authentication*
*Completed: 2026-02-13*
