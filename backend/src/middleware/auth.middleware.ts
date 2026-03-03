import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";

/**
 * Middleware: verifies JWT from Authorization header,
 * attaches decoded payload to req.user.
 */
export function requireAuth(
  _req: AuthenticatedRequest,
  _res: Response,
  _next: NextFunction
): void {
  // TODO:
  // 1. Extract token from `Authorization: Bearer <token>` header
  // 2. Verify token using jsonwebtoken.verify(token, JWT_SECRET)
  // 3. Attach decoded payload { userId, email, role } to req.user
  // 4. Call next()
  // 5. On failure: res.status(401).json({ error: 'Unauthorized' })
  throw new Error("Not implemented");
}
