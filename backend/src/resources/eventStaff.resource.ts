import { Router, Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router({ mergeParams: true });

// GET /events/:eventId/staff (Organizer only)
router.get(
  "/",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const staff = await eventStaffService.listStaff(req.params.eventId);
      // res.json(staff);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

// POST /events/:eventId/staff (Organizer only)
router.post(
  "/",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const staff = await eventStaffService.addStaff(req.params.eventId, req.user!.userId, req.body);
      // res.status(201).json(staff);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /events/:eventId/staff/:userId (Organizer only)
router.delete(
  "/:userId",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // await eventStaffService.removeStaff(req.params.eventId, req.user!.userId, req.params.userId);
      // res.status(204).send();
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
