# AI Interaction Record

The entries below document representative AI interactions that influenced the project in a meaningful way. They were selected because they show judgment, verification, and adaptation rather than trivial rewriting.

---

## Diagnosing QR scanner compatibility and fallback behavior
 
### Prompt (you sent to AI)

We are building a React + TypeScript + Vite event ticketing app. The staff page needs to scan QR codes in the browser, but we also want a manual token entry fallback in case camera access is unreliable. Which approach or library is safer for this stack, and how should we prevent the same QR code from triggering multiple validations while the camera is still active?
 
### AI Response (trimmed if long)
 
AI suggested using a browser-based QR scanning library with a simple video element, stopping the scanner after the first successful decode, and guarding repeated scans with a processing flag or ref. It also suggested a React wrapper package as a shortcut for camera integration.
 
### What Your Team Did With It
 
- The useful part was the control-flow advice: we kept the idea of stopping the scanner after a successful decode and preventing duplicate validation requests while one scan was already being processed.
- One suggested React wrapper was not a good fit for our actual frontend environment and dependency versions, so we did **not** adopt that recommendation directly.
- We verified alternatives against our project stack, chose `@zxing/browser`, kept manual token entry as a fallback, and tested both camera scanning and manual validation in the staff scanner flow.

---

## Structuring real-time dashboard updates with event-specific Socket.IO rooms
 
### Prompt (you sent to AI)

Our app has an organizer dashboard and a staff scanner flow for specific events. After a ticket is checked in, the dashboard should update in real time, but only for users who are allowed to view that event. Right now we are debating whether to broadcast all check-ins globally or organize them per event. What is the cleanest Socket.IO design for this?
 
### AI Response (trimmed if long)
 
AI recommended authenticating socket connections with JWT, placing authorized users into event-specific rooms, and emitting check-in events only to the room for the affected event. It also suggested keeping an initial REST fetch for dashboard state and then using real-time events for incremental updates.
 
### What Your Team Did With It
 
- The most useful suggestion was using event-specific rooms plus an initial dashboard fetch; that matched our need for access control and stable page loads.
- Some of the response was too generic, including ideas about adding more namespaces and abstraction than our project actually needed, so we simplified it.
- We implemented JWT-based socket auth, `join:event` / `leave:event` behavior, and room-scoped `checkin:new` events, then verified that authorized organizers and assigned staff could receive updates while unauthorized users were blocked.

---

## Designing poster upload with presigned URLs and database association
 
### Prompt (you sent to AI)
 
We want organizers to upload an event poster using S3-compatible storage in local development. The browser should upload directly to storage, but we still need a database record so the event can reference the file later. What is a clean flow for presigned upload, validation, and download?
 
### AI Response (trimmed if long)
 
AI suggested a presigned-upload pattern: validate file metadata on the backend, create a file record, return a temporary upload URL, upload the file directly from the browser, and keep a file ID that can later be associated with the event. It also mentioned a simpler alternative of storing raw file contents more directly in application storage.
 
### What Your Team Did With It
 
- The presigned-upload pattern was useful and aligned well with our architecture, so we adopted that general structure.
- The alternative of storing raw file contents directly in the application/database was not a good fit for our scope, so we rejected it.
- We added MIME-type and size checks, used the returned file ID as the event’s poster reference, and verified the flow through presign requests, upload error handling, and poster download/display in local development.
