# Phase 1: Foundation & Authentication - Research

**Researched:** 2026-02-13
**Domain:** Supabase Auth + Next.js App Router + Role-Based Access + App Shell
**Confidence:** HIGH

## Summary

Phase 1 establishes the authentication layer using Supabase Auth with `@supabase/ssr` for cookie-based session management in Next.js 16 App Router, role-based access control via custom JWT claims and RLS policies, and the application shell with a responsive sidebar and dark mode.

The standard approach uses `@supabase/ssr` (v0.8.x) with `@supabase/supabase-js` (v2.95.x) for creating browser and server clients. Authentication state flows through middleware that refreshes tokens on every request. RLS policies use a custom access token hook to embed user roles in JWTs, enabling performant role checks without extra database calls. The app shell uses the existing shadcn/ui Sidebar component (already installed) with next-themes for dark mode toggling.

**Primary recommendation:** Use `@supabase/ssr` with `createBrowserClient`/`createServerClient`, middleware-based session refresh, custom access token auth hook for role claims in JWT, and the existing shadcn/ui Sidebar component with next-themes for the app shell.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Auth Flow
- No public signup page -- members are pre-existing in the attendance system's member database
- Same Supabase project as the attendance system -- scheduling tables added alongside existing attendance tables, same schema
- Admin invites members via email -- leverages the existing invitation method from the attendance system
- Login page only -- email/password login, password reset via email link
- If authenticated in Supabase Auth, user can access the scheduling app
- Admin validates/invites users into the system -- no self-registration

#### Role Management
- Three roles: **Admin**, **Committee** (renamed from "team lead"), **Member**
- Committee is a global role -- can manage any team, not scoped per-team
- First admin already exists in the attendance system -- no bootstrapping needed
- Role assignment available in two places:
  - Quick role change dropdown on a member's profile page
  - Dedicated admin panel listing all users with bulk role management

#### Mobile-First Design Philosophy
- **Mobile is the primary view** -- most users will interact via phone
- Two distinct design targets: mobile view (designed first) and desktop view (enhanced second)
- Not just "responsive" -- mobile layouts are intentionally designed, not shrunk-down desktop
- Touch targets, swipe gestures, and thumb-zone placement considered for all interactive elements
- Desktop view adds sidebar and multi-column layouts as progressive enhancement

#### App Shell & Navigation
- Fixed sidebar on desktop, slide-over overlay on mobile with hamburger menu (matching Figma prototype)
- Role-filtered sidebar:
  - **Admin/Committee sees:** Services (Dashboard), Team Roster, Songs, Announcements, Equipment, Reports, Files
  - **Member sees:** My Schedule, Songs, Announcements, Files
- Default landing page depends on role:
  - Members always land on **My Schedule**
  - Admin/Committee can configure their default startup view in settings (any section)
- **My Schedule** (new view, not in Figma prototype) is a personal dashboard:
  - Upcoming assignments with position, date, confirmation status
  - Quick confirm/decline inline (no need to open service detail)
  - Availability calendar showing blackout dates with ability to add new ones
  - Recent announcements relevant to the member

#### Dark Mode & Theming
- Default theme follows system preference (OS light/dark setting)
- User can manually toggle, preference persists across sessions
- **Jack Dorsey design aesthetic:**
  - Clean, minimal, monochromatic with sharp typography
  - Lots of black/white contrast, generous whitespace, minimal decoration
  - Subtle blue accent for primary actions and interactive elements (buttons, active states, links)
  - Status colors retained for functional use (green=confirmed, amber=pending, red=declined)
- Typography: **Inter** (replacing Geist from the prototype)
- Overall feel: Square/Cash App meets church scheduling -- professional, not playful

### Claude's Discretion
- Login page layout and visual design (within Dorsey aesthetic, mobile-first)
- Password reset flow implementation details
- RLS policy structure and naming
- Mobile breakpoints and touch interaction specifics
- Loading states and skeleton design
- Error page design (404, 500, unauthorized)

### Deferred Ideas (OUT OF SCOPE)
- Supabase MCP connection -- needs to be set up before Phase 1 execution (user to configure PAT)
- Specific My Schedule view design -- detailed layout decisions belong in execution, core requirements captured here
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.95.3 | Supabase client (auth, database, realtime) | Official JS client; isomorphic, required by @supabase/ssr |
| `@supabase/ssr` | ^0.8.0 | SSR cookie-based auth for Next.js | Official SSR package; replaces deprecated auth-helpers; cookie chunking, auto token refresh |
| `next-themes` | ^0.4.6 | Dark mode toggling with persistence | Already installed; no-flash theme switching, localStorage persistence, system preference support |
| shadcn/ui Sidebar | (installed) | App shell sidebar navigation | Already installed in `components/ui/sidebar.tsx`; built-in mobile Sheet overlay, desktop fixed sidebar |
| `next/font/google` (Inter) | (built-in) | Inter font loading and optimization | Next.js built-in font optimization; replaces Geist per user decision |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^4.3.6 | Form validation schemas | Already installed; validate login/reset forms server-side |
| `react-hook-form` | ^7.71.1 | Form state management | Already installed; login and password reset forms |
| `@hookform/resolvers` | ^5.2.2 | Zod resolver for react-hook-form | Already installed; connects Zod schemas to forms |
| `sonner` | ^2.0.7 | Toast notifications | Already installed; auth success/error feedback |
| `lucide-react` | ^0.563.0 | Icons | Already installed; sidebar nav icons, UI elements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | auth-helpers is deprecated; ssr is the official replacement |
| next-themes | Manual CSS `prefers-color-scheme` | next-themes handles localStorage persistence, no-flash, and toggle; manual approach lacks these |
| Custom access token hook | Querying profiles table in RLS | Hook embeds role in JWT (no DB call per policy check); profiles query adds latency per row |

### Installation
```bash
pnpm add @supabase/supabase-js @supabase/ssr
```
Note: `next-themes`, `zod`, `react-hook-form`, `@hookform/resolvers`, `sonner`, `lucide-react`, and shadcn/ui components are already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
  (auth)/                     # Auth route group (no layout chrome)
    login/
      page.tsx                # Login page
    reset-password/
      page.tsx                # Request password reset
    update-password/
      page.tsx                # Set new password (after email link)
    error/
      page.tsx                # Auth error page
  (app)/                      # Authenticated app route group
    layout.tsx                # App shell layout (sidebar + main content)
    page.tsx                  # Redirect to role-based default page
    my-schedule/
      page.tsx                # Member landing page
    dashboard/
      page.tsx                # Admin/Committee landing page (Services)
    settings/
      page.tsx                # User settings (default view, theme)
  auth/
    callback/
      route.ts                # PKCE code exchange (OAuth/magic link)
    confirm/
      route.ts                # Email OTP verification (signup/reset)
    signout/
      route.ts                # Sign-out route handler
  layout.tsx                  # Root layout (ThemeProvider, fonts)
  globals.css                 # Tailwind + theme variables
lib/
  supabase/
    client.ts                 # Browser client factory
    server.ts                 # Server client factory (cookies)
    middleware.ts              # Proxy/session refresh logic
  auth/
    actions.ts                # Server Actions (login, reset, update password)
    roles.ts                  # Role types and permission helpers
middleware.ts                 # Next.js middleware entry point
```

### Pattern 1: Supabase Client Factories
**What:** Create separate client factory functions for browser and server contexts
**When to use:** Every Supabase interaction

**Browser client (`lib/supabase/client.ts`):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**Server client (`lib/supabase/server.ts`):**
```typescript
// Source: https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component - ignorable when using middleware
          }
        },
      },
    }
  )
}
```

### Pattern 2: Middleware-Based Session Refresh
**What:** Refresh expired auth tokens on every request via Next.js middleware
**When to use:** Mandatory for `@supabase/ssr` to work correctly

```typescript
// Source: https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT use getSession() -- use getUser() for security
  const { data: { user } } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/reset-password')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// middleware.ts (root)
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: Auth Callback Route Handler (PKCE Flow)
**What:** Exchange auth codes for sessions after email link clicks
**When to use:** Password reset and email confirmation flows

```typescript
// Source: Context7 /websites/supabase - auth callback examples
// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

```typescript
// Source: Context7 /websites/supabase - email confirmation
// app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = '/account'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  redirectTo.pathname = '/error'
  return NextResponse.redirect(redirectTo)
}
```

### Pattern 4: Custom Access Token Hook for Role Claims
**What:** Embed user role in JWT so RLS policies can check roles without DB queries
**When to use:** Required for performant role-based RLS

```sql
-- Source: https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac

-- Step 1: Create role enum (adapted for this project's three roles)
create type public.app_role as enum ('admin', 'committee', 'member');

-- Step 2: Create user_roles table
create table public.user_roles (
  id bigint generated by default as identity primary key,
  user_id uuid references auth.users on delete cascade not null,
  role app_role not null default 'member',
  unique (user_id, role)
);

-- Step 3: Create the custom access token hook
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role public.app_role;
begin
  select role into user_role
  from public.user_roles
  where user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', '"member"');
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Step 4: Grant permissions to auth admin
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant all on table public.user_roles to supabase_auth_admin;
revoke all on table public.user_roles from authenticated, anon, public;

create policy "Allow auth admin to read user roles"
  on public.user_roles
  as permissive for select
  to supabase_auth_admin
  using (true);
```

### Pattern 5: RLS Authorize Function
**What:** Reusable function to check user role from JWT in RLS policies
**When to use:** Every RLS policy that needs role-based access

```sql
-- Source: https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac

-- Simple role check function (reads from JWT, no DB call)
create or replace function public.has_role(required_role app_role)
returns boolean as $$
begin
  return (
    (select auth.jwt() ->> 'user_role')::public.app_role = required_role
  );
end;
$$ language plpgsql stable security definer set search_path = '';

-- Check if user has at least this role level
create or replace function public.has_role_or_higher(required_role app_role)
returns boolean as $$
declare
  current_role text;
begin
  current_role := (select auth.jwt() ->> 'user_role');

  if current_role = 'admin' then return true; end if;
  if current_role = 'committee' and required_role in ('committee', 'member') then return true; end if;
  if current_role = 'member' and required_role = 'member' then return true; end if;

  return false;
end;
$$ language plpgsql stable security definer set search_path = '';

-- Example RLS policies:
-- Admin can do everything on user_roles
create policy "Admins can manage all roles"
  on public.user_roles for all
  to authenticated
  using ((select public.has_role('admin')));

-- Users can read their own role
create policy "Users can read own role"
  on public.user_roles for select
  to authenticated
  using (user_id = (select auth.uid()));
```

### Pattern 6: next-themes with Tailwind CSS v4
**What:** Class-based dark mode with ThemeProvider in App Router
**When to use:** Root layout setup

```tsx
// Source: Context7 /pacocoursey/next-themes + shadcn/ui docs
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

The existing `globals.css` already has:
```css
@custom-variant dark (&:is(.dark *));
```
This activates Tailwind's `dark:` variant when `.dark` class is present, which next-themes manages.

### Pattern 7: Inter Font with Tailwind CSS v4
**What:** Replace Geist with Inter using next/font/google and CSS variables
**When to use:** Root layout font setup

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

// In the layout JSX:
<html lang="en" className={inter.variable} suppressHydrationWarning>
```

```css
/* globals.css - update the theme inline block */
@theme inline {
  --font-sans: var(--font-inter);
  /* ... rest of theme */
}
```

### Anti-Patterns to Avoid
- **Using `@supabase/auth-helpers-nextjs`:** Deprecated. Always use `@supabase/ssr` with `getAll`/`setAll` cookie methods.
- **Using `cookies.get()`/`cookies.set()`/`cookies.remove()` individually:** The `@supabase/ssr` package requires `getAll`/`setAll` bulk methods. Individual methods break cookie chunking.
- **Trusting `getSession()` on the server:** Use `getUser()` (or `getClaims()` for performance) in server code. `getSession()` reads from cookies without verifying the JWT.
- **Skipping middleware:** Without middleware, server component auth tokens won't refresh, causing silent logouts.
- **Storing roles in `user_metadata`:** User metadata is writable by the authenticated user. Use `app_metadata` or a separate `user_roles` table with custom access token hook.
- **Querying the database in every RLS policy for role checks:** Use JWT claims instead -- the custom access token hook embeds the role, avoiding per-row DB lookups.
- **Using `prefers-color-scheme` media query directly for manual dark mode:** This conflicts with next-themes class-based toggling. Use the `@custom-variant dark` directive with class-based approach instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based SSR auth | Custom cookie management | `@supabase/ssr` | Handles cookie chunking for large JWTs, automatic token refresh, cross-context session sync |
| Dark mode toggle with persistence | Manual localStorage + class toggle | `next-themes` | Handles SSR hydration (no flash), system preference detection, localStorage persistence |
| Mobile sidebar overlay | Custom Sheet/drawer with state | shadcn/ui `Sidebar` component | Already installed; auto-detects mobile via `useIsMobile()` hook, renders Sheet overlay on mobile, fixed sidebar on desktop |
| Form validation | Manual regex/checks | `zod` + `react-hook-form` + `@hookform/resolvers` | Already installed; type-safe validation, server action compatible |
| JWT role extraction | Manual JWT parsing | Supabase custom access token hook + `auth.jwt()` in RLS | Hook runs at token issuance time; `auth.jwt()` reads cached claims per-statement |
| Protected route redirects | Manual redirect in every page | Next.js middleware with `@supabase/ssr` | Single check point; runs before page render; handles both auth refresh and redirect |

**Key insight:** Supabase's `@supabase/ssr` package exists specifically because SSR auth with cookies is deceptively complex -- cookie chunking for large JWTs, cross-context state sync, and token refresh timing are all edge cases that cause production bugs if hand-rolled.

## Common Pitfalls

### Pitfall 1: Missing Middleware Causes Silent Auth Failures
**What goes wrong:** Server components render with stale/expired tokens, causing random 401 errors or showing logged-out state despite user being logged in.
**Why it happens:** Without middleware refreshing tokens on each request, expired JWTs are never renewed. Server components can't set cookies, so they can't trigger token refresh.
**How to avoid:** Always implement the middleware pattern from `@supabase/ssr`. The middleware MUST call `supabase.auth.getUser()` to trigger token refresh.
**Warning signs:** Users report "randomly being logged out" or seeing login page after idle periods.

### Pitfall 2: `setAll` Error in Server Components is Expected
**What goes wrong:** Developers see a `try/catch` in the server client's `setAll` and think something is broken.
**Why it happens:** Server Components are read-only and cannot set cookies. The `setAll` will throw when called from a Server Component, but this is handled by the middleware which does the actual cookie setting.
**How to avoid:** Keep the `try/catch` in `server.ts`. The middleware handles cookie writes. This is the documented pattern.
**Warning signs:** Removing the try/catch causes unhandled errors in Server Components.

### Pitfall 3: Tailwind v4 Dark Mode Requires `@custom-variant`
**What goes wrong:** `dark:` prefixed classes don't work even though `.dark` class is on `<html>`.
**Why it happens:** Tailwind CSS v4 uses CSS-based configuration instead of `tailwind.config.js`. The `darkMode: 'class'` config no longer exists.
**How to avoid:** The project already has `@custom-variant dark (&:is(.dark *));` in `globals.css`. Do not remove it. This is the Tailwind v4 equivalent of `darkMode: 'class'`.
**Warning signs:** `dark:bg-black` has no effect when toggling themes.

### Pitfall 4: Role Changes Not Reflected Until Re-Login
**What goes wrong:** Admin changes a user's role but the user still sees the old role.
**Why it happens:** The custom access token hook embeds the role in the JWT at token issuance time. Until the token is refreshed, the old role persists in the JWT claims.
**How to avoid:** After a role change, either: (a) force a token refresh by calling `supabase.auth.refreshSession()`, or (b) inform the user to log out and log back in. For admin-initiated changes, consider a Supabase Edge Function or server action that invalidates the user's session.
**Warning signs:** User sees old permissions after role change, works after re-login.

### Pitfall 5: PKCE Flow Requires Auth Callback Route
**What goes wrong:** Password reset email link leads to a broken page or auth error.
**Why it happens:** SSR apps use PKCE flow (not implicit). Email links contain a code that must be exchanged for a session via a route handler.
**How to avoid:** Implement both `app/auth/callback/route.ts` (for code exchange) and `app/auth/confirm/route.ts` (for email OTP verification). Configure the redirect URL in Supabase dashboard.
**Warning signs:** Password reset email links lead to error pages.

### Pitfall 6: Supabase Environment Variable Naming
**What goes wrong:** Auth fails silently or the client can't connect.
**Why it happens:** Supabase docs now use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in some examples while older examples use `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Both refer to the same key.
**How to avoid:** Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` consistently (the more established naming). Ensure both are set in `.env.local`.
**Warning signs:** "Invalid API key" or connection refused errors.

### Pitfall 7: Font Variable Scoping in Tailwind v4
**What goes wrong:** Custom font doesn't apply despite being loaded.
**Why it happens:** In Tailwind CSS v4, the `@theme inline` block needs the CSS variable to map to the font-sans token. If the CSS variable name from `next/font` doesn't match what's in the theme, the font won't apply.
**How to avoid:** Ensure the `variable` prop in the font config (e.g., `--font-inter`) matches what's referenced in `@theme inline` (e.g., `--font-sans: var(--font-inter)`). Also add the variable class to the `<html>` element.
**Warning signs:** Font loads in network tab but body text uses system font.

## Code Examples

Verified patterns from official sources:

### Login Server Action
```typescript
// Source: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
// lib/auth/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=Invalid+credentials')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
```

### Password Reset Request
```typescript
// lib/auth/actions.ts (continued)
export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
  })

  if (error) {
    redirect('/reset-password?error=Could+not+send+reset+email')
  }

  redirect('/reset-password?message=Check+your+email+for+a+reset+link')
}
```

### Update Password (After Reset Link)
```typescript
// lib/auth/actions.ts (continued)
export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/update-password?error=Could+not+update+password')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
```

### Sign Out Route Handler
```typescript
// Source: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
// app/auth/signout/route.ts
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  revalidatePath('/', 'layout')
  return NextResponse.redirect(new URL('/login', req.url), { status: 302 })
}
```

### Reading User Role from JWT (Client-Side)
```typescript
// Source: https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac
import { jwtDecode } from 'jwt-decode'
import type { Session } from '@supabase/supabase-js'

type AppRole = 'admin' | 'committee' | 'member'

interface CustomJwtPayload {
  user_role: AppRole
}

function getUserRole(session: Session): AppRole {
  const jwt = jwtDecode<CustomJwtPayload>(session.access_token)
  return jwt.user_role ?? 'member'
}
```

### Reading User Role from JWT (Server-Side in RLS)
```sql
-- Source: https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac
-- In any RLS policy:
-- Get current user's role from JWT (cached per-statement)
(select auth.jwt() ->> 'user_role')

-- Example: Only admins can insert into user_roles
create policy "Only admins can assign roles"
  on public.user_roles for insert
  to authenticated
  using ((select auth.jwt() ->> 'user_role') = 'admin');
```

### Sidebar with Role-Based Navigation
```tsx
// Conceptual pattern for role-filtered sidebar
// Source: shadcn/ui sidebar docs + project decisions
const adminNavItems = [
  { title: 'Services', href: '/dashboard', icon: CalendarIcon },
  { title: 'Team Roster', href: '/team-roster', icon: UsersIcon },
  { title: 'Songs', href: '/songs', icon: MusicIcon },
  { title: 'Announcements', href: '/announcements', icon: MegaphoneIcon },
  { title: 'Equipment', href: '/equipment', icon: WrenchIcon },
  { title: 'Reports', href: '/reports', icon: BarChartIcon },
  { title: 'Files', href: '/files', icon: FolderIcon },
]

const memberNavItems = [
  { title: 'My Schedule', href: '/my-schedule', icon: CalendarCheckIcon },
  { title: 'Songs', href: '/songs', icon: MusicIcon },
  { title: 'Announcements', href: '/announcements', icon: MegaphoneIcon },
  { title: 'Files', href: '/files', icon: FolderIcon },
]

function getNavItems(role: AppRole) {
  return role === 'member' ? memberNavItems : adminNavItems
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | All auth-helpers packages deprecated; consolidated into framework-agnostic `@supabase/ssr` |
| `cookies.get/set/remove` individual methods | `getAll/setAll` bulk methods | `@supabase/ssr` v0.4+ | Cookie chunking requires bulk operations; individual methods break large JWT handling |
| `getSession()` for server auth checks | `getUser()` or `getClaims()` | 2025 | `getSession()` reads cookies without JWT validation; `getUser()` verifies with auth server; `getClaims()` validates JWT signature locally |
| `tailwind.config.js` `darkMode: 'class'` | `@custom-variant dark (&:is(.dark *));` in CSS | Tailwind CSS v4 (2025) | Config-free CSS-based approach; no JavaScript config file needed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (in new docs) | Late 2025 | Supabase renaming for clarity; both names work; `ANON_KEY` still widely used |
| Profiles table with role column queried in RLS | Custom access token hook embedding role in JWT | 2024-2025 | Eliminates per-row DB lookup in RLS; role is available in JWT claims cache |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`
- `@supabase/auth-helpers-react`: Replaced by `@supabase/ssr`
- `supabase.auth.getSession()` for server-side auth: Use `getUser()` or `getClaims()` instead
- Tailwind CSS v3 `darkMode: 'class'` in config: Use `@custom-variant dark` in CSS for v4

## Open Questions

1. **Existing Supabase project schema**
   - What we know: The scheduling app shares a Supabase project with an existing attendance system. There's an existing member table and admin user.
   - What's unclear: The exact schema of the existing tables, whether a `user_roles` table already exists, and whether the attendance system already uses custom JWT claims.
   - Recommendation: Before executing Phase 1, inspect the existing Supabase project schema. If `user_roles` already exists, adapt to its structure. If not, create it as part of Phase 1.

2. **`getClaims()` vs `getUser()` availability**
   - What we know: Supabase docs now recommend `getClaims()` for performance (local JWT validation, no DB round-trip). `getUser()` is the traditional method that verifies with the auth server.
   - What's unclear: Whether `getClaims()` is fully stable in `@supabase/supabase-js` v2.95.x or is a newer addition. Some docs still reference `getUser()`.
   - Recommendation: Use `getUser()` in middleware (proven stable, handles token refresh). Consider `getClaims()` in Server Components for performance if confirmed available. Validate during execution.

3. **Admin invitation flow integration**
   - What we know: The attendance system has an existing invitation method. Admins invite members via email.
   - What's unclear: Whether this uses `supabase.auth.admin.inviteUserByEmail()` or a custom flow. Phase 1 may not need to build this if it already works.
   - Recommendation: Verify the existing invitation flow. Phase 1 focuses on login/reset for already-invited users; the invitation mechanism is likely already functional.

4. **Supabase MCP connection for execution**
   - What we know: Deferred -- user needs to set up PAT before Phase 1 execution.
   - What's unclear: Whether SQL migrations will be run via Supabase dashboard SQL editor, Supabase CLI, or MCP.
   - Recommendation: Plan for SQL migrations as standalone `.sql` files that can be run via any method. Don't depend on MCP being available.

## Sources

### Primary (HIGH confidence)
- Context7 `/supabase/ssr` - Client creation patterns, cookie handling, middleware architecture
- Context7 `/websites/supabase` - Auth flows (login, signup, signout, password reset), PKCE callback handlers, RLS policies, custom claims RBAC
- Context7 `/pacocoursey/next-themes` - ThemeProvider setup, class attribute, Tailwind CSS integration
- [Supabase SSR Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) - Server-side auth setup for Next.js
- [Supabase Custom Claims & RBAC](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac) - Role-based access with JWT custom claims
- [Supabase Password-Based Auth](https://supabase.com/docs/guides/auth/passwords) - Password reset flow
- [Supabase AI Prompts - Next.js Auth](https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth) - Complete client/server/middleware code
- [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/radix/sidebar) - Sidebar component API

### Secondary (MEDIUM confidence)
- [shadcn/ui Dark Mode for Next.js](https://ui.shadcn.com/docs/dark-mode/next) - next-themes + shadcn/ui integration pattern
- [Build with Matija - Google Fonts in Next.js 15 + Tailwind v4](https://www.buildwithmatija.com/blog/how-to-use-custom-google-fonts-in-next-js-15-and-tailwind-v4) - Font CSS variable setup
- [Flexible Dark Mode with Tailwind v4 Custom Variants](https://schoen.world/n/tailwind-dark-mode-custom-variant) - `@custom-variant dark` configuration
- [Supabase GitHub Issue #40985](https://github.com/supabase/supabase/issues/40985) - getClaims vs getUser clarification
- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr) - Latest version v0.8.0
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) - Latest version v2.95.3

### Tertiary (LOW confidence)
- `getClaims()` method -- referenced in newer Supabase docs but not fully documented in Context7 sources. Verify availability before relying on it in production code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via Context7 and official docs; versions confirmed via npm
- Architecture: HIGH - Patterns sourced from official Supabase SSR guide, Context7 examples, and shadcn/ui docs
- Pitfalls: HIGH - Documented gotchas from official sources, GitHub issues, and @supabase/ssr design docs
- RLS/RBAC: HIGH - Custom access token hook pattern directly from official Supabase RBAC guide
- Dark mode: HIGH - Already configured in project (`@custom-variant dark`); next-themes pattern verified in Context7
- Font integration: MEDIUM - Pattern from community guides, consistent with Next.js docs but not verified in Context7

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days -- stable libraries, no major breaking changes expected)
