import { Router, Response, NextFunction } from "express";
import { AppError, AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { ticketTypeService } from "../services/ticketType.service";

const router = Router({ mergeParams: true });

// GET /events/:eventId/ticket-types (Public)
router.get(
  "/",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventParam = req.params.eventId;
      const eventId = Array.isArray(eventParam) ? eventParam[0] : eventParam;
      if (!eventId) {
        throw AppError.badRequest("Missing eventId");
      }

      const types = await ticketTypeService.listByEvent(eventId);
      res.json(types);
    } catch (err) {
      next(err);
    }
  }
);

// POST /events/:eventId/ticket-types (Organizer only)
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventParam = req.params.eventId;
      const eventId = Array.isArray(eventParam) ? eventParam[0] : eventParam;
      if (!eventId) {
        throw AppError.badRequest("Missing eventId");
      }

      const type = await ticketTypeService.create(
        eventId,
        req.user!.userId,
        req.body
      );
      res.status(201).json(type);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
