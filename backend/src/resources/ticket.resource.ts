import { Router, Response, NextFunction } from "express";
import { AppError, AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { ticketService } from "../services/ticket.service";

const router = Router();

// POST /events/:eventId/tickets (Attendee only) — mounted under /events/:eventId/tickets
export const eventTicketsRouter = Router({ mergeParams: true });

eventTicketsRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.ATTENDEE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventParam = req.params.eventId;
      const eventId = Array.isArray(eventParam) ? eventParam[0] : eventParam;
      if (!eventId) {
        throw AppError.badRequest("Missing eventId");
      }

      const ticket = await ticketService.claimTicket(
        eventId,
        req.user!.userId,
        req.body
      );
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  }
);

// GET /me/tickets (Attendee)
router.get(
  "/",
  requireAuth,
  requireRole(UserRole.ATTENDEE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const tickets = await ticketService.getMyTickets(req.user!.userId);
      res.json(tickets);
    } catch (err) {
      next(err);
    }
  }
);

// GET /tickets/:ticketId
export const singleTicketRouter = Router();

singleTicketRouter.get(
  "/:ticketId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ticketParam = req.params.ticketId;
      const ticketId = Array.isArray(ticketParam) ? ticketParam[0] : ticketParam;
      if (!ticketId) {
        throw AppError.badRequest("Missing ticketId");
      }

      const ticket = await ticketService.getTicket(
        ticketId,
        req.user!.userId
      );
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
