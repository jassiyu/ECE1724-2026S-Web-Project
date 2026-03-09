import { Router, Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// POST /events/:eventId/tickets (Attendee only) — mounted under /events/:eventId/tickets
export const eventTicketsRouter = Router({ mergeParams: true });

eventTicketsRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.ATTENDEE),
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const ticket = await ticketService.claimTicket(req.params.eventId, req.user!.userId, req.body);
      // res.status(201).json(ticket);
      throw new Error("Not implemented");
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
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const tickets = await ticketService.getMyTickets(req.user!.userId);
      // res.json(tickets);
      throw new Error("Not implemented");
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
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const ticket = await ticketService.getTicket(req.params.ticketId, req.user!.userId);
      // res.json(ticket);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
