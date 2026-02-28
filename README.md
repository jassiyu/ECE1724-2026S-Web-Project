# 1. Motivation

### Problem / Need
Small event organizers (student clubs, hobby meetups) frequently run registration and check-in using Google Forms / spreadsheets. This workflow becomes fragile at the exact moment reliability matters most: **peak arrivals**. The result is a predictable set of problems:

- **Slow entry and long lines:** staff must manually search names, resolve “I registered but I’m not on the list,” and update attendance by hand.
- **Unreliable data during live operations:** research on operational spreadsheet use finds that spreadsheet errors are common and non-trivial, which is risky when the spreadsheet is the single source of truth at the door.[1][2]
- **Ticket misuse and duplicate entry:** Staff need a system that can validate one-time use and detect duplicates during scanning.[5]
- **No real-time visibility:** organizers often can’t confidently answer “how many people are inside right now?”.

### Why this project is worth pursuing
A full-stack platform with QR-based tickets and a real-time check-in workflow directly fixes the highest-friction operational moment in in-person events, improves outcomes for all stakeholders:

- **Organizers:** faster throughput, accurate live attendance counts, clear audit trails,, and reliable exports for post-event reporting.
- **Staff/volunteers:** a scanning experience with immediate “valid / invalid / already used” feedback.
- **Attendees:** faster entry and fewer “ticket not found” situations.

This is also worth pursuing as a course project because the real-world needs naturally require the course’s core skills: authenticated access control, relational modeling, file storage for event assets, and real-time updates.

### Target users
- **Organizer (primary):** creates events, configures ticket types, assigns staff, monitors live attendance, and exports reports.
- **Staff (secondary):** scans QR codes, validates tickets for assigned events only, and handles duplicates/invalid scans.
- **Attendee (secondary):** obtains tickets and presents a QR code from “My Tickets” at entry.

### Existing solutions and their limitations
1) **DIY spreadsheets:** low setup effort, but error-prone and hard to run reliably in real time. The spreadsheet-error literature emphasizes that errors are widespread enough to represent real operational risk.[1][2]

2) **Commercial ticketing platforms (Eventbrite-style tools):** they validate the approach (QR-based tickets + organizer scanning app), but may be unattractive for small organizers due to **fees** and limited customization/ownership for specific workflows.[3][4]

3) **Static QR generators / printable lists:** easy to create, but without server-side validation they cannot reliably prevent reuse; fraud-prevention guidance emphasizes database-backed validation and duplicate detection.[5]

---

# 2. Objective and Key Features

### Objective
Build a full-stack web application that supports event setup, ticket issuance, QR code validation, and real-time check-in operations. The system supports three roles (Organizer / Staff / Attendee) and provides an end-to-end workflow: create event → issue tickets → generate QR → scan & validate → record check-in → view live attendance.

### Architecture (Technical implementation approach)
**Option B: Separate Frontend & Backend**

#### Frontend
- React + TypeScript
- Tailwind CSS for styling
- shadcn/ui for UI components
- Responsive UI: desktop organizer console + mobile-first staff scanner page
- Redux Toolkit for shared UI state (filters, selected event context, recent scan results)

#### Backend
- Express.js + TypeScript
- RESTful API providing resources for events, ticket types, tickets, check-ins, and files
- Relational database: PostgreSQL
- Cloud storage integration: S3-compatible object storage for event assets

#### API Documentation
- OpenAPI (Swagger) specification for all REST endpoints
- Swagger UI served at /docs
- Each endpoint documents authentication requirements, allowed roles (Organizer/Staff/Attendee), and example request/response payloads

---
## Basic Features

### 1) Core Features

#### A) Authentication and Authorization (Advanced Feature #1)
- User registration and login.
- Session-based auth or JWT + refresh token.
- Role-based access:
 - **Organizer**: manage events, assign staff, view dashboard.
 - **Staff**: validate/check in tickets for assigned events only.
 - **Attendee**: claim/view tickets in "My Tickets".
- Authorization enforced in backend middleware 

#### B) Event Management
- Organizer creates/edits events: title, description, venue, start/end time, capacity.
- Organizer configures ticket types: name, price, quantity, sale window.
- Organizer assigns/removes staff for each event.

#### C) Ticket + QR Issuance
- Attendee claims a ticket (MVP: free claim).
- Backend creates `Ticket` with unique opaque `qrToken`.
- Frontend renders QR from token only (no sensitive data in payload).

#### D) Check-In Validation
- Staff scans QR (camera + manual fallback).
- Frontend sends token to backend validation endpoint.
- Backend verifies ticket ownership/event match/status/duplicate usage.
- On success, backend writes `CheckIn` (time + staff ID).

#### E) Real-Time Dashboard
- Live checked-in count vs capacity.
- Recent scan feed + invalid/duplicate alerts.
- Implemented with Socket.IO rooms

#### F) Cloud File Storage
- Upload/display event poster (PNG/JPG), optional venue map (PDF).
- Frontend uploads via pre-signed URL.
- Backend stores file metadata and links to `Event`.
- Optional enhancement: file validation, poster thumbnail, PDF preview metadata.

---

### 2) MVP Scope

#### In-Scope
- Event creation/editing, ticket type setup, staff assignment.
- Ticket claim + QR display in "My Tickets".
- Staff validation/check-in flow with duplicate prevention.
- Live attendance updates on the dashboard.
- Poster upload and display.

#### Out-of-Scope
- Payments/refunds.
- Discount codes, waitlist, custom registration forms.
- Email/SMS notifications.
- Advanced analytics.
- Multi-tenant organization/billing.

#### Success Metrics
- Check-in validation typically completes within **3 seconds** in demo conditions.
- Re-scan of an already used ticket returns `already_used`.
- Unauthorized role actions are blocked by protected APIs.
- Dashboard reflects new check-ins within **5 seconds**.
- Dashboard totals match persisted `CheckIn` records.
- End-to-end demo works: create event -> claim ticket -> check in -> dashboard updates.

---

### 3) Database Model

Use **PostgreSQL + Prisma** 

**Tables**
- `User`: `id`, `email`, `passwordHash`, `role`, `createdAt`
- `Event`: `id`, `organizerId`, `title`, `description`, `venue`, `startAt`, `endAt`, `capacity`, `posterFileId`, `createdAt`
- `EventStaff`: `eventId`, `userId` (unique pair)
- `TicketType`: `id`, `eventId`, `name`, `priceCents`, `quantity`, `salesStartAt`, `salesEndAt`
- `Ticket`: `id`, `eventId`, `ticketTypeId`, `ownerId`, `status`, `qrToken` (unique), `createdAt`
- `CheckIn`: `id`, `ticketId` (unique), `eventId`, `checkedInBy`, `checkedInAt`
- `FileObject`: `id`, `ownerId`, `bucketKey`, `mimeType`, `sizeBytes`, `originalName`, `createdAt`

**Key Constraints**
- `CheckIn.ticketId` unique 
- Staff must be assigned in `EventStaff` for event check-in.
- `Ticket.qrToken` unique and random.

---

### 4) REST API (MVP)

**Auth**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

**Events**
- `GET /events`
- `GET /events/:eventId`
- `POST /events` (Organizer)
- `PUT /events/:eventId` (Organizer)
- `GET /events/:eventId/dashboard` (Organizer/Staff)

**Event Staff**
- `GET /events/:eventId/staff` (Organizer)
- `POST /events/:eventId/staff` (Organizer)
- `DELETE /events/:eventId/staff/:userId` (Organizer)

**Ticket Types**
- `POST /events/:eventId/ticket-types` (Organizer)
- `GET /events/:eventId/ticket-types` (Public)

**Tickets**
- `POST /events/:eventId/tickets` (Attendee)
- `GET /me/tickets` (Attendee)
- `GET /tickets/:ticketId` (Owner or authorized Organizer/Staff)

**Check-Ins**
- `POST /events/:eventId/checkins/validate` (Staff)
- `GET /events/:eventId/checkins/recent` (Organizer/Staff)

**Files**
- `POST /files/presign-upload`
- `GET /files/:fileId/download`

---

### 5) UI Scope

- **Public:** event list + event detail.
- **Attendee:** "My Tickets" + QR ticket detail.
- **Staff:** mobile scanner with large valid/invalid/used feedback and recent result.
- **Organizer:** event management, ticket type management, staff assignment, live attendance dashboard.




## Planned Advanced Features

### Advanced Feature #1: User Authentication and Authorization
Registration and login for all users
Token- or session-based authentication (e.g., JWT + refresh token or session cookies)
Protected routes/APIs enforced by Express middleware (requireAuth)
Role-based access control (requireRole) for Organizer / Staff / Attendee actions:
Organizer: create/manage events, assign staff, view analytics
Staff: scan/check-in for assigned events only
Attendee: claim/view tickets (“My Tickets”)
Authorization checks are performed server-side (not only in the frontend)

### Advanced Feature #2: Real-Time Functionality (Live check-in dashboard)
Organizers (and staff) see live updates without refresh:
checked-in count vs capacity
recent scan activity feed
alerts for invalid/duplicate scans
Real-time updates are delivered via WebSockets (Socket.IO) from the Express backend, with clients subscribing to an event-specific channel/room.
---

### Scope and feasibility
The MVP will focus on the main end-to-end workflow of the system: an organizer creates an event and ticket types, an attendee claims a ticket and receives a QR code, staff scan and validate the QR to check the attendee in, and the organizer dashboard shows the updated attendance (with live updates for the real-time requirement). This scope covers the core project requirements: a React frontend + Express REST backend, a relational database for ticket/check-in records, and cloud storage for event assets.

To keep the workload manageable, features will be built in small modules (auth/RBAC, event management, ticket issuing, check-in validation, dashboard, file upload) and integrated step by step. Optional features like paid checkout, discount codes, waitlist, email confirmations, and custom registration forms will only be attempted after the MVP is stable.

---

# 3. Tentative Plan

## Team roles and responsibilities
- **Ruifan: Project lead and backend developer**  
  Define endpoints and data flow.<br>
  Implement core event, ticket, and check-in logic.<br>
  Review pull requests and keep features integrated.

- **Siyu: Frontend developer**  
  Build the main pages for attendees and organizers.<br>
  Implement navigation and core UI states.<br>
  Ensure the app is responsive on desktop and mobile.

- **Yuye: Check-in and QR workflow developer**  
  Build the staff scanning experience.<br>
  Implement validation results and duplicate handling UI.<br>
  Test scanning flow end-to-end with realistic scenarios.

- **Jenny: Real-time, files, and documentation developer**  
  Implement live dashboard updates for check-ins.<br>
  Implement event asset upload and display.<br>
  Maintain API documentation and run final QA checks.

## week-by-week plan
**Week 1: Foundation**
- Set up repo, branch workflow, and basic app structure.
- Create initial pages for Event List and Event Details.
- Define the first version of the data model and endpoints.

**Week 2: Organizer flow**
- Build organizer login and protected dashboard access.
- Implement create event and edit event forms.
- Connect organizer pages to create and fetch events.

**Week 3: Ticket issuance and My Tickets**
- Implement ticket types and basic ticket claiming flow.
- Generate and display QR codes in My Tickets.
- Build navigation between Event Details and My Tickets.

**Week 4: Staff check-in**
- Build mobile-first scan page and manual code entry fallback.
- Connect scan results to validation and check-in actions.
- Display clear states for valid, invalid, and already used tickets.

**Week 5: Live dashboard and event assets**
- Show live attendance count and recent scan activity.
- Broadcast updates when check-ins happen.
- Upload and display event poster images on listings and event pages.

**Week 6: Polish, testing, and presentation**
- Run full end-to-end test of the event lifecycle with multiple roles.
- Improve UI consistency, error handling, and loading states.
- Finalize API documentation and prepare the demo script.
---

# 4. Initial Independent Reasoning

### Application structure and architecture

We selected a **separate React frontend + Express backend** to practice real-world separation of concerns. This keeps backend responsibilities clear (REST resources + auth + validation), supports OpenAPI documentation, and reflects common industry deployments where frontend and backend scale independently.

### Data and state design

We designed around a relational core:

* Events connect to ticket types, tickets, and check-ins.
* Staff assignment is many-to-many between users and events.

Authoritative state (tickets, check-ins) remains server-driven for correctness, while client state handles UI flow and scan feedback.

### Feature selection and scope decisions

We focused on the ticket lifecycle:

* Event creation, ticket issuance, QR validation, check-in

Advanced features:

* **Auth + RBAC** to enforce staff/organizer boundaries
* **Real-time updates** to sync check-ins across devices

We deferred payments and complex registration to reduce risk and scope.

### Anticipated challenges

We expected challenges in:

* RBAC enforcement across endpoints
* Preventing QR forgery (opaque tokens + server validation)
* WebSocket event scoping (emit only to relevant rooms)
* Mobile scanning usability (permissions, fast feedback)

### Early collaboration plan

We split work by system boundary:

* Backend/API + docs
* Frontend UI + flows
* Real-time + storage integration

Coordination through a shared task board and PR reviews aimed to prevent integration drift.

---

# 5. AI Assistance Disclosure

### Developed without AI

* Project theme selection (event ticketing + QR check-in)
* MVP lifecycle definition and scope prioritization
* Core entities (Event, Ticket, CheckIn, Staff assignment)
* Division of responsibilities

### AI assistance

AI helped refine structure, clarity, and alignment with the grading rubric. It improved REST API naming consistency, endpoint grouping, and reduced redundancy. It also stress-tested our QR validation workflow by surfacing edge cases (duplicate scans, wrong-event tickets, voided/refunded tickets) and clarifying our real-time update explanation.

### One AI-influenced decision

AI suggested including identifiers in the QR payload. We chose instead to use an opaque random token resolved server-side, improving privacy and simplifying revocation, with acceptable reliance on network validation.

---

# References

[1] S. G. Powell, K. R. Baker, and B. Lawson, “A critical review of the literature on spreadsheet errors,” *Decision Support Systems*, vol. 46, no. 1, pp. 128–138, Dec. 2008, doi: 10.1016/j.dss.2008.06.001.

[2] R. R. Panko, “Spreadsheet Errors: What We Know. What We Think We Can Do,” *arXiv preprint* arXiv:0802.3457, Feb. 2008, doi: 10.48550/arXiv.0802.3457. [Online]. Available: https://arxiv.org/abs/0802.3457. Accessed: Feb. 22, 2026.

[3] Eventbrite, “How to check in attendees at the event with Eventbrite Organizer,” *Eventbrite Help Center*. [Online]. Available: https://www.eventbrite.ca/help/en-ca/articles/741083/how-to-check-in-attendees-at-the-event-with-eventbrite-organizer/. Accessed: Feb. 22, 2026.

[4] Eventbrite, “Pricing and features for organizers (Canada),” *Eventbrite Organizer Pricing*. [Online]. Available: https://www.eventbrite.ca/organizer/pricing/. Accessed: Feb. 22, 2026.

[5] Ticket Fairy, “Preventing Ticket Fraud and Scalping at Festivals,” Jul. 11, 2025, updated Jan. 22, 2026. [Online]. Available: https://www.ticketfairy.com/blog/preventing-ticket-fraud-and-scalping-at-festivals. Accessed: Feb. 22, 2026.



