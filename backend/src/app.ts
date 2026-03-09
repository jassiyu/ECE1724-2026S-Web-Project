import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware/error.middleware";
import authResource from "./resources/auth.resource";
import eventResource from "./resources/event.resource";
import eventStaffResource from "./resources/eventStaff.resource";
import ticketTypeResource from "./resources/ticketType.resource";
import ticketResource, {
  eventTicketsRouter,
  singleTicketRouter,
} from "./resources/ticket.resource";
import checkinResource from "./resources/checkin.resource";
import fileResource from "./resources/file.resource";

const app = express();

// ─── Global Middleware ───────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────
app.use("/auth", authResource);
app.use("/events", eventResource);
app.use("/events/:eventId/staff", eventStaffResource);
app.use("/events/:eventId/ticket-types", ticketTypeResource);
app.use("/events/:eventId/tickets", eventTicketsRouter);
app.use("/events/:eventId/checkins", checkinResource);
app.use("/me/tickets", ticketResource);
app.use("/tickets", singleTicketRouter);
app.use("/files", fileResource);

// ─── Health Check ────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Error Handler (must be last) ────────────────────────
app.use(errorHandler);

export default app;
