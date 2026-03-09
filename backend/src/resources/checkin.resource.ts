import { Router, Response, NextFunction } from "express";
import { AppError, AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { checkInService } from "../services/checkin.service";

const router = Router({ mergeParams: true });

// POST /events/:eventId/checkins/validate (Staff only)
router.post(
  "/validate",
  requireAuth,
  requireRole(UserRole.STAFF),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventParam = req.params.eventId;
      const eventId = Array.isArray(eventParam) ? eventParam[0] : eventParam;
      if (!eventId) {
        throw AppError.badRequest("Missing eventId");
      }

      const result = await checkInService.validateAndCheckIn(
        eventId,
        req.body.qrToken,
        req.user!.userId
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /events/:eventId/checkins/recent (Organizer or Staff)
router.get(
  "/recent",
  requireAuth,
  requireRole(UserRole.ORGANIZER, UserRole.STAFF),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const eventParam = req.params.eventId;
      const eventId = Array.isArray(eventParam) ? eventParam[0] : eventParam;
      if (!eventId) {
        throw AppError.badRequest("Missing eventId");
      }

      const rawLimit = parseInt(req.query.limit as string, 10);
      const limit = Number.isNaN(rawLimit) ? 20 : rawLimit;

      const checkIns = await checkInService.getRecentCheckIns(eventId, limit);
      res.json(checkIns);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
