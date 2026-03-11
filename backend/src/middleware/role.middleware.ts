import { Response, NextFunction } from "express";
import { AuthenticatedRequest, UserRole } from "../types";

export function requireRole(...roles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }

    next();
  };
}
