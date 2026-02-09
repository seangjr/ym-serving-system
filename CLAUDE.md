# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YM Serving System — a Next.js 16 application using React 19, Tailwind CSS v4, and the App Router. Currently in early stage (scaffolded from create-next-app). Uses pnpm as the package manager.

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run Biome linter
pnpm format       # Format code with Biome (--write)
```

## Tech Stack

- **Framework**: Next.js 16 with App Router (`app/` directory)
- **React**: v19 with server components by default
- **Styling**: Tailwind CSS v4 via PostCSS, Geist fonts (sans + mono)
- **Linting/Formatting**: Biome (not ESLint/Prettier) — config in `biome.json`
- **TypeScript**: Strict mode, path alias `@/*` maps to project root
- **Package Manager**: pnpm

## Architecture

All source code lives in the `app/` directory using Next.js App Router conventions:
- `app/layout.tsx` — Root layout with Geist font setup via CSS variables
- `app/page.tsx` — Home page
- `app/globals.css` — Tailwind imports and CSS variable theme (light/dark via `prefers-color-scheme`)

No API routes, middleware, database, or ORM are configured yet.

## Code Style (Biome)

Biome handles both linting and formatting. Key settings:
- 2-space indentation
- Recommended rules for React and Next.js domains
- `noUnknownAtRules` disabled (for Tailwind CSS `@` directives)
- Import organization enabled via assist actions

Run `pnpm format` to auto-fix formatting. Run `pnpm lint` to check for issues.

## Development Workflow

This project uses the **GSD (Get Shit Done) framework** (v1.18.0) for spec-driven development. Key commands:
- `/gsd:new-project` — Initialize project with deep context gathering
- `/gsd:plan-phase` — Create detailed execution plan for a phase
- `/gsd:execute-phase` — Execute plans with wave-based parallelization
- `/gsd:progress` — Check project progress and route to next action
- `/gsd:quick` — Execute quick tasks with atomic commits
- `/gsd:debug` — Systematic debugging with persistent state
- `/gsd:help` — Show all available GSD commands

GSD configuration lives in `.claude/get-shit-done/`. Planning artifacts go in `.planning/`.

## Installed Skills

Five agent skills are available in `.agents/skills/` (symlinked from `.claude/skills/`):

| Skill | Use When |
|---|---|
| **frontend-design** | Building UI components, pages, or layouts — generates distinctive, production-grade designs |
| **vercel-react-best-practices** | Writing/reviewing React or Next.js code for performance optimization |
| **vercel-composition-patterns** | Designing reusable component APIs, compound components, avoiding boolean prop proliferation |
| **supabase-postgres-best-practices** | Writing/optimizing Postgres queries, schema design, RLS policies |
| **agent-browser** | Browser automation — navigating pages, filling forms, taking screenshots, scraping data |

## Agent Teams

For complex, multi-step tasks, use **Anthropic's built-in agent teams** (TeamCreate/SendMessage/TaskCreate) to coordinate parallel work across multiple agents. Prefer teams over sequential single-agent execution when tasks can be parallelized (e.g., frontend + backend work, research + implementation).

## Key Conventions

- App Router file conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`
- Server Components by default; add `"use client"` only when needed
- Tailwind CSS v4 syntax (uses `@theme inline` and `@import "tailwindcss"` instead of v3 config file)
- Dark mode via CSS `prefers-color-scheme` media query with CSS variables
