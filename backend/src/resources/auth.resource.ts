import { Router, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { authService } from "../services/auth.service";

const router = Router();

// POST /auth/register
router.post(
  "/register",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/login
router.post(
  "/login",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/logout
router.post(
  "/logout",
  requireAuth,
  async (_req: AuthenticatedRequest, res: Response) => {
    res.json({ message: "Logged out" });
  }
);

// GET /auth/me
router.get(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
