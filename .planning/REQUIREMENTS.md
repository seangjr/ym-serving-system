# Requirements: YM Serving System

**Defined:** 2026-02-13
**Core Value:** Team leaders can schedule members to positions for upcoming services, and team members can see their assignments, confirm/decline, and manage their availability.

> **Language Convention:** All user-facing text uses **UK English** (e.g. "colour" not "color", "organisation" not "organization"). Code-internal names (DB columns, variables) may use US English where established by frameworks.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Authorization

- [ ] **AUTH-01**: Admin can invite members via email (no public signup — members pre-exist in attendance system)
- [ ] **AUTH-02**: User can log in and maintain session across browser refresh
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: User can reset password via email link
- [ ] **AUTH-05**: Admin can assign roles (admin, team lead, member) to users
- [ ] **AUTH-06**: RLS policies enforce role-based access — members see own data, team leads manage own team, admins access everything
- [ ] **AUTH-07**: Unauthenticated users are redirected to login page

### Teams & Positions

- [ ] **TEAM-01**: Admin can create and manage ministry teams (e.g., Worship, Lights, Ushering, Sound)
- [ ] **TEAM-02**: Admin can define positions within a team with categories (e.g., vocals, instruments, production)
- [ ] **TEAM-03**: Admin can assign team lead role to a member for a specific team
- [ ] **TEAM-04**: Team lead can add/remove members from their team
- [ ] **TEAM-05**: Team data model is ministry-agnostic — new teams can be created without schema changes
- [ ] **TEAM-06**: Positions support skill proficiency levels (beginner, intermediate, advanced, expert)

### People & Profiles

- [ ] **PROF-01**: Admin/team lead can add team members with name, email, phone, and positions
- [ ] **PROF-02**: Member can view and edit their own profile (name, email, phone, avatar)
- [ ] **PROF-03**: Member profile shows emergency contact, birthdate, and join date
- [ ] **PROF-04**: Member can set notification preferences (email, assignment changes, reminder days)
- [ ] **PROF-05**: Member can set position preferences (primary, secondary, willing)
- [ ] **PROF-06**: User can view other team members' profiles (name, positions, contact info)
- [ ] **PROF-07**: Team roster is searchable by name or email

### Services & Calendar

- [ ] **SERV-01**: Admin/team lead can create a service with title, date, time, type, and duration
- [ ] **SERV-02**: Dashboard shows calendar month view with services colour-coded by type
- [ ] **SERV-03**: Dashboard shows upcoming services list with assignment stats and song counts
- [ ] **SERV-04**: Dashboard shows stats cards — upcoming services, unassigned positions, pending confirmations
- [ ] **SERV-05**: Admin can create recurring services (weekly, biweekly, monthly patterns)
- [ ] **SERV-06**: Service supports rehearsal date, rehearsal notes, and estimated end time
- [ ] **SERV-07**: Admin can duplicate a service to a new date (copies assignments and setlist)
- [ ] **SERV-08**: Service types are configurable (sunday-morning, sunday-evening, wednesday, special-event)
- [ ] **SERV-09**: User can navigate between months on the calendar

### Scheduling & Assignments

- [ ] **ASGN-01**: Team lead/admin can assign members to positions on a service
- [ ] **ASGN-02**: Assignment status tracks confirmed, pending, declined, and unassigned states
- [ ] **ASGN-03**: Assignments are grouped by position category (vocals, instruments, production) with collapsible sections
- [ ] **ASGN-04**: Team lead/admin can add notes per assignment (e.g., "arrive 30 min early")
- [ ] **ASGN-05**: System detects scheduling conflicts when a member is assigned to overlapping services on the same day
- [ ] **ASGN-06**: Conflict warnings display prominently on service detail
- [ ] **ASGN-07**: Team lead/admin can add or remove positions from a specific service
- [ ] **ASGN-08**: Admin can save a team configuration as a reusable template
- [ ] **ASGN-09**: Admin can load a saved template when setting up a service
- [ ] **ASGN-10**: Only members with matching position skills appear in the assignment dropdown

### Accept/Decline & Swaps

- [ ] **RESP-01**: Member can confirm or decline an assignment from their schedule view
- [ ] **RESP-02**: Declining an assignment triggers a notification to the team lead
- [ ] **RESP-03**: Member can request a swap — system notifies eligible members for the same position
- [ ] **RESP-04**: Team lead can approve or reject swap requests
- [ ] **RESP-05**: Confirmation/decline can be done in 1-2 taps on mobile

### Availability

- [ ] **AVAIL-01**: Member can mark specific dates as unavailable (blackout dates)
- [ ] **AVAIL-02**: Member can set recurring unavailability (e.g., every other Wednesday)
- [ ] **AVAIL-03**: Unavailable dates surface as warnings during scheduling
- [ ] **AVAIL-04**: Availability calendar shows a visual overview of member availability

### Setlist & Songs

- [x] **SONG-01**: Admin/team lead can add songs to a library with title, artist, key, and tempo
- [x] **SONG-02**: Songs support tags, themes, and duration metadata
- [x] **SONG-03**: Team lead can build a setlist for a service by selecting songs from the library
- [ ] **SONG-04**: Setlist supports drag-and-drop reordering
- [x] **SONG-05**: Song key and tempo can be overridden per service (without changing the library entry)
- [x] **SONG-06**: Song library is searchable and filterable
- [x] **SONG-07**: Dashboard shows song count per service

### Announcements

- [ ] **ANN-01**: Admin/team lead can create announcements with title, message, and priority (low, medium, high)
- [ ] **ANN-02**: Announcements can target all team members or specific members
- [ ] **ANN-03**: Announcements can have an expiration date
- [ ] **ANN-04**: Members see announcements in a dedicated view

### Equipment

- [ ] **EQUIP-01**: Admin can manage an equipment inventory (name, category, condition, serial number, location)
- [ ] **EQUIP-02**: Equipment can be assigned to a team member
- [ ] **EQUIP-03**: Equipment tracks purchase date and last maintenance date
- [ ] **EQUIP-04**: Service detail supports listing equipment needs per service

### Files

- [ ] **FILE-01**: User can upload files (sheet music, chord charts, documents) to the file manager
- [ ] **FILE-02**: Files can be categorized (sheet-music, chord-chart, audio, document)
- [ ] **FILE-03**: Files can be linked to a song, service, or member
- [ ] **FILE-04**: File list shows name, type, size, upload date, and uploader

### Reports

- [ ] **REPT-01**: Admin/team lead can view participation stats per member (total services, confirmed, declined)
- [ ] **REPT-02**: Admin/team lead can view song usage stats (times played, last played, frequency)
- [ ] **REPT-03**: Reports display serving frequency to identify burnout risk

### Notifications

- [ ] **NOTF-01**: System sends in-app notifications for new assignments, schedule changes, and reminders
- [ ] **NOTF-02**: Notifications show read/unread state
- [ ] **NOTF-03**: Notification system is provider-extensible for future Telegram/WhatsApp integration
- [ ] **NOTF-04**: Member receives notification when assigned to a service
- [ ] **NOTF-05**: Member receives reminder notification before service date (configurable days)

### UX & Design

- [ ] **UX-01**: App matches Figma Make prototype design (shadcn/ui, Tailwind CSS v4)
- [ ] **UX-02**: Dark mode toggleable from sidebar, persists across sessions
- [ ] **UX-03**: Fully responsive — works on mobile, tablet, and desktop
- [ ] **UX-04**: Sidebar navigation with all 8 sections (Services, Team Roster, Songs, Announcements, Equipment, Reports, Files)
- [ ] **UX-05**: Undo/redo for service editing actions (Cmd+Z / Cmd+Shift+Z)
- [ ] **UX-06**: Dashboard surfaces "what needs attention" — unassigned positions, pending responses, upcoming rehearsals
- [ ] **UX-07**: Scheduling workflow minimizes clicks — quick assign, templates, bulk actions
- [ ] **UX-08**: Mobile-first confirm/decline — 1-2 taps to respond to assignment
- [ ] **UX-09**: Service detail messaging thread for per-service communication

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Scheduling

- **SCHED-01**: Auto-scheduling algorithm suggests assignments based on availability, frequency, and preferences
- **SCHED-02**: Burnout prevention — system flags over-scheduled members automatically

### Song Enhancements

- **SONG-V2-01**: CCLI SongSelect integration for importing songs and auto-reporting usage
- **SONG-V2-02**: Chord transposition — display charts in any key
- **SONG-V2-03**: Song arrangements with linked files and per-arrangement metadata
- **SONG-V2-04**: Song resources (audio, video, sheet music links)

### Communication

- **COMM-01**: Telegram/WhatsApp notification provider integration
- **COMM-02**: Email notifications for assignments and reminders (via Resend or similar)
- **COMM-03**: SMS notifications for urgent changes

### Advanced Features

- **ADV-01**: Services LIVE — real-time service flow advancement visible to whole team
- **ADV-02**: Calendar 2-way sync (Google/Apple/Outlook)
- **ADV-03**: iCal export for personal calendar subscription
- **ADV-04**: Background check tracking per volunteer

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-tenant / multi-church support | Single church only for v1 — simpler data model, faster to ship |
| Native mobile apps (iOS/Android) | Responsive web / PWA covers 90% of mobile use cases; native apps premature |
| Full ChMS (donations, attendance, groups, check-in) | Scope explosion — stay focused on scheduling, integrate with existing ChMS |
| Built-in presentation software (lyrics display) | Entirely separate product category — integrate with ProPresenter/EasyWorship |
| Real-time chat / messaging platform | Commodity — users have WhatsApp/Slack/GroupMe. Simple notifications sufficient |
| Donation / tithing management | Different compliance/reporting domain — integrate with Tithely/Pushpay |
| Complex BI/analytics dashboards | Start with 3-5 focused reports, add based on user requests |
| Rehearsal practice tools (audio looping, metronome) | High complexity — consider integrating with MultiTracks/RehearsalMix instead |
| Multi-campus / multi-site | Design schema to not preclude it, but build for single campus |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| UX-01 | Phase 1 | Pending |
| UX-02 | Phase 1 | Pending |
| UX-03 | Phase 1 | Pending |
| UX-04 | Phase 1 | Pending |
| TEAM-01 | Phase 2 | Pending |
| TEAM-02 | Phase 2 | Pending |
| TEAM-03 | Phase 2 | Pending |
| TEAM-04 | Phase 2 | Pending |
| TEAM-05 | Phase 2 | Pending |
| TEAM-06 | Phase 2 | Pending |
| PROF-01 | Phase 2 | Pending |
| PROF-02 | Phase 2 | Pending |
| PROF-03 | Phase 2 | Pending |
| PROF-04 | Phase 2 | Pending |
| PROF-05 | Phase 2 | Pending |
| PROF-06 | Phase 2 | Pending |
| PROF-07 | Phase 2 | Pending |
| SERV-01 | Phase 3 | Pending |
| SERV-02 | Phase 3 | Pending |
| SERV-03 | Phase 3 | Pending |
| SERV-04 | Phase 3 | Pending |
| SERV-05 | Phase 3 | Pending |
| SERV-06 | Phase 3 | Pending |
| SERV-07 | Phase 3 | Pending |
| SERV-08 | Phase 3 | Pending |
| SERV-09 | Phase 3 | Pending |
| ASGN-01 | Phase 4 | Pending |
| ASGN-02 | Phase 4 | Pending |
| ASGN-03 | Phase 4 | Pending |
| ASGN-04 | Phase 4 | Pending |
| ASGN-05 | Phase 4 | Pending |
| ASGN-06 | Phase 4 | Pending |
| ASGN-07 | Phase 4 | Pending |
| ASGN-08 | Phase 4 | Pending |
| ASGN-09 | Phase 4 | Pending |
| ASGN-10 | Phase 4 | Pending |
| AVAIL-01 | Phase 5 | Pending |
| AVAIL-02 | Phase 5 | Pending |
| AVAIL-03 | Phase 5 | Pending |
| AVAIL-04 | Phase 5 | Pending |
| RESP-01 | Phase 6 | Pending |
| RESP-02 | Phase 6 | Pending |
| RESP-03 | Phase 6 | Pending |
| RESP-04 | Phase 6 | Pending |
| RESP-05 | Phase 6 | Pending |
| NOTF-01 | Phase 6 | Pending |
| NOTF-02 | Phase 6 | Pending |
| NOTF-03 | Phase 6 | Pending |
| NOTF-04 | Phase 6 | Pending |
| NOTF-05 | Phase 6 | Pending |
| SONG-01 | Phase 7 | Complete |
| SONG-02 | Phase 7 | Complete |
| SONG-03 | Phase 7 | Complete |
| SONG-04 | Phase 7 | Pending |
| SONG-05 | Phase 7 | Complete |
| SONG-06 | Phase 7 | Complete |
| SONG-07 | Phase 7 | Complete |
| ANN-01 | Phase 8 | Pending |
| ANN-02 | Phase 8 | Pending |
| ANN-03 | Phase 8 | Pending |
| ANN-04 | Phase 8 | Pending |
| UX-09 | Phase 8 | Pending |
| EQUIP-01 | Phase 9 | Pending |
| EQUIP-02 | Phase 9 | Pending |
| EQUIP-03 | Phase 9 | Pending |
| EQUIP-04 | Phase 9 | Pending |
| FILE-01 | Phase 9 | Pending |
| FILE-02 | Phase 9 | Pending |
| FILE-03 | Phase 9 | Pending |
| FILE-04 | Phase 9 | Pending |
| REPT-01 | Phase 10 | Pending |
| REPT-02 | Phase 10 | Pending |
| REPT-03 | Phase 10 | Pending |
| UX-05 | Phase 10 | Pending |
| UX-06 | Phase 10 | Pending |
| UX-07 | Phase 10 | Pending |
| UX-08 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 84 total
- Mapped to phases: 84
- Unmapped: 0

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after roadmap creation*
