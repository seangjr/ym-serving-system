# Feature Research

**Domain:** Church worship team scheduling and serving management
**Researched:** 2026-02-13
**Confidence:** HIGH (based on analysis of Planning Center, Elvanto, ChurchTeams, Breeze, and broader ecosystem)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete. Every competitor has these.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Service/event calendar | Core organizing primitive; teams need to see what's coming | MEDIUM | Recurring events, multiple service times, service types (e.g., Traditional, Contemporary, Youth). Calendar subscription export (iCal/Google) expected. |
| Team & position management | Churches organize volunteers into teams (Worship, AV, Ushers) with specific positions (Lead Vocals, Bass, Camera 1) | MEDIUM | Must support multiple teams, custom positions within teams, team leaders with elevated permissions. |
| Volunteer scheduling & assignment | The entire point of the product. Assign people to positions on specific dates. | HIGH | Matrix view (dates x positions), drag-and-drop, scheduling weeks/months out. This is the hardest table-stakes feature. |
| Availability & blockout dates | Volunteers need to mark when they can't serve; schedulers need to see this | LOW | Self-service blockout date entry. Must surface conflicts during scheduling. |
| Schedule notifications & reminders | Volunteers forget. Automated reminders are standard. | MEDIUM | Email and/or push notifications for new assignments, upcoming service reminders, confirmation requests. |
| Accept/decline workflow | Volunteers must confirm or decline assignments. Schedulers need to track response status. | MEDIUM | Pending/accepted/declined states. Follow-up for non-responders. Decline triggers need-to-fill alerts. |
| Song library | Worship teams need a searchable database of songs with metadata | MEDIUM | Title, artist, key, tempo, tags, lyrics. Multiple arrangements per song. |
| Service order/flow builder | Plan the sequence of a service (songs, prayers, announcements, media) with timestamps | MEDIUM | Drag-and-drop ordering, time estimates per item, notes per item. Templates for recurring formats. |
| Mobile access | Volunteers check schedules on phones. Non-negotiable. | HIGH | Responsive web at minimum. Native app ideal but PWA acceptable for v1. Must support viewing schedule, responding to requests, accessing song materials. |
| User roles & permissions | Admins, team leads, and members need different access levels | MEDIUM | At minimum: admin (full access), team lead (manage own team), member (view own schedule, respond). RLS in Supabase maps well here. |
| People directory / profiles | Basic contact info, team membership, serving history per person | LOW | Name, email, phone, photo, teams, roles. Profile page showing upcoming and past assignments. |
| Email/messaging to teams | Team leads and admins need to communicate with their teams | MEDIUM | Send to entire team, specific positions, or individuals. At minimum email; in-app messaging is a plus. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required by users, but create meaningful value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Smart auto-scheduling | Automatically fill schedule based on availability, last-served date, preferences, and workload balancing | HIGH | Planning Center and Elvanto both have this. Huge time saver for schedulers. Prevents burnout by distributing load fairly. Key algorithm: round-robin with constraint satisfaction. |
| CCLI SongSelect integration | Import songs, lyrics, chord charts directly from CCLI database; auto-report song usage for licensing compliance | MEDIUM | Planning Center has deep CCLI integration with auto-reporting. Churches with CCLI licenses (most mid-to-large churches) expect this. Requires CCLI API partnership. |
| Chord transposition | Display chord charts in any key; capo chart generation | MEDIUM | Elvanto and Planning Center both do this. Musicians strongly value being able to transpose on the fly rather than maintaining separate charts per key. |
| Real-time service flow (Services LIVE) | During a live service, advance through items in real-time so the whole team sees where you are | MEDIUM | Planning Center's "Services LIVE" feature. Valuable for large teams. Could be a strong differentiator if done with modern real-time tech (Supabase Realtime). |
| Substitution / swap requests | Allow volunteers to find their own replacements when they can't serve | MEDIUM | Reduces admin burden significantly. Volunteer requests swap, eligible members are notified, team lead approves. ChurchTeams and Planning Center both support this. |
| File attachments per service item | Attach chord charts, sheet music, lyric slides, stage plots, cue sheets to each item in the service plan | MEDIUM | Planning Center tracks file access, downloads, and license usage. Essential for music ministry teams. |
| Rehearsal / practice tools | Audio player with looping, metronome, isolated instrument parts | HIGH | Planning Center's Music Stand app. Deep feature. Could be a strong differentiator but very complex to build from scratch. Consider integrating with existing services (MultiTracks, RehearsalMix) instead. |
| Serving frequency insights & burnout prevention | Dashboard showing how often each person serves, flagging over- or under-scheduled volunteers | MEDIUM | Data-driven scheduling decisions. ChurchTeams tracks involvement to prevent burnout. Surprisingly few products surface this data well. |
| Multi-campus / multi-site support | Manage multiple church locations with shared or separate teams, songs, and schedules | HIGH | Planning Center supports this. Important for growth but not needed at launch. Adds significant data model complexity. |
| Equipment / resource tracking | Track what gear is needed per service (projectors, mics, instruments) and who is responsible | LOW | Surprisingly, Planning Center does NOT have dedicated equipment tracking. This is an opportunity gap. Simple checklist per service plan would add value. |
| Announcements system | Post announcements visible to teams or the whole church, with scheduling | LOW | Planning Center added this via Church Center. Simple to build, adds communication value. |
| Background check tracking | Track volunteer background check status and expiration for child safety compliance | LOW | ChurchTeams integrates with Protect My Ministry. Important for children's ministry teams. Store status + expiration date per volunteer, surface alerts. |
| Calendar integration (2-way sync) | Sync serving schedule to personal Google/Apple/Outlook calendar | LOW | Most products offer iCal export. 2-way sync (reading personal calendar to detect conflicts) is rare and would be a genuine differentiator. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately do NOT build these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full ChMS (church management system) | "We want one tool for everything" | Massive scope expansion (donations, attendance, groups, check-in, pastoral care). Breeze, Elvanto, and ChurchTeams are all-in-one and mediocre at each. Planning Center won by being best-in-class at services. | Stay focused on scheduling/serving. Integrate with existing ChMS via API. Build the best scheduling tool, not a mediocre everything tool. |
| Built-in live presentation / lyrics display | "ProPresenter/EasyWorship is expensive" | Presentation software is an entirely separate product category with complex requirements (multi-output, NDI, stage display, media playback). Building even a basic version is a years-long effort. | Integrate with ProPresenter, EasyWorship, OpenLP via export formats. Provide lyric data they can import. |
| Real-time chat / messaging platform | "We want Slack for our church" | Chat is a commodity. Building a good chat product is enormously complex (presence, typing indicators, read receipts, threading, moderation). Users already have WhatsApp/Slack/GroupMe. | Simple in-app notifications + email. Link to existing chat platforms. Planning Center only recently added basic chat and it's minimal. |
| Donation / tithing management | "Handle our finances too" | Financial software has compliance, reporting, tax receipt, and security requirements that are completely different from scheduling. | Integrate with Tithely, Pushpay, or Stripe. Offer a link, not a feature. |
| Complex reporting / analytics dashboards | "We need deep insights on everything" | Over-engineering reports before you have users. Most churches need 3-5 simple reports, not a BI tool. | Start with: songs played this month, volunteer frequency, schedule fill rate. Add reports based on actual user requests. |
| Native mobile apps (iOS + Android) from day 1 | "We need apps in the store" | Doubles development effort. PWA covers 90% of mobile use cases for this product type. Native apps become important at scale but are premature for launch. | Ship as responsive web / PWA first. Add native apps when you have 50+ churches and clear mobile-specific needs (e.g., offline chord charts, Bluetooth pedal support). |
| Drag-and-drop visual schedule builder | "Make it like a Gantt chart" | Over-engineering the UI for a problem that a simple table/matrix solves. Drag-and-drop is complex to implement well and often slower than clicking. | Matrix view (dates as columns, positions as rows) with click-to-assign. Planning Center's matrix view is simple and effective. |

## Feature Dependencies

```
[User Auth & Roles]
    +--requires--> [People Directory / Profiles]
    |                  +--requires--> [Team & Position Management]
    |                                     +--requires--> [Service Calendar]
    |                                     |                  +--requires--> [Volunteer Scheduling]
    |                                     |                                     +--enhances--> [Accept/Decline Workflow]
    |                                     |                                     +--enhances--> [Notifications & Reminders]
    |                                     |                                     +--enhances--> [Auto-Scheduling]
    |                                     |                                     +--enhances--> [Substitution Requests]
    |                                     |                                     +--enhances--> [Blockout Dates]
    |                                     |                                     +--enhances--> [Serving Frequency Insights]
    |                                     +--enhances--> [Team Messaging]
    |
    +--parallel--> [Song Library]
                       +--enhances--> [CCLI Integration]
                       +--enhances--> [Chord Transposition]
                       +--requires--> [Service Order Builder] (songs placed in service flow)
                       |                  +--enhances--> [File Attachments]
                       |                  +--enhances--> [Services LIVE]
                       |                  +--enhances--> [Equipment Tracking]
                       +--enhances--> [Rehearsal Tools]

[Announcements] -- independent, can be built anytime
[Background Check Tracking] -- independent, enhances [People Directory]
[Multi-Campus] -- requires all core features first
```

### Dependency Notes

- **Volunteer Scheduling requires Service Calendar + Team Management:** You can't schedule people to positions on dates without all three concepts existing.
- **Song Library is parallel to scheduling:** These are two independent feature tracks that converge at the Service Order Builder.
- **Auto-Scheduling enhances Volunteer Scheduling:** Must have manual scheduling working before automating it. Needs blockout dates and serving history data.
- **CCLI Integration enhances Song Library:** Song library must exist first; CCLI import adds to it.
- **Services LIVE requires Service Order Builder:** Real-time advancement only makes sense if you have a service flow to advance through.
- **Multi-Campus requires everything:** This is a data model concern that touches every entity. Build for single-campus first, design schema to not preclude multi-campus.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate with a single church.

- [x] User auth with role-based access (admin, team lead, member) -- foundation for everything
- [x] People directory with profiles -- who are our volunteers
- [x] Team and position management -- organize people into serving teams
- [x] Service calendar with recurring events -- what are we scheduling for
- [x] Volunteer scheduling (manual assignment) -- the core value proposition
- [x] Availability / blockout dates -- volunteers mark when they can't serve
- [x] Accept/decline workflow with notifications -- close the scheduling loop
- [x] Email reminders -- prevent no-shows
- [x] Song library (basic: title, artist, key, lyrics) -- worship teams need this immediately
- [x] Service order builder (basic) -- sequence songs and items for a service
- [x] Mobile-responsive web UI -- volunteers check schedules on phones

### Add After Validation (v1.x)

Features to add once core scheduling is working and at least one church is using it.

- [ ] Auto-scheduling algorithm -- add when manual scheduling pain is validated
- [ ] Substitution / swap requests -- add when "I can't make it" flow is a clear pain point
- [ ] CCLI SongSelect integration -- add when song library is actively used
- [ ] Chord transposition -- add alongside CCLI integration
- [ ] File attachments per service item -- add when teams ask for chord chart sharing
- [ ] Serving frequency insights / burnout dashboard -- add when enough scheduling data exists
- [ ] Team messaging (in-app) -- add when email-only communication is insufficient
- [ ] Announcements -- add when churches request broadcast communication
- [ ] Equipment tracking per service -- add as a simple checklist feature

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Services LIVE (real-time service flow) -- complex real-time feature, defer until core is rock solid
- [ ] Rehearsal tools (audio player, metronome, looping) -- consider integrating with existing services instead of building
- [ ] Multi-campus support -- defer until multiple churches are onboarded and at least one has multiple sites
- [ ] Background check tracking -- defer until children's ministry teams are a target segment
- [ ] Native mobile apps -- defer until PWA limitations are clear blockers
- [ ] Calendar 2-way sync -- defer until iCal export is insufficient
- [ ] API for third-party integrations -- defer until integration requests are common

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User auth & roles (Supabase RLS) | HIGH | MEDIUM | P1 |
| People directory / profiles | HIGH | LOW | P1 |
| Team & position management | HIGH | MEDIUM | P1 |
| Service calendar (recurring) | HIGH | MEDIUM | P1 |
| Volunteer scheduling (manual) | HIGH | HIGH | P1 |
| Blockout dates | HIGH | LOW | P1 |
| Accept/decline workflow | HIGH | MEDIUM | P1 |
| Email notifications & reminders | HIGH | MEDIUM | P1 |
| Song library (basic) | HIGH | LOW | P1 |
| Service order builder | MEDIUM | MEDIUM | P1 |
| Mobile-responsive UI | HIGH | MEDIUM | P1 |
| Auto-scheduling | HIGH | HIGH | P2 |
| Substitution requests | MEDIUM | MEDIUM | P2 |
| CCLI SongSelect integration | MEDIUM | MEDIUM | P2 |
| Chord transposition | MEDIUM | MEDIUM | P2 |
| File attachments | MEDIUM | LOW | P2 |
| Serving frequency insights | MEDIUM | LOW | P2 |
| Team messaging | MEDIUM | MEDIUM | P2 |
| Announcements | LOW | LOW | P2 |
| Equipment tracking | LOW | LOW | P2 |
| Services LIVE | MEDIUM | HIGH | P3 |
| Rehearsal tools | MEDIUM | HIGH | P3 |
| Multi-campus | MEDIUM | HIGH | P3 |
| Background check tracking | LOW | LOW | P3 |
| Native mobile apps | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Planning Center | Elvanto | ChurchTeams | Breeze | Our Approach |
|---------|----------------|---------|-------------|--------|--------------|
| Service calendar | Full multi-service, multi-type | Service management with types | Calendar with events | Shared calendar | Multi-service calendar with recurring templates |
| Team scheduling | Matrix view, templates, auto-schedule | Rostering with auto-schedule | Team scheduling with duplication | Basic volunteer scheduling | Matrix view with manual + auto-schedule |
| Blockout dates | Self-service with family preferences | Volunteer-submitted unavailability | Block out dates | Calendar-based | Self-service blockout with conflict detection |
| Accept/decline | Full workflow with follow-up | Accept/decline/swap in app | Reply tracking | Basic confirmation | Full workflow with automated follow-up |
| Notifications | Email, push, text (SMS costs extra) | Email + push via app | Email + text | Email | Email + push (web). SMS later. |
| Song library | Deep: arrangements, keys, tags, integrations | Songs with arrangements, transposition | Not a focus | Basic service planning | Songs with arrangements, keys, tags. CCLI integration in v1.x |
| CCLI integration | Auto-import + auto-report | SongSelect import + auto-report | No | No | SongSelect import + auto-report (v1.x) |
| Service flow | Drag-and-drop with timestamps, media | Service planning with items | Not a focus | Basic service planning | Drag-and-drop with timestamps and notes |
| Music Stand / rehearsal | Dedicated app with annotations, pedal, sessions | Basic chord chart viewing | No | No | Defer. Integrate with existing tools. |
| File management | Full with license tracking | File attachments | Basic | Basic | File attachments per service item (v1.x) |
| Mobile app | Native iOS + Android | Native iOS + Android | Web + mobile app | Web + mobile | Responsive web / PWA (v1). Native later. |
| Equipment tracking | Not available | Not available | Not available | Not available | Simple checklist per service (v1.x) -- gap in market |
| Auto-scheduling | Yes, constraint-based | Yes, auto-scheduling tool | Basic duplication | No | Constraint-based auto-scheduling (v1.x) |
| Multi-campus | Yes | Yes | Yes | Limited | Design schema for it, build later (v2) |
| Swap/substitute | Yes | Yes (accept/decline/swap) | Yes (substitutes) | No | Swap requests with team lead approval (v1.x) |
| Pricing model | Per-module, per-size | Per-person tiers | Flat rate + per-person | Flat monthly | TBD -- likely per-church flat rate for simplicity |

## Sources

- [Planning Center Services](https://www.planningcenter.com/services) -- primary competitor, feature reference (HIGH confidence)
- [Planning Center Music Stand](https://www.planningcenter.com/music-stand) -- rehearsal tool features (HIGH confidence)
- [Planning Center CCLI Auto-Reporting](https://www.planningcenter.com/blog/2023/09/auto-report-your-songs-to-ccli-in-services) -- CCLI integration details (HIGH confidence)
- [Planning Center Chat](https://www.planningcenter.com/blog/2024/06/announcing-chat-for-teams-in-the-services-mobile-app) -- communication features (HIGH confidence)
- [Elvanto Worship Planning Features](https://www.elvanto.com/features/worship/) -- rostering and song features (HIGH confidence)
- [Elvanto CCLI Integration](https://help.elvanto.com/hc/en-us/articles/7607884348567-What-the-SongSelect-by-CCLI-Integration-can-do) -- SongSelect details (HIGH confidence)
- [ChurchTeams Volunteers](https://go.churchteams.com/churchteams_volunteers/) -- scheduling and background check features (HIGH confidence)
- [Breeze ChMS](https://www.breezechms.com/) -- general feature overview (MEDIUM confidence)
- [Planning Center GetApp Review 2026](https://www.getapp.com/nonprofit-software/a/planning-center/) -- user ratings and feature summary (MEDIUM confidence)
- [Best Church Volunteer Management Software 2026](https://www.chmeetings.com/best-church-volunteer-management-software/) -- ecosystem overview (MEDIUM confidence)
- [Complete Guide to Scheduling Church Volunteers 2026](https://ministryschedulerpro.com/blog/the-complete-guide-to-scheduling-church-volunteers) -- best practices (MEDIUM confidence)

---
*Feature research for: Church worship team scheduling and serving management*
*Researched: 2026-02-13*
