# Stack Research

**Domain:** Church Worship Team Scheduling (Planning Center clone)
**Researched:** 2026-02-13
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js | 16.1.6 | Full-stack React framework | Already scaffolded. App Router with React Server Components gives server-first data fetching, middleware auth guards, and Server Actions for mutations -- all critical for a multi-role scheduling app. Turbopack for fast dev builds. | HIGH |
| React | 19.2.3 | UI library | Already installed. React 19 brings `use()` hook for promise/context consumption, server components as default, and improved Suspense -- reduces client bundle for a read-heavy scheduling UI. | HIGH |
| TypeScript | ~5.x | Type safety | Already configured with strict mode. Non-negotiable for a multi-model domain (services, teams, assignments, songs, equipment) where type errors in scheduling logic cause silent data corruption. | HIGH |
| Supabase | Platform | Backend-as-a-Service (Postgres, Auth, Realtime, Storage, Edge Functions) | Single platform covers auth, database, file storage, and realtime -- avoids stitching together 5+ services. RLS policies enforce multi-role access at the database level (admin vs team lead vs member). Realtime channels enable live schedule updates during rehearsals. | HIGH |
| `@supabase/supabase-js` | ^2.95.3 | Supabase client SDK | Isomorphic client works in both server components and client components. Typed with generated types from Supabase CLI. | HIGH |
| `@supabase/ssr` | ^0.8.0 | SSR cookie-based auth | Required for Next.js App Router. Handles token refresh in middleware, cookie management across server/client boundary. Replaces deprecated `@supabase/auth-helpers-nextjs`. | HIGH |
| Tailwind CSS | v4 | Utility-first CSS | Already configured. v4 uses `@theme inline` and CSS-native approach -- no config file needed. Combined with shadcn/ui components for consistent, accessible UI. | HIGH |
| Biome | 2.2.0 | Linting + formatting | Already configured. Replaces ESLint + Prettier with a single, faster tool. Handles import organization, React rules, and Tailwind-compatible `@` directives. | HIGH |

### Database & Auth

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Supabase Postgres | 15+ | Primary database | Full Postgres with extensions (pg_cron for recurring schedules, pg_net for webhooks). RLS policies enforce role-based access without application-level guards. Generated types via CLI keep TypeScript in sync. | HIGH |
| Supabase Auth | Included | Authentication + authorization | Email/password + magic link auth out of the box. Custom claims for roles (admin, team_lead, member). JWT-based with middleware refresh. Avoids building auth from scratch -- the #1 thing to not roll your own. | HIGH |
| Supabase Realtime | Included | Live updates | Broadcast for ephemeral messages (e.g., "rehearsal starting"), Presence for who's online, Postgres Changes for live schedule updates. Handles 10K+ concurrent WebSocket connections. | HIGH |
| Supabase Storage | Included | File management | Handles sheet music PDFs, chord charts, audio tracks. RLS-secured buckets per team/ministry. Built-in image optimization for profile photos. Avoids adding a separate file service. | HIGH |
| Supabase CLI | ^2.76.8 | Local dev + migrations | Local Postgres instance for development, migration management, type generation (`supabase gen types typescript`), seed data. Essential for team collaboration on schema changes. | HIGH |

### UI Components

| Library | Version | Purpose | Why Recommended | Confidence |
|---------|---------|---------|-----------------|------------|
| shadcn/ui (via `shadcn` CLI) | ^3.8.4 | Component library | Already installed. Copy-paste components (not a dependency) built on Radix UI primitives. Full control over styling, accessible by default, works with Tailwind v4. Perfect for scheduling UI (dialogs, selects, tables, calendars). | HIGH |
| Radix UI | ^1.4.3 | Accessible primitives | Already installed (via shadcn). Headless UI primitives with WAI-ARIA compliance. Powers shadcn/ui components. | HIGH |
| Lucide React | ^0.563.0 | Icons | Already installed. Tree-shakeable, consistent icon set. Used by shadcn/ui. | HIGH |
| `@fullcalendar/react` | ^6.1.20 | Calendar views | The scheduling app's core UI. Provides month/week/day/list views, drag-and-drop event management, event resizing, and resource scheduling (assign team members to time slots). Plugin architecture keeps bundle size manageable. | HIGH |
| Recharts | 2.15.4 | Data visualization | Already installed. For admin reports: attendance trends, team participation rates, schedule fill rates. Built on D3 with declarative React API. | MEDIUM |

### Forms & Validation

| Library | Version | Purpose | Why Recommended | Confidence |
|---------|---------|---------|-----------------|------------|
| React Hook Form | ^7.71.1 | Form state management | Already installed. Uncontrolled form approach minimizes re-renders -- important for complex scheduling forms (multi-select team members, recurring dates, song selections). | HIGH |
| `@hookform/resolvers` | ^5.2.2 | Schema validation bridge | Already installed. Connects React Hook Form to Zod schemas for type-safe validation. | HIGH |
| Zod | ^4.3.6 | Schema validation | Already installed. Validates both client forms and Server Action inputs. Single source of truth for TypeScript types via `z.infer`. Zod 4 has better performance and tree-shaking. | HIGH |

### State Management & Data Fetching

| Library | Version | Purpose | Why Recommended | Confidence |
|---------|---------|---------|-----------------|------------|
| `@tanstack/react-query` | ^5.90.21 | Server state + caching | Caches Supabase queries, handles background refetching, optimistic updates for schedule changes, and pagination for song library. Works alongside Server Components -- use in client components that need interactivity (drag-drop calendar, real-time views). | HIGH |
| Zustand | ^5.0.11 | Client state | Lightweight (1KB) global state for UI concerns: sidebar open/closed, active filters, notification preferences. No provider needed -- simpler than Context for cross-component state. | MEDIUM |
| nuqs | ^2.8.8 | URL state management | Type-safe search params for shareable views: filtered team rosters, date-range reports, search queries. "Share this schedule view" becomes a URL copy. 6KB gzipped. Used by Vercel, Supabase, Sentry. | MEDIUM |

### Email & Notifications

| Library | Version | Purpose | Why Recommended | Confidence |
|---------|---------|---------|-----------------|------------|
| Resend | ^6.9.2 | Transactional email API | Send schedule confirmations, reminders, and announcements. Developer-friendly API, generous free tier (100 emails/day). Pairs with React Email for templating. | MEDIUM |
| `@react-email/components` | ^1.0.7 | Email templates in React | Build email templates with React components instead of raw HTML. Type-safe, preview-able, version-controlled. Templates for: schedule published, assignment notification, reminder, announcement. | MEDIUM |

### Utilities

| Library | Version | Purpose | Why Recommended | Confidence |
|---------|---------|---------|-----------------|------------|
| date-fns | ^4.1.0 | Date manipulation | Already installed. Tree-shakeable date utilities for scheduling logic: recurring events, timezone handling, relative dates ("next Sunday"). Lighter than Moment.js or Luxon. | HIGH |
| Sonner | ^2.0.7 | Toast notifications | Already installed. Lightweight toast component for action feedback: "Schedule published", "Assignment accepted", "Song added". | HIGH |
| next-themes | ^0.4.6 | Theme management | Already installed. Dark/light mode toggle with system preference detection. | HIGH |
| clsx + tailwind-merge | ^2.1.1 / ^3.4.0 | Class name utilities | Already installed. Conditional class composition without conflicts. Essential for component variants. | HIGH |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase CLI (`supabase`) | Local dev, migrations, type gen | Run `supabase init`, `supabase start` for local Postgres + Auth. `supabase gen types typescript` for DB types. |
| Biome | Lint + format | `pnpm lint` and `pnpm format`. Configured in `biome.json`. |
| `@tanstack/react-query-devtools` | Debug query cache | Dev-only. Inspect cached queries, refetch states, stale timers. |
| shadcn CLI | Add UI components | `pnpm dlx shadcn@latest add [component]`. Copy-paste, not dependency. |
| Turbopack | Dev server bundler | Built into Next.js 16. 10x faster than Webpack for HMR. |

## Installation

```bash
# Supabase (core)
pnpm add @supabase/supabase-js @supabase/ssr

# Calendar
pnpm add @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction

# Data fetching & state
pnpm add @tanstack/react-query zustand nuqs

# Email
pnpm add resend @react-email/components

# Dev dependencies
pnpm add -D supabase @tanstack/react-query-devtools
```

Note: The following are already installed and do NOT need to be added:
- `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `@biomejs/biome`
- `react-hook-form`, `@hookform/resolvers`, `zod`
- `date-fns`, `lucide-react`, `sonner`, `next-themes`, `clsx`, `tailwind-merge`
- `recharts`, `radix-ui`, `shadcn`, `react-day-picker`
- `class-variance-authority`, `cmdk`, `vaul`, `react-resizable-panels`, `embla-carousel-react`, `input-otp`

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Supabase Auth | NextAuth.js / Auth.js | Supabase Auth is tightly integrated with RLS policies -- row-level security checks auth.uid() directly in SQL. NextAuth adds a separate auth layer that can't enforce DB-level permissions without custom middleware. |
| Supabase Storage | UploadThing | Adding a third-party file service when Supabase Storage is included for free is unnecessary complexity. Supabase Storage supports RLS on buckets, S3-compatible API, and 500GB uploads on paid plans. UploadThing makes sense when you don't have Supabase. |
| `@fullcalendar/react` | `react-big-calendar` | FullCalendar has built-in drag-and-drop, event resizing, and resource scheduling (assign people to slots). react-big-calendar requires bolting on react-dnd separately. For a scheduling app, FullCalendar's out-of-box features save significant development time. |
| Zustand | Jotai / Redux Toolkit | Zustand is simpler for this use case (UI state only; server state lives in React Query). No atoms to compose (Jotai) and no boilerplate (Redux). If the app grows to need computed derived state, Zustand's `subscribe` + selectors handle it. |
| React Hook Form | Formik | React Hook Form's uncontrolled approach avoids re-render cascades in complex scheduling forms. Formik re-renders the entire form on every keystroke. RHF also has better TypeScript inference with Zod resolvers. |
| nuqs | Manual `useSearchParams` | nuqs provides type-safe parsers, throttled URL updates (prevents browser rate-limiting), and multi-key batching. Manual search params require reimplementing all of this. |
| Resend + React Email | SendGrid / Nodemailer | Resend's React-component-based templates are maintainable and type-safe. SendGrid uses legacy HTML templates. Nodemailer requires SMTP configuration and doesn't scale without additional infrastructure. |
| date-fns | Day.js / Luxon | date-fns is tree-shakeable (import only what you use), already installed, and has the broadest function library for recurring schedule logic. Day.js lacks some advanced formatting. Luxon is heavier. |
| Biome | ESLint + Prettier | Biome is a single tool replacing two, with faster execution (Rust-based). Already configured in the project. Switching to ESLint + Prettier adds config complexity for no benefit. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | **Deprecated.** Replaced by `@supabase/ssr`. Auth helpers don't support the `getAll`/`setAll` cookie API required by modern Next.js. | `@supabase/ssr` |
| Prisma / Drizzle ORM | Adds an abstraction layer over Supabase's already-typed client. Breaks RLS (ORMs typically bypass Postgres policies by using a service role). The Supabase JS client with generated types provides equivalent type safety without the overhead. | `@supabase/supabase-js` with `supabase gen types typescript` |
| Redux / Redux Toolkit | Overkill for this app. Server state belongs in React Query; UI state belongs in Zustand. Redux's boilerplate (slices, reducers, actions) slows development without proportional benefit for a scheduling domain. | `@tanstack/react-query` + Zustand |
| Moment.js | **Deprecated** by its own maintainers. Mutable API causes bugs. Not tree-shakeable (67KB full bundle). | `date-fns` |
| `styled-components` / Emotion / CSS Modules | Tailwind CSS v4 is already configured. Adding a CSS-in-JS library creates two styling paradigms, confuses contributors, and adds runtime cost. | Tailwind CSS v4 + `cn()` utility |
| Firebase | Vendor lock-in with proprietary query language. No SQL access, no migrations, no RLS policies. Supabase gives full Postgres with open-source escape hatch. | Supabase |
| tRPC | Unnecessary when using Supabase client directly + Server Actions. tRPC adds a router layer between your app and database that duplicates what Supabase already provides (typed client, RLS-secured endpoints). | Supabase client + Next.js Server Actions |
| Clerk / Kinde | Third-party auth services add cost and another vendor dependency when Supabase Auth is included in the platform and integrates natively with RLS. Clerk's free tier has user limits that constrain church growth. | Supabase Auth |

## Stack Patterns by Variant

**If you need recurring schedule generation (e.g., "every Sunday at 9am"):**
- Use `pg_cron` Postgres extension via Supabase Dashboard
- Cron job creates service instances N weeks ahead
- Avoids application-level scheduling daemons
- Because: Database-level scheduling survives app restarts and serverless cold starts

**If you need PDF generation (e.g., printable schedule sheets):**
- Use `@react-pdf/renderer` (render React components to PDF)
- Generate in a Next.js API route or Edge Function
- Because: Church teams often need physical printouts for tech booths and rehearsal rooms

**If you need push notifications (future phase):**
- Use Supabase Edge Functions + web-push library
- Subscribe via Service Worker in the client
- Because: Team members need "you've been scheduled" alerts even when the app isn't open

**If you scale beyond Supabase free tier:**
- Supabase Pro plan ($25/month) covers 100K MAU, 8GB database, 100GB storage
- Because: A church of 500 members with 100 active team members fits comfortably in Pro

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16.1.6 | React 19.2.3 | Next.js 16 requires React 19. Verified in project. |
| `@supabase/ssr` ^0.8.0 | `@supabase/supabase-js` ^2.x | SSR package depends on supabase-js v2. They must be on the same major version. |
| `@fullcalendar/react` ^6.1.20 | React 19 | FullCalendar v6 supports React 18+. Verified compatible with React 19. |
| `@tanstack/react-query` ^5.x | React 19 | TanStack Query v5 supports React 18+, confirmed React 19 support. |
| Zustand ^5.0.11 | React 19 | Zustand 5 explicitly supports React 19. |
| Zod ^4.3.6 | `@hookform/resolvers` ^5.x | Zod 4 requires hookform/resolvers v5+. Both already installed at compatible versions. |
| nuqs ^2.8.8 | Next.js >=14.2.0 | Compatible with Next.js 16 App Router. |
| Tailwind CSS v4 | `tw-animate-css` ^1.4.0 | Already configured. tw-animate-css replaces tailwindcss-animate for Tailwind v4. |
| shadcn ^3.8.4 | Tailwind v4, Radix UI ^1.x | shadcn v3+ supports Tailwind v4 natively. |

## Sources

- [Context7: @supabase/ssr](https://context7.com/supabase/ssr) -- SSR client setup patterns, cookie management, middleware configuration (HIGH confidence)
- [Supabase Docs: Next.js Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs) -- Official auth setup guide (HIGH confidence)
- [Supabase Docs: Storage](https://supabase.com/docs/guides/storage) -- File upload capabilities, bucket policies (HIGH confidence)
- [Supabase Docs: Realtime](https://supabase.com/docs/guides/realtime) -- Broadcast, Presence, Postgres Changes (HIGH confidence)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) -- Version 2.95.3 verified (HIGH confidence)
- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr) -- Version 0.8.0 verified (HIGH confidence)
- [supabase CLI npm](https://www.npmjs.com/package/supabase) -- Version 2.76.8 verified (HIGH confidence)
- [@tanstack/react-query npm](https://www.npmjs.com/package/@tanstack/react-query) -- Version 5.90.21 verified (HIGH confidence)
- [Zustand npm](https://www.npmjs.com/package/zustand) -- Version 5.0.11 verified (HIGH confidence)
- [nuqs npm](https://www.npmjs.com/package/nuqs) -- Version 2.8.8 verified (HIGH confidence)
- [@fullcalendar/react npm](https://www.npmjs.com/package/@fullcalendar/react) -- Version 6.1.20 verified (HIGH confidence)
- [Resend npm](https://www.npmjs.com/package/resend) -- Version 6.9.2 verified (HIGH confidence)
- [@react-email/components npm](https://www.npmjs.com/package/@react-email/components) -- Version 1.0.7 verified (HIGH confidence)
- [FullCalendar Docs](https://fullcalendar.io/docs/react) -- React integration, plugin architecture (HIGH confidence)
- [nuqs.dev](https://nuqs.dev/) -- URL state management features, framework support (HIGH confidence)
- [Bryntum: FullCalendar vs Big Calendar](https://bryntum.com/blog/react-fullcalendar-vs-big-calendar/) -- Feature comparison for calendar libraries (MEDIUM confidence)
- [Supabase Blog: Realtime Authorization](https://supabase.com/blog/supabase-realtime-broadcast-and-presence-authorization) -- Fine-grained realtime access control (HIGH confidence)

---
*Stack research for: Church Worship Team Scheduling (YM Serving System)*
*Researched: 2026-02-13*
