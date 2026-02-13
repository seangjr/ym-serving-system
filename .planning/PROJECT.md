# YM Serving System

## What This Is

A worship team scheduling and management app for a local church, replacing manual scheduling workflows (spreadsheets, Planning Center). Admins, team leads, and team members each have role-appropriate access to manage services, assignments, availability, songs, equipment, and files. Built to expand beyond the worship team to other serving ministries (Lights, Ushering, Sound, etc.) in the future.

## Core Value

Team leaders can schedule members to positions for upcoming services, and team members can see their assignments, confirm/decline, and manage their availability — replacing the current manual workflow entirely.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-role authentication (admin, team lead, team member) with Supabase Auth
- [ ] Services dashboard with calendar view and upcoming services list
- [ ] Service detail with team assignments by position category (vocals, instruments, production)
- [ ] Assignment status tracking (confirmed, pending, declined, unassigned)
- [ ] Setlist management with drag-and-drop reordering
- [ ] Conflict detection for double-booked team members
- [ ] Team roster management with member profiles, positions, and skill levels
- [ ] Member availability and blackout date management
- [ ] Song library with CCLI tracking, keys, tempo, themes, and arrangements
- [ ] Announcements system for team-wide communication
- [ ] Equipment inventory tracking (instruments, audio, video gear)
- [ ] File management for sheet music, chord charts, and documents
- [ ] Reports: participation stats and song usage analytics
- [ ] Service templates (save and reuse team configurations)
- [ ] Service duplication with new date
- [ ] Recurring service patterns (weekly, biweekly, monthly)
- [ ] In-app notification system (assignments, reminders, changes)
- [ ] Dark mode support
- [ ] Responsive/mobile-friendly layout
- [ ] Undo/redo for service editing actions

### Out of Scope

- Multi-tenant / multi-church support — single church only for v1
- Telegram/WhatsApp notifications — planned for future, design notification system to be provider-extensible
- SMS/Email notifications — future integration
- OAuth social login — email/password via Supabase Auth for v1
- Mobile native app — web-first, responsive design
- Live streaming integration — not part of scheduling
- Financial/donation management — out of domain

## Context

- **Figma Make prototype exists** with full UI for all 8 views: Dashboard, Service Detail, Team Roster, Song Library, Announcements, Equipment, Reports, Files. Source code available at Figma Make link `hBCDKPWmdMsqpRpZuPCCWL`.
- Prototype uses React + Tailwind CSS + shadcn/ui + date-fns + react-dnd. Data is mock/in-memory with Context API + undo/redo history pattern.
- Production app uses **Next.js 16 with App Router**, React 19, Tailwind CSS v4, Biome for linting/formatting, pnpm.
- Backend: **Supabase** (Postgres + Auth + RLS + Realtime).
- The data model must be **team/ministry-agnostic** from the start — positions and categories should be configurable so the system can expand to Lights, Ushering, Sound, and other serving teams without schema changes.
- The Figma prototype defines the following position categories: `vocals`, `instruments`, `production`, `other`. These should become a configurable `ministry` or `team` concept that allows adding new categories.

## Constraints

- **Tech stack**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Supabase, TypeScript
- **Styling**: Must match Figma Make prototype's design (shadcn/ui components, dark mode, responsive)
- **Auth**: Supabase Auth with email/password, RLS policies for role-based access
- **Package manager**: pnpm
- **Linting**: Biome (not ESLint/Prettier)
- **Single church**: No multi-tenant architecture needed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for backend | Built-in auth, RLS, real-time subscriptions, Postgres — good fit for role-based scheduling app | — Pending |
| Team/ministry-agnostic data model | Future expansion to Lights, Ushering, Sound teams without schema changes | — Pending |
| Multi-role from start (admin, team lead, member) | Different permission levels needed for real church workflow | — Pending |
| In-app notifications first, messaging later | Simpler v1, but notification system designed for provider extensibility (Telegram/WhatsApp) | — Pending |
| Figma Make as UI reference | Full prototype exists with all views designed — implement to match | — Pending |

---
*Last updated: 2026-02-13 after initialization*
