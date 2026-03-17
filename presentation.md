# 6-Minute Presentation Plan

This presentation is structured as:

- `0:00-3:00` Slides and explanation
- `3:00-6:00` Live demo

The goal is to maximize the rubric by clearly covering:

- project purpose and workflow
- overall architecture
- all core technical requirements
- two advanced features

## High-Level Timeline

| Time | Section | Goal |
| --- | --- | --- |
| `0:00-0:40` | Problem and motivation | Explain why the project matters |
| `0:40-1:15` | What the system does | Show the end-to-end workflow |
| `1:15-2:10` | Architecture and technical stack | Cover frontend, backend, database, storage |
| `2:10-3:00` | Advanced features and demo setup | Explain auth/RBAC and real-time updates |
| `3:00-6:00` | Live demo | Show one complete workflow |

## Slide Plan

### Slide 1: Problem and Users

**Time:** `0:00-0:40`

**What to say**

"Our project is an event ticketing and check-in platform for small organizers. Many student clubs and small events still rely on Google Forms and spreadsheets, which can cause slow check-in, duplicate entry, and poor live visibility during peak arrival times."

"Our main users are organizers, staff, and attendees."

**What should appear on the slide**

- Problem: long lines, manual checking, no live attendance view
- Users: organizer, staff, attendee

**Why this helps the rubric**

- Gives a clear opening
- Makes the presentation easier to follow

### Slide 2: End-to-End Workflow

**Time:** `0:40-1:15`

**What to say**

"Our system supports one complete workflow: the organizer creates an event, an attendee gets a ticket with a QR token, staff validate it at the door, and the organizer dashboard updates live."

**What should appear on the slide**

`Create event -> Add ticket type -> Assign staff -> Claim ticket -> Scan ticket -> Record check-in -> Live dashboard update`

**Why this helps the rubric**

- Prepares the audience for the demo
- Shows the project is an integrated system, not just separate pages

### Slide 3: Architecture and Core Technical Requirements

**Time:** `1:15-2:10`

**What to say**

"On the frontend, we use React with TypeScript and Tailwind CSS. On the backend, we use Express with TypeScript. We use PostgreSQL with Prisma for relational data storage, and S3-compatible object storage for event poster uploads. The frontend and backend communicate through REST APIs."

"This means our project covers the core technical requirements: TypeScript on both sides, a working frontend, a working backend, frontend-backend integration, relational database persistence, and cloud file handling."

**What should appear on the slide**

- Frontend: React + TypeScript + Tailwind
- Backend: Express + TypeScript
- Database: PostgreSQL + Prisma
- Storage: S3-compatible object storage
- Real-time: Socket.IO

**Why this helps the rubric**

- Explicitly covers all core boxes the UI alone may not prove

### Slide 4: Advanced Features and Demo Setup

**Time:** `2:10-3:00`

**What to say**

"Our first advanced feature is authentication and authorization. Different roles have different permissions: organizers manage events, staff validate tickets, and attendees view their own tickets. These permissions are enforced on the backend, not just hidden in the frontend."

"Our second advanced feature is real-time updates. When a staff member checks in a ticket, the organizer dashboard updates without refreshing using Socket.IO."

"In the demo, we’ll show organizer setup, attendee ticket access, staff validation, and the live dashboard update."

**What should appear on the slide**

- Advanced Feature 1: Authentication and role-based authorization
- Advanced Feature 2: Real-time dashboard updates
- Mini flow:
  `staff scan -> backend validate -> DB write -> socket event -> dashboard refresh`

## Live Demo Plan

## Demo Timeline

| Time | Action | What it proves |
| --- | --- | --- |
| `3:00-3:35` | Organizer logs in and opens event management | Auth, protected routes, organizer flow |
| `3:35-4:05` | Create event and upload poster | Frontend, backend, DB, cloud file handling |
| `4:05-4:25` | Add ticket type | DB write, organizer management |
| `4:25-4:40` | Assign staff | Role-based workflow |
| `4:40-5:00` | Attendee claims ticket or opens pre-claimed ticket | Attendee flow, ticket issuance |
| `5:00-5:25` | Staff scans ticket successfully | Validation logic, backend integration |
| `5:25-5:40` | Scan same ticket again if time allows | Duplicate prevention |
| `5:40-6:00` | Return to organizer dashboard | Real-time updates, recent check-ins |

## Demo Script

### `3:00-3:35` Organizer login and event management

**Action**

- Log in as organizer
- Open event management page

**What to say**

"We’ll now show one complete workflow. First, we log in as an organizer. This demonstrates authentication and protected access to organizer-only features."

### `3:35-4:05` Create event and upload poster

**Action**

- Create a new event
- Fill only essential fields
- Upload a poster

**What to say**

"Here the organizer creates an event and uploads a poster. The event data is stored in PostgreSQL, and the poster is uploaded through our S3-compatible file storage flow."

### `4:05-4:25` Add ticket type

**Action**

- Add one ticket type

**What to say**

"Next, the organizer creates a ticket type. This updates the event data and makes tickets available for attendees."

### `4:25-4:40` Assign staff

**Action**

- Paste the staff user ID
- Add the staff member

**What to say**

"Now the organizer assigns a staff member to this event. This matters because only assigned staff should be allowed to validate tickets for that event."

### `4:40-5:00` Attendee claim ticket or open pre-claimed ticket

**Preferred if fully working**

- Log in as attendee
- Claim ticket
- Open ticket page

**Safe fallback**

- Log in as attendee
- Open a pre-claimed ticket in `My Tickets`

**What to say**

"On the attendee side, the user receives a ticket with a unique QR token. The token is what the staff scanner validates against the backend."

**Important note**

- If the live claim flow is not fully stable, use a pre-claimed ticket instead.
- This is safer than risking a broken flow during the presentation.

### `5:00-5:25` Staff scan success case

**Action**

- Log in as staff
- Open scanner
- Scan or paste the token
- Show `VALID`

**What to say**

"Now staff validate the ticket. The frontend sends the token to the backend, which checks that the ticket exists, matches the event, and has not been used yet. On success, the backend creates a check-in record."

### `5:25-5:40` Duplicate scan case

**Action**

- Scan the same token again
- Show `ALREADY USED`

**What to say**

"If we scan the same ticket again, duplicate prevention is triggered immediately."

**Why this is worth showing**

- It makes the backend logic much more convincing
- It is a strong demo moment for the instructor and TAs

### `5:40-6:00` Organizer dashboard live update

**Action**

- Return to organizer dashboard
- Show checked-in count changed
- Show recent check-ins updated

**What to say**

"Back on the organizer dashboard, the checked-in count and recent activity update without refreshing. This demonstrates our real-time functionality using Socket.IO."

## Recommended Demo Setup Before Presenting

- Create three accounts in advance: organizer, attendee, staff
- Keep the organizer dashboard open in another tab before the demo starts
- Keep the staff user ID copied so assignment is fast
- Keep one poster image ready for upload
- Keep one valid ticket token ready in case scanning is slow
- Keep one backup pre-created event in case event creation fails
- Keep one backup pre-claimed attendee ticket in case live claim fails

## Safest Version of the Demo

If time is tight or the UI is still changing, use this version:

- Organizer logs in
- Open a pre-created event that already has a poster
- Show ticket type and staff assignment
- Attendee opens a pre-claimed ticket
- Staff scans the ticket
- Staff scans again to show duplicate prevention
- Organizer dashboard updates live

This version is the safest for the rubric because it still shows:

- frontend
- backend
- frontend-backend integration
- relational database usage
- file handling
- authentication and authorization
- real-time updates

## Rubric Mapping

| Rubric Item | Where we show it |
| --- | --- |
| TypeScript usage | Slide 3 explanation |
| Frontend implementation | Event pages, ticket pages, scanner, dashboard |
| Backend implementation | Explained in Slide 3 and demonstrated through validation logic |
| Frontend-backend integration | Event creation, ticket creation, scan validation, dashboard data |
| Relational database usage | Event, ticket type, ticket, and check-in persistence |
| File handling with cloud storage | Poster upload and poster display |
| Advanced feature 1 | Login and role-based organizer/staff/attendee flow |
| Advanced feature 2 | Live organizer dashboard update |

## Final Closing Line

Use this at the end of the demo:

"In one workflow, we demonstrated authentication, organizer management, attendee ticketing, staff validation, persistent data storage, cloud file handling, and real-time dashboard updates."
