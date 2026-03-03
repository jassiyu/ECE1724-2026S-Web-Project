import { Router, Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// GET /events
router.get(
  "/",
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const filters = { search: req.query.search, upcoming: req.query.upcoming };
      // const events = await eventService.listEvents(filters);
      // res.json(events);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

// GET /events/:eventId
router.get(
  "/:eventId",
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const event = await eventService.getEvent(req.params.eventId);
      // res.json(event);
      throw new Error("Not implemented");
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
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const event = await eventService.createEvent(req.user!.userId, req.body);
      // res.status(201).json(event);
      throw new Error("Not implemented");
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
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const event = await eventService.updateEvent(req.params.eventId, req.user!.userId, req.body);
      // res.json(event);
      throw new Error("Not implemented");
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
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const dashboard = await eventService.getDashboard(req.params.eventId);
      // res.json(dashboard);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
