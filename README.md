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

TicketGate was developed to address a common operational weakness in small- to medium-scale event management: the dependence on manual registration lists, spreadsheets, and informal check-in procedures during periods of peak attendee arrival. While such methods may be workable for low-volume events, they become unreliable when organizers must confirm ticket validity quickly, resolve registration disputes at the door, and maintain an accurate count of attendees in real time. In these conditions, delays, duplicate entry, inconsistent records, and limited situational awareness can significantly reduce the quality and reliability of event operations.

Our team selected this project because it represents a practical engineering problem with clear real-world value and well-defined technical challenges. A QR-based ticketing and check-in platform offers a direct improvement over manual workflows by enabling faster entry, clearer validation outcomes, and immediate visibility into attendance status. This benefits all primary stakeholders: organizers gain stronger control over event operations and reporting, staff receive a simple and unambiguous validation workflow, and attendees experience a more efficient and less error-prone entry process.

The project was also well aligned with the learning objectives of the course. Implementing TicketGate required the integration of several core full-stack engineering concepts within a single system, including authenticated multi-role access control, relational data modeling, secure API design, file upload and retrieval, and real-time communication between clients and the server. Rather than building an abstract demonstration, the team aimed to produce a cohesive application centered on a realistic operational workflow with clear functional requirements and measurable outcomes. The spreadsheet-error literature further supports the decision to move beyond manual spreadsheet-based operations, while current commercial ticketing platforms and anti-fraud guidance reinforce the value of QR-based validation with server-side checking [1], [2]. Commercial platforms demonstrate that this workflow is effective in practice, but they may be less attractive to smaller organizers because of fees and limited customization [3], [4]. Likewise, fraud-prevention guidance highlights the importance of database-backed validation and duplicate detection rather than static QR lists alone [5].

---

## 3. Objectives

The primary objective of TicketGate was to design and implement a complete, end-to-end event ticketing workflow that supports the major roles involved in event operations: Organizer, Staff, and Attendee. The intended workflow begins with event creation and ticket-type configuration, continues through ticket claiming and QR-code issuance, and concludes with ticket validation, duplicate prevention, and live attendance monitoring during check-in.

To achieve this objective, the team defined several concrete implementation goals for the minimum viable product. First, the system needed to enforce authenticated and role-aware access so that each user could only perform actions appropriate to their responsibilities. Second, organizers needed tools to create and manage events, configure ticket types, assign staff, and monitor attendance. Third, attendees needed a clear flow for claiming tickets and retrieving them later through a persistent “My Tickets” interface. Finally, staff required a reliable validation interface capable of distinguishing successful scans from invalid, duplicate, cancelled, or wrong-event tickets.

A further objective was to ensure that the system architecture remained modular and maintainable. The project was therefore structured so that routing, business logic, persistence, authentication, file handling, and real-time communication were separated into clear layers. This was intended not only to support correctness and easier debugging during development, but also to make the application extensible for future enhancements such as payments, notifications, analytics, or more advanced event-management features. At the same time, the team deliberately kept those features out of scope in order to prioritize stability and correctness in the core ticket lifecycle.

---

## 4. Technical Stack

TicketGate was implemented using a separated frontend-backend architecture based on the Express.js backend option. This design was chosen to provide a clean division of responsibilities between user interface concerns, API logic, persistent data storage, and real-time event updates. The resulting architecture more closely reflects a production-style web system and was particularly suitable for a project with multiple user roles, event-specific authorization rules, and direct file-upload workflows.

On the frontend, the application uses React 19 with TypeScript to provide a typed, component-based user interface. Vite is used for development and build tooling, while React Router supports page routing and protected navigation. Shared client-side state is managed with Redux Toolkit, and Axios is used for communication with the backend API. For styling, the project uses Tailwind CSS v4. Real-time updates on organizer dashboards are delivered through the Socket.IO client, and staff-side QR scanning is supported using @zxing/browser, with manual token entry retained as a fallback for robustness.

On the backend, the system is built with Express.js and TypeScript. Persistent application data is managed through PostgreSQL, accessed using Prisma ORM for typed schema-driven development. Authentication is implemented using JWT, with bcryptjs used for password hashing and Zod used for request validation. Real-time communication is handled through Socket.IO, allowing authorized users to receive event-specific dashboard updates without refreshing the page.

For storage and deployment-related infrastructure, the project uses S3-compatible object storage for event poster uploads and downloads, integrated through AWS SDK v3 and presigned upload/download URLs. In local development, this storage flow can be backed by a MinIO-compatible endpoint. Development setup requires Node.js 18+ and PostgreSQL, and the local environment uses separate frontend and backend services, with the frontend proxying API and Socket.IO traffic to the backend. This stack allowed the team to implement authenticated APIs, relational persistence, cloud-style file handling, and live operational updates within one coherent full-stack application.


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

This feature provides role-based authentication and authorization across the system and protects both frontend routes and backend APIs.

### 5.2 Event Management

Organizers can create and edit events with:
- title
- description
- venue
- start time
- end time
- capacity
- poster file reference

This supports the organizer-side event lifecycle and provides the core event CRUD functionality required by the system.

### 5.3 Ticket Type Management

Organizers can create ticket types for an event, including:
- ticket type name
- price
- quantity
- sales start time
- sales end time

This supports the organizer-side setup flow by allowing ticket configuration before attendees claim tickets.

### 5.4 Ticket Claiming and QR / Token Issuance

Attendees can claim a ticket from the event detail page. After claiming, the ticket appears in **My Tickets**, and the ticket detail page shows the ticket information and QR/token content.

The current implementation uses a free-claim model rather than full payment processing. Payment and refund flows were intentionally kept out of scope to keep the main event lifecycle stable. Ticket QR/token values are validated server-side during check-in to support secure one-time entry.

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

This feature enforces one-time ticket validation and prevents duplicate entry during event check-in.

### 5.6 Scanner Page with Camera and Manual Fallback

The staff scanner page supports both manual token entry and camera-based QR scanning. We kept manual input as a fallback so that the same backend validation logic still works even if camera scanning is unavailable on a specific device.

This improves staff-side usability by supporting both direct scanning and manual fallback input while reusing the same validation workflow.

### 5.7 Live Dashboard

The organizer dashboard displays:
- checked-in count
- event capacity
- tickets sold
- occupancy percentage
- recent scan feed

New check-ins and duplicate or invalid scan events are pushed in real time using Socket.IO. This gives organizers live operational visibility during check-in without requiring manual page refresh.

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

**Event Detail page**

<img src="Screenshots/event_details.png" width="400" />

**My Tickets page**

<img src="Screenshots/my_tickets.png" width="400" />

**Ticket Detail page**

<img src="Screenshots/ticket_details.png" width="400" />

### 6.3 Organizer Flow

1. Register or log in as an organizer.
2. Click **Create Event**.
3. Fill in the event information and save the event.
4. Open the event edit page.
5. Add one or more ticket types.
6. Assign staff members to the event by email.
7. Open the live dashboard to monitor attendance.

**Create Event page**

<img src="Screenshots/create_event.png" width="400" />

**Edit Event page**

<img src="Screenshots/edit_event.png" width="400" />

**Add Ticket type page**

<img src="Screenshots/add_ticket_type.png" width="400" />

**Staff Assignment page**

<img src="Screenshots/staff_assignment.png" width="400" />

**Organizer Dashboard**

<img src="Screenshots/live_dashboard.png" width="400" />

### 6.4 Staff Flow

1. Log in as a staff user.
2. Open the scanner page for the assigned event.
3. Either:
   - scan a QR code with the camera, or
   - paste or type the ticket token manually
4. The page will display one of the validation results, such as VALID or ALREADY USED.

**Scanner page**

<img src="Screenshots/scan_page.png" width="400" />

**Scanner VALID result**

<img src="Screenshots/valid_scan.png" width="400" />

**Scanner ALREADY USED result**

<img src="Screenshots/used_scan.png" width="400" />

### 6.5 Poster Flow

1. Organizer opens create or edit event.
2. Uploads a poster image file.
3. Saves the event.
4. Event detail page displays the uploaded poster.
5. The poster can be downloaded through the stored file reference.

**Poster Upload Form**
<img src="Screenshots/Poster_upload_form.png" width="400" />

**Poster Display and Download Display**
<img src="Screenshots/Poster_display_and_download.png" width="400" />

---

## 7. Development Guide

### 7.1 Prerequisites

- **Node.js 18+** and **npm**
- **PostgreSQL 16** (installed locally or via the bundled Docker Compose file)
- **MinIO** (or another S3-compatible service) for event poster upload and download

### 7.2 Clone and Install

```bash
git clone git@github.com:jassiyu/ECE1724-2026S-Web-Project.git
cd ECE1724-2026S-Web-Project
```

Install dependencies for both backend and frontend:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 7.3 Database Setup

The repository includes a `docker-compose.yml` that starts a PostgreSQL 16 instance:

```bash
docker compose up -d
```

This creates a database named `ticketing` with user `dev` and password `dev`, accessible at `localhost:5432`. If you prefer to use an existing PostgreSQL installation, create the database manually and adjust `DATABASE_URL` in the next step.

Once the database is running, generate the Prisma client and apply migrations:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

To inspect the database interactively:

```bash
npx prisma studio
```

To reset the database to a clean state (drops all data and re-applies migrations):

```bash
npx prisma migrate reset
```

### 7.4 Backend Configuration

Copy the example environment file and edit as needed:

```bash
cd backend
cp .env.example .env
```

The `.env.example` contains the following variables with sensible local defaults:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://dev:dev@localhost:5432/ticketing` | PostgreSQL connection string (matches Docker Compose) |
| `JWT_SECRET` | `change-me-in-production` | Secret used to sign and verify JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | JWT token expiration period |
| `PORT` | `3000` | Port the Express server listens on |
| `S3_ENDPOINT` | `http://localhost:9000` | S3-compatible endpoint (MinIO for local dev) |
| `S3_REGION` | `us-east-1` | S3 region |
| `S3_BUCKET` | `ticketing-assets` | Bucket name for poster file storage |
| `S3_ACCESS_KEY` | `minioadmin` | S3 access key (MinIO default) |
| `S3_SECRET_KEY` | `minioadmin` | S3 secret key (MinIO default) |

An optional variable `FRONTEND_URL` (default `http://localhost:5173`) controls the Socket.IO CORS origin. It does not need to be set during local development.

### 7.5 Cloud Storage Setup (Poster Upload)

Event poster upload and download rely on **presigned S3 URLs**. The backend generates a presigned `PUT` URL; the browser uploads the file directly to S3-compatible storage. Accepted MIME types are `image/png`, `image/jpeg`, and `application/pdf`, with a maximum size of **10 MiB**. File metadata is stored in the `FileObject` table and linked to the event record via `posterFileId`.

For local development, use **MinIO** as the S3-compatible storage backend.

**1. Start MinIO**

The simplest method is Docker:

```bash
docker run -d --name minio \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```

The S3 API is available at `http://localhost:9000` and the MinIO Console at `http://localhost:9001`.

**2. Create the bucket**

Open the MinIO Console (`http://localhost:9001`, login `minioadmin` / `minioadmin`), and create a bucket named `ticketing-assets` (matching `S3_BUCKET` in `.env`).

Alternatively, use the MinIO client CLI:

```bash
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/ticketing-assets
```

**3. Configure CORS on the bucket**

The browser performs a direct `PUT` to the presigned URL, so the bucket must allow cross-origin requests from the frontend origin. In the MinIO Console, navigate to **Buckets → ticketing-assets → Access Rules** and add a CORS rule allowing:

- **Origin:** `http://localhost:5173`
- **Methods:** `PUT`, `GET`
- **Headers:** `Content-Type`

Without this CORS rule, poster uploads from the browser will fail.

### 7.6 Running the Project Locally

Start the backend (from the `backend` directory):

```bash
npm run dev
```

Start the frontend in a separate terminal (from the `frontend` directory):

```bash
npm run dev
```

The Vite dev server proxies `/api/*` requests to the backend (stripping the `/api` prefix) and forwards `/socket.io` traffic with WebSocket support.

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:3000` |
| Health check | `http://localhost:3000/health` → `{"status":"ok"}` |
| MinIO Console | `http://localhost:9001` |

### 7.7 Testing and Verification

The frontend includes a Vitest test suite covering presigned upload API calls and Socket.IO helper functions:

```bash
cd frontend
npm test
```

For continuous test watching during development:

```bash
npm run test:watch
```

Linting:

```bash
npm run lint
```

Beyond automated tests, our team verified correctness through end-to-end user-flow testing across all three roles. The main tested flow was:

1. Organizer creates an event and uploads a poster
2. Organizer adds a ticket type
3. Organizer assigns staff
4. Attendee claims a ticket
5. Attendee views ticket detail and QR token
6. Staff validates the ticket (camera scan and manual token entry)
7. Organizer dashboard updates in real time

We also manually verified:
- duplicate scan returns `already_used`
- invalid or wrong-event tokens return the correct error status
- route and API protection for unauthorized roles
- staff assignment restrictions for event-specific actions
- poster upload failure displays an error message in the UI

### 7.8 Deployment Information

The repository does not include a pre-built deployment configuration (no Dockerfile for the application, no Vercel/Netlify manifests). For production deployment, the following steps apply.

**Build the backend:**

```bash
cd backend
npm run build
```

This compiles TypeScript to `backend/dist/`. The production entry point is:

```bash
node dist/server.js
```

The server port is controlled by the `PORT` environment variable.

**Build the frontend:**

```bash
cd frontend
npm run build
```

This produces a static SPA bundle in `frontend/dist/`. The built frontend can be served by any static hosting service or a reverse proxy such as Nginx.

**Production environment considerations:**

- Set `JWT_SECRET` to a strong, unique secret.
- Set `DATABASE_URL` to the production PostgreSQL connection string.
- Configure `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_REGION` for the production S3-compatible storage provider (e.g., AWS S3, DigitalOcean Spaces, or a self-hosted MinIO instance). The `S3_ENDPOINT` variable can be omitted when using standard AWS S3, as the SDK defaults to the official endpoint based on region.
- Set `FRONTEND_URL` to the production frontend origin so that Socket.IO CORS accepts connections from the correct domain.
- The frontend REST API calls use a relative base URL (`/api`). In production, a reverse proxy must rewrite `/api/*` to the backend (stripping the `/api` prefix), matching the same pattern used by the Vite dev proxy. The `/socket.io` path must also be forwarded with WebSocket upgrade support.
- If no `VITE_SOCKET_URL`, `VITE_API_BASE_URL`, or `VITE_BACKEND_URL` environment variable is set at build time, the frontend Socket.IO client defaults to `window.location.origin` in production builds, which works correctly when the frontend and backend share the same domain behind a reverse proxy.

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
