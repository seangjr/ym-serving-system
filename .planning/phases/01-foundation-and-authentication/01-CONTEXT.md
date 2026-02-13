# Phase 1: Foundation & Authentication - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Supabase auth setup, role-based access with RLS policies, and the app shell (sidebar navigation, dark mode, responsive layout). This is the skeleton that all other phases build on. No signup page — members exist in the attendance system's member table in the same Supabase project.

</domain>

<decisions>
## Implementation Decisions

### Auth Flow
- No public signup page — members are pre-existing in the attendance system's member database
- Same Supabase project as the attendance system — scheduling tables added alongside existing attendance tables, same schema
- Admin invites members via email — leverages the existing invitation method from the attendance system
- Login page only — email/password login, password reset via email link
- If authenticated in Supabase Auth, user can access the scheduling app
- Admin validates/invites users into the system — no self-registration

### Role Management
- Three roles: **Admin**, **Committee** (renamed from "team lead"), **Member**
- Committee is a global role — can manage any team, not scoped per-team
- First admin already exists in the attendance system — no bootstrapping needed
- Role assignment available in two places:
  - Quick role change dropdown on a member's profile page
  - Dedicated admin panel listing all users with bulk role management

### Mobile-First Design Philosophy
- **Mobile is the primary view** — most users will interact via phone
- Two distinct design targets: mobile view (designed first) and desktop view (enhanced second)
- Not just "responsive" — mobile layouts are intentionally designed, not shrunk-down desktop
- Touch targets, swipe gestures, and thumb-zone placement considered for all interactive elements
- Desktop view adds sidebar and multi-column layouts as progressive enhancement

### App Shell & Navigation
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

### Dark Mode & Theming
- Default theme follows system preference (OS light/dark setting)
- User can manually toggle, preference persists across sessions
- **Jack Dorsey design aesthetic:**
  - Clean, minimal, monochromatic with sharp typography
  - Lots of black/white contrast, generous whitespace, minimal decoration
  - Subtle blue accent for primary actions and interactive elements (buttons, active states, links)
  - Status colors retained for functional use (green=confirmed, amber=pending, red=declined)
- Typography: **Inter** (replacing Geist from the prototype)
- Overall feel: Square/Cash App meets church scheduling — professional, not playful

### Claude's Discretion
- Login page layout and visual design (within Dorsey aesthetic, mobile-first)
- Password reset flow implementation details
- RLS policy structure and naming
- Mobile breakpoints and touch interaction specifics
- Loading states and skeleton design
- Error page design (404, 500, unauthorized)

</decisions>

<specifics>
## Specific Ideas

- "Follow Jack Dorsey's design style and language" — reference Square, Cash App, X/Twitter redesign for visual direction
- Existing Supabase project has attendance system with member table and admin user — scheduling app joins this project
- Existing invitation method in attendance system should be leveraged for member onboarding
- Committee role name (not "team lead") — reflects church organizational language

</specifics>

<deferred>
## Deferred Ideas

- Supabase MCP connection — needs to be set up before Phase 1 execution (user to configure PAT)
- Specific My Schedule view design — detailed layout decisions belong in execution, core requirements captured here

</deferred>

---

*Phase: 01-foundation-and-authentication*
*Context gathered: 2026-02-13*
