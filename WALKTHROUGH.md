# Architecture Walkthrough

## Overall Structure

This is a monorepo with two sub-projects:

```
ECE1724-2026S-Web-Project/
├── frontend/          # React + TypeScript + Tailwind + shadcn/ui
├── backend/           # Express + TypeScript + Prisma + Socket.IO
├── docker-compose.yml # PostgreSQL for local dev
└── .gitignore
```

---

## Backend Layered Architecture (Resource → Service → Client)

Every HTTP request follows this processing chain:

```
HTTP Request
  → Middleware (auth / role check)
    → Resource (route handler, parse request)
      → Service (business logic, validation)
        → Client (data access, Prisma / S3)
          → PostgreSQL / S3
```

### Layer Responsibilities

#### 1) Resource Layer (`backend/src/resources/`)

Equivalent to a Controller. Each resource file exports an Express `Router`.

A resource handler does exactly three things:
1. Extract params / body / user from the Request
2. Call the corresponding Service method
3. Return the Response

**No business logic lives here.**

Example (`event.resource.ts`):
```
POST /events        → eventService.createEvent(req.user.id, req.body)
GET  /events/:id    → eventService.getEvent(req.params.id)
GET  /events/:id/dashboard → eventService.getDashboard(req.params.id)
```

Resources are mounted in `app.ts`:
```typescript
app.use('/auth', authResource);
app.use('/events', eventResource);
app.use('/me', ticketResource);
app.use('/files', fileResource);
```

#### 2) Service Layer (`backend/src/services/`)

All business rules live here. Services:
- **Do not know about HTTP** — never touch `req` / `res`
- **Do not know about Prisma** — never write queries directly
- Read/write data through the Client layer
- Throw `AppError` on validation failures

Example interface (`ICheckinService`):
```typescript
interface ICheckinService {
  validateAndCheckIn(eventId: string, qrToken: string, staffId: string): Promise<CheckInResultDTO>;
  getRecentCheckIns(eventId: string, limit?: number): Promise<CheckInDTO[]>;
}
```

A check-in validation involves multiple clients:
1. `ticketClient.findByQrToken(token)` — look up the ticket
2. Verify `ticket.eventId === eventId` — business rule
3. Verify `ticket.status === 'valid'` — business rule
4. `checkinClient.findByTicketId(ticketId)` — check for duplicate
5. `checkinClient.create(...)` — write check-in record
6. `socket.to(room).emit('checkin:new')` — broadcast to dashboard

#### 3) Client Layer (`backend/src/clients/`)

Thin data-access wrappers. One client per domain entity, plus two special clients:
- `prisma.client.ts` — global singleton `PrismaClient`
- `s3.client.ts` — AWS SDK wrapper for pre-signed URLs

**No business logic.** Only CRUD + simple queries.

Example interface (`ITicketClient`):
```typescript
interface ITicketClient {
  findById(id: string): Promise<Ticket | null>;
  findByQrToken(qrToken: string): Promise<Ticket | null>;
  findByOwner(ownerId: string): Promise<Ticket[]>;
  create(data: CreateTicketData): Promise<Ticket>;
  updateStatus(id: string, status: TicketStatus): Promise<Ticket>;
}
```

### Why This Layering

- **Testability**: Service layer can be unit-tested by mocking Clients — no real database needed.
- **Separation of concerns**: Changing a Prisma query doesn't affect routing; changing a business rule doesn't affect data access.
- **Reusability**: A single Service can orchestrate multiple Clients (e.g., check-in service touches both ticket and checkin clients).

---

## Middleware

Executed before Resources. Three files:

| File | Responsibility |
|------|---------------|
| `auth.middleware.ts` | Verify JWT, attach `{ id, email, role }` to `req.user` |
| `role.middleware.ts` | `requireRole('organizer', 'staff')` — check `req.user.role` |
| `error.middleware.ts` | Global error handler: catch `AppError` → structured JSON response |

Usage in a Resource:
```typescript
router.post('/', requireAuth, requireRole('organizer'), async (req, res, next) => { ... });
```

---

## Database (Prisma Schema)

Seven tables, matching the Proposal:

| Table | Key Fields | Notes |
|-------|-----------|-------|
| **User** | id, email, passwordHash, role | Role enum: ORGANIZER / STAFF / ATTENDEE |
| **Event** | id, organizerId→User, title, capacity, posterFileId | Core entity |
| **EventStaff** | eventId + userId (composite unique) | Many-to-many |
| **TicketType** | id, eventId, name, priceCents, quantity, salesWindow | Ticket category |
| **Ticket** | id, eventId, ticketTypeId, ownerId, status, qrToken (unique) | One person one ticket |
| **CheckIn** | id, ticketId (unique), eventId, checkedInBy, checkedInAt | Unique ticketId prevents duplicates |
| **FileObject** | id, ownerId, bucketKey, mimeType, sizeBytes | S3 file metadata |

The `CheckIn.ticketId` unique constraint is the database-level guarantee against duplicate check-ins.

---

## Socket.IO (Real-Time)

### Server (`backend/src/socket/index.ts`)
- Uses event room pattern: each event gets room `event:{eventId}`
- Staff / Organizer join the corresponding room on connect
- On successful check-in, the Service broadcasts to the room:
  - New check-in record
  - Updated attendance count

### Client (`frontend/src/socket/index.ts`)
- Connects and joins room for the active event
- Dashboard page listens for `checkin:new` events to update in real-time

---

## Frontend Architecture

### API Layer (`frontend/src/api/`)

- `client.ts` — Axios instance with `baseURL`, request interceptor (attach JWT), response interceptor (handle 401)
- One file per domain with typed functions:

```typescript
// events.api.ts
export const getEvents = (): Promise<EventDTO[]> => client.get('/events');
export const createEvent = (data: CreateEventInput): Promise<EventDTO> => client.post('/events', data);
```

### Redux Store (`frontend/src/store/`)

Redux Toolkit for UI state:
- `authSlice` — current user, token
- `eventSlice` — filters, selected event context
- `scanSlice` — recent scan results (for Staff scanner page)

### Pages (`frontend/src/pages/`)

| Page | Role | Route |
|------|------|-------|
| EventListPage | Public | `/events` |
| EventDetailPage | Public | `/events/:id` |
| CreateEventPage | Organizer | `/events/new` |
| EditEventPage | Organizer | `/events/:id/edit` |
| DashboardPage | Organizer/Staff | `/events/:id/dashboard` |
| StaffManagementPage | Organizer | `/events/:id/staff` |
| MyTicketsPage | Attendee | `/my-tickets` |
| TicketDetailPage | Attendee | `/my-tickets/:id` |
| ScannerPage | Staff | `/scan/:eventId` |
| LoginPage | Public | `/login` |
| RegisterPage | Public | `/register` |

---

## Docker Compose

Single PostgreSQL container for local development:

```yaml
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: ticketing
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
```

Backend `.env`: `DATABASE_URL=postgresql://dev:dev@localhost:5432/ticketing`

---

## End-to-End Example: Staff Scans a QR Code

```
1. Staff scans QR → frontend extracts qrToken
2. Frontend: POST /events/:eventId/checkins/validate { qrToken }
3. → auth.middleware verifies JWT
4. → role.middleware verifies role is STAFF
5. → checkin.resource.ts parses request, calls checkinService.validateAndCheckIn()
6. → checkinService:
     a. ticketClient.findByQrToken(token)    → look up ticket
     b. check ticket.eventId === eventId     → business rule
     c. check ticket.status === 'valid'      → business rule
     d. checkinClient.findByTicketId(id)     → duplicate check
     e. checkinClient.create(...)            → write check-in
     f. socket.to(room).emit('checkin:new')  → real-time broadcast
7. → resource returns { status: 'success', ticket, checkIn }
8. → Frontend displays "Valid ✓"
9. → Dashboard receives socket event, updates attendance count live
```
