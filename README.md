# TicketGate

TicketGate is a full-stack web application for event ticketing and QR-based check-in. It supports three user roles—Organizer, Staff, and Attendee—and provides an end-to-end workflow from event creation to ticket claiming, ticket validation, and live attendance tracking.

---

## 1. Team Information

- **Ruifan Wu** — Student Number: `[TODO]` — Email: `[TODO]`
- **Yuye Huang** — Student Number: 1006663905 — Email: yuye.huang@mail.utoronto.ca
- **Jenny You** — Student Number: 1006779657 — Email: jenny.you@mail.utoronto.ca
- **Jasmine Shao** — Student Number: 1007147204 — Email: jasmine.shao@mail.utoronto.ca

---

## 2. Motivation

We chose TicketGate because event entry is a familiar real-world workflow that still breaks down easily when handled with forms, spreadsheets, and manual check-in. That approach may be acceptable while attendance is small, but it becomes unreliable during peak arrival time, when staff need to search names manually, resolve conflicts at the door, and update attendance after the fact. In practice, this can create long lines, duplicate entry, unclear ticket status, and poor visibility for organizers exactly when they need fast decisions.

The problem is significant because check-in is the most time-sensitive part of an in-person event. A reliable ticketing and validation system improves the experience for every role involved. Organizers need visibility into capacity, ticket usage, and staff operations. Staff need a fast and unambiguous way to validate entry. Attendees need a simple ticket flow that reduces confusion and waiting time. A QR-based workflow with server-side validation directly addresses that operational bottleneck.

This project was also a strong match for the course because the problem naturally requires the major skills we wanted to practice in one integrated system: authenticated role-based access, relational data modeling, secure API design, cloud-style file handling, and real-time updates. The spreadsheet-error literature also supports the motivation for moving beyond manual workflows, since spreadsheet-based processes are known to be error-prone in operational settings.[1][2]

### Target Users

- **Organizer**: creates and manages events, configures ticket types, assigns staff, monitors attendance, and manages event assets.
- **Staff**: validates tickets for assigned events and handles duplicate or invalid scans.
- **Attendee**: claims tickets and presents a QR code or token at entry.

### Existing Solutions and Their Limitations

1. **DIY spreadsheets**: easy to start with, but error-prone and difficult to use reliably in real time.[1][2]
2. **Commercial ticketing platforms**: they validate the usefulness of QR-based tickets and organizer scanning apps, but they may be less attractive for small organizers because of fees and limited customization.[3][4]
3. **Static QR generators or printable lists**: easy to create, but without server-side validation they cannot reliably prevent reuse or duplicate entry.[5]

---

## 3. Objectives

The main objective of TicketGate was to implement a complete and testable event workflow:

**create event → configure ticket types → assign staff → claim ticket → generate QR/token → validate at entry → record check-in → update the organizer dashboard**

To achieve that goal, we defined the following concrete objectives for the MVP:

- support authenticated access for three roles: Organizer, Staff, and Attendee
- allow organizers to create, edit, and manage events and ticket types
- allow attendees to claim tickets and retrieve them later through **My Tickets**
- generate a unique opaque token for each ticket so that validation does not depend on guessable identifiers
- enforce one-time ticket use and clearly handle duplicate, invalid, cancelled, and wrong-event scans
- provide organizers with live attendance visibility through Socket.IO-based dashboard updates
- support poster upload and download through S3-compatible object storage and database-linked file metadata
- keep the codebase modular enough that routing, business logic, persistence, and real-time features remain easy to reason about

We intentionally kept payments, discount codes, email notifications, waitlists, and advanced analytics out of scope. That decision let us focus on delivering a stable core lifecycle first, which was the most important measure of success for the project.

---

## 4. Technical Stack

We chose the **Express.js Backend** path rather than the Next.js full-stack path. The application benefits from a clear separation between the browser client, the REST API, the database layer, and the real-time Socket.IO server, especially because the system has multiple roles, event-specific authorization rules, and direct-to-storage file-upload flows.

Our implementation therefore follows a **separate frontend and backend architecture**.

### Frontend

- React 19 with TypeScript for a typed component-based UI
- Vite for local development and frontend builds
- React Router for page routing and protected navigation
- Redux Toolkit for shared auth, event, and scanner state
- Axios for HTTP communication with the backend API
- Socket.IO client for real-time dashboard updates
- `@zxing/browser` for camera-based QR scanning
- Tailwind CSS v4 for styling

### Backend

- Express.js with TypeScript for the REST API
- Prisma ORM for typed database access and schema-driven development
- JWT-based authentication, role-aware authorization checks, and `bcryptjs` password hashing
- Zod for request validation
- Socket.IO for authorized real-time event-room updates

### Database and Storage

- PostgreSQL as the primary relational database for users, events, ticket types, tickets, check-ins, staff assignments, and file metadata
- Docker Compose with PostgreSQL 16 for local database setup
- S3-compatible object storage for event poster uploads and downloads
- AWS SDK v3 with pre-signed upload/download URLs for direct file transfer
- MinIO-compatible local development configuration through `S3_ENDPOINT=http://localhost:9000`

### Architectural Approach

The backend uses a three-layer structure:

- **Resources / routes** for HTTP endpoints
- **Services** for application logic
- **Clients** for database and storage access

On the frontend, we similarly separated pages, API helpers, store slices, and socket helpers. This structure kept the codebase easier to debug, made role-based behavior more explicit, and reduced coupling between UI code and backend-specific details.

---

## 5. Features

This section summarizes the main features of the application and explains how they satisfy the project objectives and course requirements.

### 5.1 Authentication and Authorization

Users can register and log in as Organizer, Staff, or Attendee. Protected frontend routes and backend middleware ensure that users only access the features allowed for their role.

Examples:
- only organizers can create and edit events
- only organizers can assign staff
- only attendees can claim tickets and view **My Tickets**
- only assigned staff can validate tickets for a specific event

This fulfills one of our planned advanced features: role-based authentication and authorization.

### 5.2 Event Management

Organizers can create and edit events with:
- title
- description
- venue
- start time
- end time
- capacity
- poster file reference

This satisfies the core event management requirement in our proposal and forms the base of the organizer workflow.

### 5.3 Ticket Type Management

Organizers can create ticket types for an event, including:
- ticket type name
- price
- quantity
- sales start time
- sales end time

This supports the organizer-side setup flow and makes event configuration possible before ticket claiming begins.

### 5.4 Ticket Claiming and QR / Token Issuance

Attendees can claim a ticket from the event detail page. After claiming, the ticket appears in **My Tickets**, and the ticket detail page shows the ticket information and QR/token content.

As planned in our MVP, the current implementation uses a free-claim model rather than full payment processing. Payment and refund flows were intentionally kept out of scope to keep the main event lifecycle stable.

### 5.5 Ticket Validation and Duplicate Prevention

Staff can validate tickets through the scanner page. The system checks:
- whether the token exists
- whether the ticket belongs to the current event
- whether the ticket is cancelled
- whether the ticket has already been used

The validation result clearly distinguishes among:
- `success`
- `already_used`
- `wrong_event`
- `cancelled`
- `invalid_ticket`

This implements the core check-in validation workflow and duplicate prevention behavior described in our proposal.

### 5.6 Scanner Page with Camera and Manual Fallback

The staff scanner page supports both manual token entry and camera-based QR scanning. We kept manual input as a fallback so that the same backend validation logic still works even if camera scanning is unavailable on a specific device.

This improves usability while keeping the validation flow reliable during demos and local testing.

### 5.7 Live Dashboard

The organizer dashboard displays:
- checked-in count
- event capacity
- tickets sold
- occupancy percentage
- recent scan feed

New check-ins and duplicate or invalid scan events are pushed in real time using Socket.IO. This fulfills our second advanced feature: real-time functionality.

### 5.8 Staff Assignment

Organizers can assign staff members to specific events. Staff assignment is enforced server-side during check-in validation, so a staff user cannot validate tickets for an event they are not assigned to.

This keeps scanner access event-specific and consistent with the system’s role-based design.

### 5.9 Cloud File Handling for Event Posters

The project includes cloud-based file handling for event posters using S3-compatible storage. Organizers can upload and download poster files for events, while the backend stores file metadata and links each uploaded file to its corresponding event record.

This addresses the course requirement that all projects support basic uploading, downloading, and database association for files.

---

## 6. User Guide

### 6.1 Public User Flow

1. Open the event list page.
2. Browse available events.
3. Click an event to open the event detail page.

**Suggested screenshot:**  
`[TODO: insert screenshot path for public event list]`

### 6.2 Attendee Flow

1. Register or log in as an attendee.
2. Open an event detail page.
3. Click **Claim Ticket**.
4. After claiming, go to **My Tickets**.
5. Open the ticket detail page to view the ticket and QR/token.

**Suggested screenshots:**  
- `[TODO: attendee event detail page]`
- `[TODO: My Tickets page]`
- `[TODO: ticket detail page with QR/token]`

### 6.3 Organizer Flow

1. Register or log in as an organizer.
2. Click **Create Event**.
3. Fill in the event information and save the event.
4. Open the event edit page.
5. Add one or more ticket types.
6. Assign staff members to the event by email.
7. Open the live dashboard to monitor attendance.

**Suggested screenshots:**  
- `[TODO: create event page]`
- `[TODO: edit event page]`
- `[TODO: add ticket type page]`
- `[TODO: staff assignment page]`
- `[TODO: organizer dashboard]`

### 6.4 Staff Flow

1. Log in as a staff user.
2. Open the scanner page for the assigned event.
3. Either:
   - scan a QR code with the camera, or
   - paste or type the ticket token manually
4. The page will display one of the validation results, such as VALID or ALREADY USED.

**Suggested screenshots:**  
- `[TODO: scanner page]`
- `[TODO: scanner VALID result]`
- `[TODO: scanner ALREADY USED result]`

### 6.5 Poster Flow

1. Organizer opens create or edit event.
2. Uploads a poster image file.
3. Saves the event.
4. Event detail page displays the uploaded poster.
5. The poster can be downloaded through the stored file reference.

**Suggested screenshots:**  
- `[TODO: poster upload form]`
- `[TODO: event detail page showing poster]`

---

## 7. Development Guide

### 7.1 Environment Setup

Prerequisites:
- Node.js 18+
- PostgreSQL
- `[TODO: local S3-compatible storage service if used]`
- npm

Clone the repository and install dependencies:

```bash
git clone [TODO: repo-url]
cd ECE1724-2026S-Web-Project
```

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 7.2 Backend Configuration

Create `backend/.env` and configure the required variables.

Example:

```env
DATABASE_URL=[TODO]
JWT_SECRET=[TODO]
S3_ENDPOINT=[TODO]
S3_BUCKET=[TODO]
S3_ACCESS_KEY=[TODO]
S3_SECRET_KEY=[TODO]
S3_REGION=[TODO]
```

`[TODO: update variable names so they match your real backend config]`

### 7.3 Database Initialization

From the backend directory:

```bash
npx prisma generate
npx prisma migrate dev
```

Optional reset for a clean local database:

```bash
npx prisma migrate reset
```

### 7.4 Cloud Storage Configuration

To enable poster upload and retrieval:
- start the S3-compatible storage service
- create the bucket configured in the backend environment
- ensure the backend can generate pre-signed upload URLs
- ensure the storage service allows local development access as needed

`[TODO: add concrete local instructions if you used MinIO or another local storage service]`

### 7.5 Run the Project Locally

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Expected local URLs:
- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`
- backend health route: `http://localhost:3000/health`

### 7.6 Testing and Verification

Our team verified correctness mainly through end-to-end user-flow testing across all three roles.

The main tested flow was:
1. organizer creates an event
2. organizer adds a ticket type
3. organizer assigns staff
4. attendee claims a ticket
5. attendee views ticket detail and QR token
6. staff validates the ticket
7. organizer dashboard updates in real time

We also manually verified:
- duplicate scan behavior
- invalid token behavior
- route and API protection for unauthorized roles
- staff assignment restrictions for event-specific actions

`[TODO: add test commands if you have frontend vitest tests or backend tests]`

Example frontend test command:

```bash
cd frontend
npm test
```

---

## 8. AI Assistance & Verification (Summary)

AI tools were used as bounded development aids for ideation, debugging, and documentation rather than as an authoritative source of final code. Across the project, we used AI primarily to compare QR-scanning approaches, reason about Socket.IO room updates, review route and API naming consistency, and improve documentation clarity. In practice, AI outputs were treated as hypotheses: we only kept suggestions that matched our actual React + TypeScript + Express + Prisma stack and fit the architecture already established in TicketGate.

AI was most useful when we needed to turn a vague problem into a concrete debugging path. It helped us shortlist browser-based QR scanning options, outline a presigned-upload workflow for S3-compatible storage, and think through room-based real-time updates for the organizer dashboard. It also helped surface edge cases that deserved explicit handling, such as duplicate scans, wrong-event scans, unauthorized event access, sold-out ticket types, and failure states during upload or validation.

At the same time, AI suggestions were not always directly usable. Some recommendations assumed libraries, examples, or patterns that did not match our dependency versions or project structure. This was most noticeable in QR-scanner suggestions, where some proposed React wrappers were not a good fit for our frontend environment. In other cases, AI responses were too generic, such as suggesting broader real-time broadcasts when our application required event-specific authorization and room-based updates.

Because of this, verification was a required step before adoption. We checked proposed changes against package versions, our existing type definitions, backend contracts, and actual runtime behavior. Accepted suggestions were verified through manual end-to-end testing across Organizer, Staff, and Attendee flows, inspection of backend logs and API responses, validation of role-based access restrictions, observation of real-time dashboard updates after persisted check-ins, and the available frontend tests for advanced features such as presigned uploads and Socket.IO helpers. Only suggestions that passed these checks were incorporated into the final project. Representative examples are documented in `ai-session.md`.

---

## 9. Individual Contributions

The project was completed collaboratively, but each team member had a primary area of ownership that helped reduce merge conflicts and keep development parallelized.

**Ruifan Wu** primarily led the backend foundation and access-control layer. This included the authentication flow, JWT-based protection, role-aware middleware, and core event-related backend logic. Ruifan also helped establish the backend service/resource/client structure and supported integration across modules so that the event, dashboard, and staff-management flows behaved consistently.

**Yuye Huang** primarily led the ticket lifecycle and check-in workflow. This included ticket claiming, attendee ticket views, scanner validation logic, and the handling of validation states such as `success`, `already_used`, `wrong_event`, `cancelled`, and `invalid_ticket`. Yuye also contributed to testing the end-to-end ticket path from claim to scan and helped refine duplicate-prevention behavior.

**Jenny You** primarily led the advanced features and organizer-side operational tooling. This included Socket.IO-based real-time dashboard updates, file-handling support for poster uploads using S3-compatible storage, and organizer-facing operational pages such as staff assignment and dashboard-related functionality. Jenny also supported integration work around ticket-type operations, final QA passes, and documentation cleanup.

**Jasmine Shao** primarily led the frontend shell and the main user-facing page structure. This included routing, login and registration flow integration, protected-page behavior, and the core event pages such as the public event list, event detail, create event, and edit event views. Jasmine also contributed to later frontend integration and polish, including consistency fixes across role-based flows and improvements to the usability of event-management pages.

Although responsibilities were divided by feature area, final integration, bug fixing, and verification were shared across the whole team. All members contributed to debugging cross-layer issues between frontend, backend, database, and real-time behavior.

---

## 10. Lessons Learned and Concluding Remarks

This project showed us that even a focused full-stack application becomes substantially more complex once it includes multiple user roles, authorization rules, and cross-feature dependencies. A workflow that looks simple at the surface—create an event, claim a ticket, scan a QR code, and update attendance—depends on many tightly connected components behind the scenes: relational data modeling, route protection, event-specific permissions, frontend state coordination, direct-to-storage file handling, and real-time communication.

One of the most important lessons was the value of scope control. Early in the project, it was tempting to add features such as payments, discount codes, waitlists, email notifications, and richer analytics. However, keeping the MVP centered on the core lifecycle allowed us to produce a working system with a clear and testable value proposition. That decision made it easier to prioritize stability in the most important path: event creation, ticket-type setup, ticket claiming, validation at entry, and live dashboard updates.

We also learned that authorization logic must remain a backend responsibility rather than a frontend assumption. Pages can hide buttons or routes, but the real source of truth must be server-side checks tied to the authenticated user and the target event. This became especially important for dashboard access, staff assignment, and ticket validation, where event-level ownership and assignment rules had to be enforced consistently.

Another practical lesson was that features that seem straightforward in concept can become sensitive to environment details in implementation. Camera-based QR scanning depends on browser behavior, device support, and library compatibility. Real-time updates depend on room membership, event naming, and predictable state synchronization. File uploads depend on storage configuration, MIME restrictions, and correct database association. In each case, providing stable fallback behavior and keeping the architecture simple were more valuable than chasing unnecessary complexity.

Overall, TicketGate achieved the main goals we set for the project: a separate React and Express architecture, role-based access control, a complete ticket lifecycle, event-specific validation and duplicate prevention, poster upload support, and real-time attendance visibility for authorized users. More importantly, the project gave us hands-on experience in turning a realistic operational problem into a working full-stack system. If we continued the project beyond the course, the next logical directions would be payment support, attendee notifications, stronger automated testing, and more advanced organizer analytics.

---

## 11. References

[1] S. G. Powell, K. R. Baker, and B. Lawson, “A critical review of the literature on spreadsheet errors,” *Decision Support Systems*, vol. 46, no. 1, pp. 128–138, Dec. 2008.

[2] R. R. Panko, “Spreadsheet Errors: What We Know. What We Think We Can Do,” *arXiv preprint* arXiv:0802.3457, Feb. 2008.

[3] Eventbrite, “How to check in attendees at the event with Eventbrite Organizer,” *Eventbrite Help Center*.

[4] Eventbrite, “Pricing and features for organizers (Canada),” *Eventbrite Organizer Pricing*.

[5] Ticket Fairy, “Preventing Ticket Fraud and Scalping at Festivals,” Jul. 11, 2025, updated Jan. 22, 2026.
