# TicketGate

TicketGate is a full-stack web application for event ticketing and QR-based check-in. It supports three user roles—Organizer, Staff, and Attendee—and provides an end-to-end workflow from event creation to ticket claiming, ticket validation, and live attendance tracking.

---

## 1. Team Information

- **Ruifan Wu** — Student Number: `[TODO]` — Email: `[TODO]`
- **Yuye Huang** — Student Number: `[TODO]` — Email: `[TODO]`
- **Jenny You** — Student Number: `[TODO]` — Email: `[TODO]`
- **Jasmine Shao** — Student Number: 1007147204 — Email: jasmine.shao@mail.utoronto.ca

---

## 2. Motivation

Small event organizers such as student clubs, hobby groups, and campus communities often still rely on Google Forms, spreadsheets, and manual check-in. This workflow becomes fragile at the exact moment reliability matters most: peak arrivals. Staff may need to search names manually, resolve registration issues at the door, and update attendance by hand. This can cause long entry lines, ticket misuse, duplicate entry, and poor live visibility into attendance.

This problem is worth solving because a full-stack ticketing and check-in platform directly improves the highest-friction operational moment in in-person events. For organizers, it improves throughput, attendance visibility, and event management. For staff, it provides immediate validation feedback. For attendees, it shortens entry time and reduces confusion around ticket status.

This project was also a strong fit for the course because the real-world workflow naturally requires the course’s core skills: authenticated access control, relational database design, cloud-based file handling, and real-time updates. The spreadsheet-error literature also shows that spreadsheet mistakes are common enough to represent real operational risk in practice.[1][2]

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

The main objective of TicketGate was to build a complete event workflow with the following path:

**create event → configure ticket type → assign staff → claim ticket → generate QR/token → validate at entry → record check-in → update live dashboard**

More specifically, our team aimed to:

- support authenticated access for Organizer, Staff, and Attendee roles
- allow organizers to create and edit events
- allow organizers to configure ticket types for each event
- allow attendees to claim tickets and view them in **My Tickets**
- support secure one-time validation using an opaque QR/token value
- prevent duplicate ticket use
- show live attendance information in a real-time dashboard
- support cloud-based file handling for event poster assets

To keep the project manageable, we focused on the core lifecycle and intentionally kept payments, discount codes, email notifications, advanced analytics, and other larger platform features out of scope for the MVP.

---

## 4. Technical Stack

Our implementation follows a **separate frontend and backend architecture**.

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit
- Axios
- React Router
- Socket.IO client

### Backend

- Express.js
- TypeScript
- Prisma ORM
- JWT-based authentication and authorization middleware
- Socket.IO for real-time updates
- Swagger / OpenAPI documentation

### Database and Storage

- PostgreSQL for relational data
- S3-compatible object storage for event poster file handling
- `[TODO: add exact local/dev storage service if used, e.g. MinIO]`

### Architectural Approach

The backend uses a three-layer structure:

- **Resources / routes** for HTTP endpoints
- **Services** for application logic
- **Clients** for database and storage access

This separation helped keep the codebase organized and made it easier to debug, test, and extend features.

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

AI tools were used as development support tools rather than as a source of unverified final answers. The main areas where AI contributed were:
- architecture and scope clarification
- debugging frontend and backend integration issues
- route and API naming consistency
- documentation drafting and cleanup
- edge-case discussion for scanner and validation logic

One representative limitation was that AI sometimes suggested code or library usage that did not match our actual environment or dependency versions. For example, some scanner-library suggestions conflicted with our React version and had to be rejected or replaced after verification.

We verified correctness through:
- manual end-to-end testing across Organizer, Staff, and Attendee flows
- checking logs and API behavior during debugging
- validating role-based access restrictions
- checking dashboard updates against persisted check-in results
- running the available frontend tests and local integration checks

See **`ai-session.md`** for concrete examples of AI usage, mistakes, and follow-up verification.

---

## 9. Individual Contributions

### Ruifan Wu
- Led the backend foundation and core integration work.
- Implemented authentication and authorization support, including backend middleware for protected access control.
- Built core backend support for event-related APIs and services, including event CRUD and organizer-facing backend logic.
- Helped maintain consistent backend structure, endpoint behavior, and integration across modules.

### Yuye Huang
- Focused on the ticket and check-in workflow.
- Implemented ticket claim logic and attendee-side ticket pages, including My Tickets and ticket detail display.
- Built the validation flow for scanner results, including support for success, already used, invalid ticket, wrong event, and cancelled states.
- Helped test and verify the end-to-end ticket lifecycle and duplicate-prevention behavior.

### Jenny You
- Focused on advanced features and organizer-side operational tools.
- Implemented real-time functionality for the live dashboard using Socket.IO.
- Worked on file-handling support and event asset integration, including poster-related storage flow.
- Built organizer-facing staff assignment and dashboard functionality, and contributed to ticket-type and organizer operations support.
- Helped maintain API documentation and final QA and integration checks.

### Jasmine Shao
- Built the frontend shell, routing structure, and shared client-side setup.
- Implemented login/register flow integration, protected routes, and the main organizer and public event pages.
- Worked on the core event-related frontend experience, including event list, event detail, create event, and edit event pages.
- Contributed to later frontend polish and integration work, including scanner-page improvements, ticket-type management flow updates, and role-based page consistency.

`[TODO: adjust if needed]`

---

## 10. Lessons Learned and Concluding Remarks

This project helped us understand how much coordination is required to build even a focused full-stack system with multiple user roles. A workflow that appears simple from the outside—create event, claim ticket, check in attendee—requires many connected parts behind the scenes: relational modeling, route protection, event-specific permissions, frontend state handling, real-time updates, and file integration.

One major lesson was that keeping the scope focused was important. Our proposal intentionally kept payments, waitlists, advanced analytics, and other larger features out of the MVP so that we could first deliver a stable end-to-end workflow. That decision helped us prioritize the most important path: event creation, ticket issuance, validation, and dashboard updates.

We also learned that backend authorization must remain the real source of truth, especially for event-specific actions such as dashboard access and ticket validation. Another practical lesson was that real-time features and camera-based scanning are often less difficult in theory than in browser and device behavior, so stable fallback behavior matters.

Overall, TicketGate achieved the main goals set out in our proposal: a separate React + Express architecture, role-based access control, ticket lifecycle support, event-specific validation, and real-time attendance visibility.

---

## 11. References

[1] S. G. Powell, K. R. Baker, and B. Lawson, “A critical review of the literature on spreadsheet errors,” *Decision Support Systems*, vol. 46, no. 1, pp. 128–138, Dec. 2008.

[2] R. R. Panko, “Spreadsheet Errors: What We Know. What We Think We Can Do,” *arXiv preprint* arXiv:0802.3457, Feb. 2008.

[3] Eventbrite, “How to check in attendees at the event with Eventbrite Organizer,” *Eventbrite Help Center*.

[4] Eventbrite, “Pricing and features for organizers (Canada),” *Eventbrite Organizer Pricing*.

[5] Ticket Fairy, “Preventing Ticket Fraud and Scalping at Festivals,” Jul. 11, 2025, updated Jan. 22, 2026.

