import { Router, Response, NextFunction } from "express";
import { AppError, AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { eventService } from "../services/event.service";

const router = Router();

// GET /events
router.get(
  "/",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        upcoming: req.query.upcoming === "true" ? true : undefined,
        organizerId: req.query.organizerId as string | undefined,
      };
      const events = await eventService.listEvents(filters);
      res.json(events);
    } catch (err) {
      next(err);
    }
  }
);

// GET /events/:eventId
router.get(
  "/:eventId",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const event = await eventService.getEvent(req.params.eventId as string);
      res.json(event);
    } catch (err) {
      next(err);
    }
  }
);

// POST /events (Organizer only)
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const event = await eventService.createEvent(req.user!.userId, req.body);
      res.status(201).json(event);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /events/:eventId (Organizer only)
router.put(
  "/:eventId",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const event = await eventService.updateEvent(
        req.params.eventId as string,
        req.user!.userId,
        req.body
      );
      res.json(event);
    } catch (err) {
      next(err);
    }
  }
);

// GET /events/:eventId/dashboard (Organizer or Staff)
router.get(
  "/:eventId/dashboard",
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.STAFF),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventParam = req.params.eventId;
      const eventId = Array.isArray(eventParam) ? eventParam[0] : eventParam;
      if (!eventId) {
        throw AppError.badRequest("Missing eventId");
      }

      const dashboard = await eventService.getDashboard(eventId, {
        userId: req.user!.userId,
        role: req.user!.role,
      });
      res.json(dashboard);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
