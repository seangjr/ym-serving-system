# Roadmap: YM Serving System

## Overview

This roadmap delivers a worship team scheduling and management app that replaces manual workflows (spreadsheets, Planning Center) for a local church. The journey progresses from authentication and data foundations through team management, service scheduling, assignment workflows, and supporting features (songs, announcements, equipment, files), culminating in reports and UX polish. Each phase delivers a complete, verifiable capability that builds on the previous, with the core value -- team leaders scheduling members and members confirming assignments -- realized by the end of Phase 6.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Authentication** - Supabase auth, role-based access, app shell with sidebar navigation and dark mode
- [x] **Phase 2: Teams & Member Profiles** - Ministry-agnostic team/position structure and member profile management
- [ ] **Phase 3: Services & Calendar** - Service creation, calendar views, recurring patterns, and service templates
- [ ] **Phase 4: Scheduling & Assignments** - Assigning members to positions with conflict detection and templates
- [ ] **Phase 5: Availability Management** - Member blackout dates, recurring unavailability, and scheduling warnings
- [ ] **Phase 6: Accept/Decline & Notifications** - Assignment response workflow, swap requests, and in-app notification system
- [ ] **Phase 7: Song Library & Setlists** - Song management, setlist building with drag-and-drop, per-service overrides
- [ ] **Phase 8: Announcements & Service Communication** - Team announcements and per-service messaging threads
- [ ] **Phase 9: Equipment & Files** - Equipment inventory tracking and file management for sheet music and documents
- [ ] **Phase 10: Reports & UX Polish** - Participation/song analytics, undo/redo, mobile polish, and dashboard attention indicators

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Users can securely access the app with role-appropriate permissions, and the application shell is ready for feature development
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. Admin can invite members via email, user can log in, and stay logged in across browser refresh
  2. User can log out from any page and is redirected to login when unauthenticated
  3. User can reset a forgotten password via email link
  4. Admin can assign roles (admin, committee, member) to users, and RLS policies restrict data access by role
  5. App shell displays sidebar navigation with all 8 sections, supports toggleable dark mode that persists across sessions, and is responsive across mobile/tablet/desktop
**Plans**: 5 plans

Plans:
- [ ] 01-01-PLAN.md -- Supabase client infrastructure, middleware, and auth route handlers
- [ ] 01-02-PLAN.md -- Auth flow UI (login, password reset, update password) with server actions
- [ ] 01-03-PLAN.md -- Role management SQL migration, RLS policies, and TypeScript role helpers
- [ ] 01-04-PLAN.md -- App shell (Inter font, ThemeProvider, role-filtered sidebar, dark mode, responsive layout)
- [ ] 01-05-PLAN.md -- Admin panel for user role management (AUTH-05)

### Phase 2: Teams & Member Profiles
**Goal**: Admins and team leads can organize ministry teams with positions, and members can manage their own profiles
**Depends on**: Phase 1
**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05, TEAM-06, PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07
**Success Criteria** (what must be TRUE):
  1. Admin can create ministry teams (Worship, Lights, Sound, etc.) and define positions within them -- new teams can be added without any code or schema changes
  2. Admin can assign team lead role to a member for a specific team, and team leads can add/remove members from their team
  3. Team roster page shows all members with searchable list, and each member displays their positions with skill proficiency levels
  4. Member can view and edit their own profile (name, email, phone, avatar, emergency contact, birthdate, notification preferences, position preferences)
  5. User can view other team members' profiles with name, positions, and contact info
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md -- Database schema (5 tables + storage bucket), server actions, and query functions for teams and profiles
- [ ] 02-02-PLAN.md -- Team management UI (teams listing, team detail, positions, member assignment)
- [ ] 02-03-PLAN.md -- Member profile page (personal info, avatar upload, notification preferences, position display)
- [ ] 02-04-PLAN.md -- Team roster page with search and member profile view page

### Phase 3: Services & Calendar
**Goal**: Team leads and admins can create and manage services with a calendar view, including recurring patterns and service duplication
**Depends on**: Phase 1
**Requirements**: SERV-01, SERV-02, SERV-03, SERV-04, SERV-05, SERV-06, SERV-07, SERV-08, SERV-09
**Success Criteria** (what must be TRUE):
  1. Admin/team lead can create a service with title, date, time, type, duration, rehearsal date, and notes
  2. Dashboard shows a calendar month view with services color-coded by type, and user can navigate between months
  3. Dashboard shows upcoming services list with assignment stats and song counts, plus stats cards for upcoming services, unassigned positions, and pending confirmations
  4. Admin can create recurring service patterns (weekly, biweekly, monthly) and configure service types (sunday-morning, sunday-evening, wednesday, special-event)
  5. Admin can duplicate an existing service to a new date, copying its configuration
**Plans**: TBD

Plans:
- [ ] 03-01: Service and service type database schema with recurring pattern support
- [ ] 03-02: Service CRUD operations and Server Actions
- [ ] 03-03: Calendar month view with navigation and color-coded services
- [ ] 03-04: Dashboard layout (upcoming services list, stats cards)
- [ ] 03-05: Recurring services, service duplication, and service type configuration

### Phase 4: Scheduling & Assignments
**Goal**: Team leads and admins can assign members to positions on services, with conflict detection and reusable templates
**Depends on**: Phase 2, Phase 3
**Requirements**: ASGN-01, ASGN-02, ASGN-03, ASGN-04, ASGN-05, ASGN-06, ASGN-07, ASGN-08, ASGN-09, ASGN-10
**Success Criteria** (what must be TRUE):
  1. Team lead/admin can assign members to positions on a service, and only members with matching position skills appear in the assignment dropdown
  2. Assignment status is tracked as confirmed, pending, declined, or unassigned, and displayed per position
  3. Assignments are grouped by position category (vocals, instruments, production) with collapsible sections, and positions can be added/removed from a service
  4. System detects and prominently warns when a member is assigned to overlapping services on the same day
  5. Admin can save a team configuration as a reusable template and load it when setting up a new service
**Plans**: TBD

Plans:
- [ ] 04-01: Assignments database schema with state machine and RLS policies
- [ ] 04-02: Service detail view with assignment UI grouped by position category
- [ ] 04-03: Assignment logic (smart dropdown, notes, add/remove positions)
- [ ] 04-04: Conflict detection and warning display
- [ ] 04-05: Service templates (save and load team configurations)

### Phase 5: Availability Management
**Goal**: Members can manage their availability, and the scheduling system surfaces conflicts when assigning unavailable members
**Depends on**: Phase 4
**Requirements**: AVAIL-01, AVAIL-02, AVAIL-03, AVAIL-04
**Success Criteria** (what must be TRUE):
  1. Member can mark specific dates as unavailable (blackout dates) from their profile
  2. Member can set recurring unavailability patterns (e.g., every other Wednesday)
  3. When scheduling, unavailable dates surface as warnings and the system flags the conflict before confirming the assignment
  4. Availability calendar shows a visual overview of a member's availability for team leads to reference
**Plans**: TBD

Plans:
- [ ] 05-01: Availability database schema (one-time and recurring patterns) with RLS
- [ ] 05-02: Availability management UI (blackout dates, recurring patterns, calendar view)
- [ ] 05-03: Integration with scheduling -- availability warnings during assignment

### Phase 6: Accept/Decline & Notifications
**Goal**: Members can respond to assignments and request swaps, and the system delivers in-app notifications for assignments, reminders, and changes
**Depends on**: Phase 4
**Requirements**: RESP-01, RESP-02, RESP-03, RESP-04, RESP-05, NOTF-01, NOTF-02, NOTF-03, NOTF-04, NOTF-05
**Success Criteria** (what must be TRUE):
  1. Member can confirm or decline an assignment from their schedule view, and declining triggers a notification to the team lead
  2. Member can request a swap -- system notifies eligible members for the same position, and team lead can approve or reject swap requests
  3. Confirm/decline can be done in 1-2 taps on mobile
  4. System sends in-app notifications for new assignments, schedule changes, and configurable reminders before service date
  5. Notifications show read/unread state, and the notification system is architected to be provider-extensible for future Telegram/WhatsApp integration
**Plans**: TBD

Plans:
- [ ] 06-01: Notification system database schema and provider-extensible architecture
- [ ] 06-02: Accept/decline assignment workflow UI and Server Actions
- [ ] 06-03: Swap request workflow (request, notify eligible, approve/reject)
- [ ] 06-04: In-app notification UI (bell icon, notification list, read/unread)
- [ ] 06-05: Reminder system (configurable days before service)

### Phase 7: Song Library & Setlists
**Goal**: Team leads can manage a song library and build service setlists with drag-and-drop ordering
**Depends on**: Phase 3
**Requirements**: SONG-01, SONG-02, SONG-03, SONG-04, SONG-05, SONG-06, SONG-07
**Success Criteria** (what must be TRUE):
  1. Admin/team lead can add songs to the library with title, artist, key, tempo, tags, themes, and duration
  2. Song library is searchable by title/artist and filterable by key, tempo, or tags
  3. Team lead can build a setlist for a service by selecting songs from the library, with drag-and-drop reordering
  4. Song key and tempo can be overridden per service without changing the library entry
  5. Dashboard shows song count per service in the upcoming services list
**Plans**: TBD

Plans:
- [ ] 07-01: Songs database schema with full-text search and RLS
- [ ] 07-02: Song library UI (CRUD, search, filtering)
- [ ] 07-03: Setlist builder (service item linking, drag-and-drop, per-service overrides)

### Phase 8: Announcements & Service Communication
**Goal**: Team leads can broadcast announcements and teams can communicate within service contexts
**Depends on**: Phase 1
**Requirements**: ANN-01, ANN-02, ANN-03, ANN-04, UX-09
**Success Criteria** (what must be TRUE):
  1. Admin/team lead can create announcements with title, message, and priority level (low, medium, high)
  2. Announcements can target all team members or specific members, and can have an expiration date
  3. Members see announcements in a dedicated view, ordered by priority and date
  4. Service detail page includes a messaging thread for per-service team communication
**Plans**: TBD

Plans:
- [ ] 08-01: Announcements database schema, RLS, and CRUD operations
- [ ] 08-02: Announcements UI (create, target, view, expire)
- [ ] 08-03: Service messaging thread (per-service communication)

### Phase 9: Equipment & Files
**Goal**: Admins can track equipment inventory and users can manage files (sheet music, chord charts, documents) linked to songs, services, or members
**Depends on**: Phase 1
**Requirements**: EQUIP-01, EQUIP-02, EQUIP-03, EQUIP-04, FILE-01, FILE-02, FILE-03, FILE-04
**Success Criteria** (what must be TRUE):
  1. Admin can manage equipment inventory with name, category, condition, serial number, location, purchase date, and last maintenance date
  2. Equipment can be assigned to a team member, and service detail can list equipment needs
  3. User can upload files (sheet music, chord charts, documents) categorized by type, and files display name, type, size, upload date, and uploader
  4. Files can be linked to a song, service, or member for contextual access
**Plans**: TBD

Plans:
- [ ] 09-01: Equipment database schema, RLS, and inventory management UI
- [ ] 09-02: File storage setup (Supabase Storage), database schema, and upload UI
- [ ] 09-03: File linking (song/service/member associations) and file browser UI

### Phase 10: Reports & UX Polish
**Goal**: Leaders can view participation and song analytics, and the overall UX is polished with undo/redo, mobile optimization, and attention-focused dashboard
**Depends on**: Phase 4, Phase 7
**Requirements**: REPT-01, REPT-02, REPT-03, UX-05, UX-06, UX-07, UX-08
**Success Criteria** (what must be TRUE):
  1. Admin/team lead can view participation stats per member (total services, confirmed, declined) and serving frequency to identify burnout risk
  2. Admin/team lead can view song usage stats (times played, last played, frequency)
  3. Dashboard surfaces "what needs attention" -- unassigned positions, pending responses, upcoming rehearsals
  4. Undo/redo works for service editing actions via Cmd+Z / Cmd+Shift+Z
  5. Mobile confirm/decline is optimized to 1-2 taps, and scheduling workflow minimizes clicks with quick assign, templates, and bulk actions
**Plans**: TBD

Plans:
- [ ] 10-01: Participation reports (per-member stats, serving frequency, burnout indicators)
- [ ] 10-02: Song usage reports (times played, last played, frequency trends)
- [ ] 10-03: Dashboard attention indicators (unassigned, pending, rehearsals)
- [ ] 10-04: Undo/redo system for service editing
- [ ] 10-05: Mobile UX polish and scheduling workflow optimization

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10
Note: Phases 3, 7, 8, 9 depend only on Phase 1 and can be parallelized after Phase 2 completes if needed.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 5/5 | ✓ Complete | 2026-02-13 |
| 2. Teams & Member Profiles | 4/4 | ✓ Complete | 2026-02-13 |
| 3. Services & Calendar | 0/5 | Not started | - |
| 4. Scheduling & Assignments | 0/5 | Not started | - |
| 5. Availability Management | 0/3 | Not started | - |
| 6. Accept/Decline & Notifications | 0/5 | Not started | - |
| 7. Song Library & Setlists | 0/3 | Not started | - |
| 8. Announcements & Service Communication | 0/3 | Not started | - |
| 9. Equipment & Files | 0/3 | Not started | - |
| 10. Reports & UX Polish | 0/5 | Not started | - |
