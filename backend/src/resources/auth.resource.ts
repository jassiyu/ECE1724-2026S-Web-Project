import { Router, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// POST /auth/register
router.post(
  "/register",
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const result = await authService.register(req.body);
      // res.status(201).json(result);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/login
router.post(
  "/login",
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const result = await authService.login(req.body);
      // res.json(result);
      throw new Error("Not implemented");
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
    // TODO: If using token blacklist, invalidate token here
    res.json({ message: "Logged out" });
  }
);

// GET /auth/me
router.get(
  "/me",
  requireAuth,
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const user = await authService.getMe(req.user!.userId);
      // res.json(user);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
