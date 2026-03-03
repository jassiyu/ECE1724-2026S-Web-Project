import { Router, Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router({ mergeParams: true });

// GET /events/:eventId/ticket-types (Public)
router.get(
  "/",
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const types = await ticketTypeService.listByEvent(req.params.eventId);
      // res.json(types);
      throw new Error("Not implemented");
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
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const type = await ticketTypeService.create(req.params.eventId, req.user!.userId, req.body);
      // res.status(201).json(type);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
