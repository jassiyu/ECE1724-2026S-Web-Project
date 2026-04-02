## 2. Motivation

### 2.1 Operational Problem

TicketGate was developed to address a common operational weakness in small- to medium-scale event management: the dependence on manual registration lists, spreadsheets, and informal check-in procedures during periods of peak attendee arrival. While such methods may be workable for low-volume events, they become unreliable when organizers must confirm ticket validity quickly, resolve registration disputes at the door, and maintain an accurate count of attendees in real time. In these conditions, delays, duplicate entry, inconsistent records, and limited situational awareness can significantly reduce the quality and reliability of event operations.

### 2.2 Project Significance

Our team selected this project because it represents a practical engineering problem with clear real-world value and well-defined technical challenges. A QR-based ticketing and check-in platform offers a direct improvement over manual workflows by enabling faster entry, clearer validation outcomes, and immediate visibility into attendance status. This benefits all primary stakeholders: organizers gain stronger control over event operations and reporting, staff receive a simple and unambiguous validation workflow, and attendees experience a more efficient and less error-prone entry process.

### 2.3 Relevance to the Course and Existing Practice

The project was also well aligned with the learning objectives of the course. Implementing TicketGate required the integration of several core full-stack engineering concepts within a single system, including authenticated multi-role access control, relational data modeling, secure API design, file upload and retrieval, and real-time communication between clients and the server. Rather than building an abstract demonstration, the team aimed to produce a cohesive application centered on a realistic operational workflow with clear functional requirements and measurable outcomes. The spreadsheet-error literature further supports the decision to move beyond manual spreadsheet-based operations, while current commercial ticketing platforms and anti-fraud guidance reinforce the value of QR-based validation with server-side checking [1], [2]. Commercial platforms demonstrate that this workflow is effective in practice, but they may be less attractive to smaller organizers because of fees and limited customization [3], [4]. Likewise, fraud-prevention guidance highlights the importance of database-backed validation and duplicate detection rather than static QR lists alone [5].

---

## 3. Objectives

### 3.1 Overall Project Objective

The primary objective of TicketGate was to design and implement a complete, end-to-end event ticketing workflow that supports the major roles involved in event operations: Organizer, Staff, and Attendee. The intended workflow begins with event creation and ticket-type configuration, continues through ticket claiming and QR-code issuance, and concludes with ticket validation, duplicate prevention, and live attendance monitoring during check-in.

### 3.2 Functional Objectives

To achieve this objective, the team defined several concrete implementation goals for the minimum viable product. First, the system needed to enforce authenticated and role-aware access so that each user could only perform actions appropriate to their responsibilities. Second, organizers needed tools to create and manage events, configure ticket types, assign staff, and monitor attendance. Third, attendees needed a clear flow for claiming tickets and retrieving them later through a persistent “My Tickets” interface. Finally, staff required a reliable validation interface capable of distinguishing successful scans from invalid, duplicate, cancelled, or wrong-event tickets.

### 3.3 Design and Scope Objectives

A further objective was to ensure that the system architecture remained modular and maintainable. The project was therefore structured so that routing, business logic, persistence, authentication, file handling, and real-time communication were separated into clear layers. This was intended not only to support correctness and easier debugging during development, but also to make the application extensible for future enhancements such as payments, notifications, analytics, or more advanced event-management features. At the same time, the team deliberately kept those features out of scope in order to prioritize stability and correctness in the core ticket lifecycle.

---

## 4. Technical Stack

### 4.1 Architectural Approach

TicketGate was implemented using a separated **`frontend-backend architecture`** based on the **`Express.js backend option`**. This design was chosen to provide a clean division of responsibilities between user interface concerns, API logic, persistent data storage, and real-time event updates. The resulting architecture more closely reflects a production-style web system and was particularly suitable for a project with multiple user roles, event-specific authorization rules, and direct file-upload workflows.

### 4.2 Frontend Technologies

On the frontend, the application uses **`React 19`** with **`TypeScript`** to provide a typed, component-based user interface. **`Vite`** is used for development and build tooling, while **`React Router`** supports page routing and protected navigation. Shared client-side state is managed with **`Redux Toolkit`**, and **`Axios`** is used for communication with the backend API. For styling, the project uses **`Tailwind CSS v4`**. Real-time updates on organizer dashboards are delivered through the **`Socket.IO client`**, and staff-side QR scanning is supported using `@zxing/browser`, with manual token entry retained as a fallback for robustness.

### 4.3 Backend Technologies

On the backend, the system is built with **`Express.js`** and **`TypeScript`**. Persistent application data is managed through **`PostgreSQL`**, accessed using **`Prisma ORM`** for typed schema-driven development. Authentication is implemented using **`JWT`**, with `bcryptjs` used for password hashing and **`Zod`** used for request validation. Real-time communication is handled through **`Socket.IO`**, allowing authorized users to receive event-specific dashboard updates without refreshing the page.

### 4.4 Database, Storage, and Local Development Infrastructure

For storage and deployment-related infrastructure, the project uses **`S3-compatible object storage`** for event poster uploads and downloads, integrated through **`AWS SDK v3`** and presigned upload/download URLs. In local development, this storage flow can be backed by a **`MinIO-compatible endpoint`**. Development setup requires Node.js 18+ and **`PostgreSQL`**, and the local environment uses separate frontend and backend services, with the frontend proxying API and **`Socket.IO`** traffic to the backend. This stack allowed the team to implement authenticated APIs, relational persistence, cloud-style file handling, and live operational updates within one coherent full-stack application.
