import { Router, Response, NextFunction } from "express";
import { AppError, AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { eventStaffService } from "../services/eventStaff.service";

const router = Router({ mergeParams: true });

// GET /events/:eventId/staff (Organizer only)
router.get(
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

      const staff = await eventStaffService.listStaff(eventId, req.user!.userId);
      res.json(staff);
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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventParam = req.params.eventId;
      const eventId = Array.isArray(eventParam) ? eventParam[0] : eventParam;
      if (!eventId) {
        throw AppError.badRequest("Missing eventId");
      }

      const staff = await eventStaffService.addStaff(
        eventId,
        req.user!.userId,
        req.body
      );
      res.status(201).json(staff);
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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventParam = req.params.eventId;
      const eventId = Array.isArray(eventParam) ? eventParam[0] : eventParam;
      if (!eventId) {
        throw AppError.badRequest("Missing eventId");
      }

      const userParam = req.params.userId;
      const userId = Array.isArray(userParam) ? userParam[0] : userParam;
      if (!userId) {
        throw AppError.badRequest("Missing userId");
      }

      await eventStaffService.removeStaff(
        eventId,
        req.user!.userId,
        userId
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
