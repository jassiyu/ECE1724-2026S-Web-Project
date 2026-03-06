# Team Task Breakdown (4 People)

This document assigns the current scaffold TODOs to 4 team members with high parallelism and low merge conflict risk.

---

## 1) Ruifan — Backend Core (Auth + Event)

### Scope
- Build backend foundation and access control.
- Ensure auth and event APIs are available for frontend integration.

### Files
- `backend/src/middleware/auth.middleware.ts`
- `backend/src/middleware/role.middleware.ts`
- `backend/src/middleware/error.middleware.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/resources/auth.resource.ts`
- `backend/src/services/event.service.ts`
- `backend/src/resources/event.resource.ts`
- `backend/src/clients/user.client.ts`
- `backend/src/clients/event.client.ts`

### Deliverables
- Working auth flow: register/login/me/logout.
- JWT verification and role guard middleware.
- Event CRUD and dashboard base endpoint.
- Consistent backend error response shape.

---

## 2) Siyu — Frontend Core (Shell + Auth + Events)

### Scope
- Build app shell, route system, and login state flow.
- Implement organizer/public event pages for core navigation.

### Files
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/api/client.ts`
- `frontend/src/api/auth.api.ts`
- `frontend/src/api/events.api.ts`
- `frontend/src/store/index.ts`
- `frontend/src/store/hooks.ts`
- `frontend/src/store/slices/authSlice.ts`
- `frontend/src/store/slices/eventSlice.ts`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/EventListPage.tsx`
- `frontend/src/pages/EventDetailPage.tsx`
- `frontend/src/pages/CreateEventPage.tsx`
- `frontend/src/pages/EditEventPage.tsx`

### Deliverables
- Protected routes and role-based route guards.
- Login/register page behavior wired with API.
- Event list/detail/create/edit pages connected to backend.
- Stable base navigation for all roles.

---

## 3) Yuye — Ticket + Check-In Flow

### Scope
- Deliver end-to-end attendee claim and staff validation flow.
- Focus on scanner behavior and duplicate prevention states.

### Files
- `backend/src/services/ticket.service.ts`
- `backend/src/resources/ticket.resource.ts`
- `backend/src/services/checkin.service.ts`
- `backend/src/resources/checkin.resource.ts`
- `backend/src/clients/ticket.client.ts`
- `backend/src/clients/checkin.client.ts`
- `backend/src/clients/ticketType.client.ts`
- `frontend/src/api/tickets.api.ts`
- `frontend/src/api/checkins.api.ts`
- `frontend/src/store/slices/scanSlice.ts`
- `frontend/src/pages/MyTicketsPage.tsx`
- `frontend/src/pages/TicketDetailPage.tsx`
- `frontend/src/pages/ScannerPage.tsx`

### Deliverables
- Ticket claim and "My Tickets" API flow.
- Check-in validate API with outcomes:
  - `success`
  - `already_used`
  - `invalid_ticket`
  - `wrong_event`
  - `cancelled`
- Scanner UI with clear validation feedback and manual fallback input.

---

## 4) Jenny — Realtime + Files + Staff Ops

### Scope
- Implement advanced features (Socket.IO + file storage).
- Build organizer operation pages (staff assignment + dashboard realtime).

### Files
- `backend/src/socket/index.ts`
- `backend/src/services/file.service.ts`
- `backend/src/resources/file.resource.ts`
- `backend/src/clients/file.client.ts`
- `backend/src/clients/s3.client.ts`
- `backend/src/services/eventStaff.service.ts`
- `backend/src/resources/eventStaff.resource.ts`
- `backend/src/services/ticketType.service.ts`
- `backend/src/resources/ticketType.resource.ts`
- `frontend/src/socket/index.ts`
- `frontend/src/api/files.api.ts`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/StaffManagementPage.tsx`

### Deliverables
- Event room realtime updates for check-ins.
- Presigned file upload/download flow for posters.
- Staff assignment management pages and APIs.
- Dashboard realtime counters and recent scan feed.

---

## Suggested Execution Order

1. **Ruifan + Siyu first**: auth/event baseline and route shell.
2. **Yuye in parallel**: ticket/check-in once auth/event is reachable.
3. **Jenny after check-in path stabilizes**: realtime and file integration.

---

## Git Branch Strategy

- Ruifan: `feat/backend-auth-events`
- Siyu: `feat/frontend-auth-events`
- Yuye: `feat/ticket-checkin-flow`
- Jenny: `feat/realtime-files-dashboard`

Recommended:
- Sync `main` daily.
- Keep PRs small (single module or single flow).
- Merge backend contracts before frontend final wiring.
