import { Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../types";

/**
 * Middleware factory: returns a middleware that checks if
 * req.user.role is one of the allowed roles.
 * Must be used AFTER requireAuth.
 */
export function requireRole(...roles: UserRole[]) {
  return (
    _req: AuthenticatedRequest,
    _res: Response,
    _next: NextFunction
  ): void => {
    // TODO:
    // 1. Check req.user exists (should be set by requireAuth)
    // 2. Check req.user.role is in `roles` array
    // 3. If yes: call next()
    // 4. If no: res.status(403).json({ error: 'Forbidden' })
    throw new Error("Not implemented");
  };
}
