import { Router, Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router({ mergeParams: true });

// POST /events/:eventId/checkins/validate (Staff only)
router.post(
  "/validate",
  requireAuth,
  requireRole(UserRole.STAFF),
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const result = await checkInService.validateAndCheckIn(
      //   req.params.eventId,
      //   req.body.qrToken,
      //   req.user!.userId
      // );
      // res.json(result);
      throw new Error("Not implemented");
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
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const limit = parseInt(req.query.limit as string) || 20;
      // const checkIns = await checkInService.getRecentCheckIns(req.params.eventId, limit);
      // res.json(checkIns);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
