# Technology Stack

**Analysis Date:** 2026-02-13

## Languages

**Primary:**
- TypeScript 5.x - Full codebase with strict mode enabled, all source files are `.ts` or `.tsx`

**Secondary:**
- JavaScript - PostCSS configuration in `.mjs` format

## Runtime

**Environment:**
- Node.js (version not pinned; no `.nvmrc` file present)

**Package Manager:**
- pnpm - Lockfile present at `pnpm-lock.yaml` (lockfileVersion 9.0)

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router-based application with server components by default
- React 19.2.3 - Server and client components, RSC enabled

**UI & Components:**
- Tailwind CSS 4 - PostCSS-based styling via `@tailwindcss/postcss` v4.1.18
- shadcn/ui 3.8.4 - Component library (configured in `components.json` with New York style, RSC enabled, Lucide icons)
- Radix UI 1.4.3 - Primitive component library for accessible base components
- Base UI 1.1.0 - Additional headless component library

**Forms & Data:**
- React Hook Form 7.71.1 - Form state management
- @hookform/resolvers 5.2.2 - Validation resolvers for React Hook Form
- Zod 4.3.6 - Runtime validation and type inference

**UI/UX Utilities:**
- Lucide React 0.563.0 - Icon library
- clsx 2.1.1 - Class name utility
- tailwind-merge 3.4.0 - Tailwind CSS class merger
- next-themes 0.4.6 - Dark mode provider
- sonner 2.0.7 - Toast notification system
- vaul 1.1.2 - Drawer/dialog component

**Charts & Data Visualization:**
- Recharts 2.15.4 - Composable charting library

**Date/Time:**
- date-fns 4.1.0 - Modern date utility library
- react-day-picker 9.13.1 - Flexible day picker component

**Input & Interaction:**
- input-otp 1.4.2 - OTP input component
- cmdk 1.1.1 - Command palette / menu component
- embla-carousel-react 8.6.0 - Carousel component
- react-resizable-panels 4.6.2 - Resizable panel layout
- tw-animate-css 1.4.0 - Tailwind animation utilities

**Class Variance:**
- class-variance-authority 0.7.1 - Component variant pattern utility

## Build & Development Tools

**Bundler/Dev Server:**
- Next.js built-in (Turbopack) - Used for `pnpm dev`

**Type Checking:**
- TypeScript 5.x (exact version in `package.json` as `^5`)

**Linting & Formatting:**
- Biome 2.2.0 - Unified linter and formatter (replaces ESLint/Prettier)
  - Config: `biome.json` with React and Next.js recommended rules
  - Indentation: 2 spaces
  - Disabled: `noUnknownAtRules` (for Tailwind CSS)
  - Enabled: Import organization via assist actions

**Type Definitions:**
- @types/node ^20 - Node.js type definitions
- @types/react ^19 - React type definitions
- @types/react-dom ^19 - React DOM type definitions

## Configuration Files

**Build & Compilation:**
- `next.config.ts` - Next.js configuration (currently minimal/empty)
- `tsconfig.json` - TypeScript configuration
  - Strict mode enabled
  - Path alias: `@/*` maps to project root
  - Target: ES2017
  - Module: esnext with bundler resolution

**Styling:**
- `postcss.config.mjs` - PostCSS configuration with Tailwind CSS v4
- `app/globals.css` - Tailwind imports and CSS variable theme (light/dark via `prefers-color-scheme`)

**Component Generation:**
- `components.json` - shadcn/ui configuration
  - Style: New York
  - RSC: true
  - TypeScript: true
  - Tailwind CSS variables enabled
  - Icon library: Lucide
  - Aliases configured for `components`, `ui`, `lib`, `hooks`, `utils`

**Linting & Code Quality:**
- `biome.json` - Biome configuration (linting and formatting)

## Package Distribution

**No database, ORM, or backend framework installed.** The application is a frontend-only Next.js app at early stage.

**No external API clients installed.** No Stripe, Supabase, Firebase, AWS SDK, or similar packages are present.

## Platform Requirements

**Development:**
- pnpm (package manager)
- Node.js (version unspecified)
- TypeScript 5.x
- PostCSS and Tailwind CSS build pipeline

**Production:**
- Node.js runtime (specified by Next.js 16.1.6)
- No special requirements; standard Next.js deployment

**Deployment Target:**
- Vercel (likely, given Next.js project structure and Vercel references in boilerplate code)
- Can deploy to any Node.js-compatible hosting

---

*Stack analysis: 2026-02-13*
