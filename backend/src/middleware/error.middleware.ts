import { Request, Response, NextFunction } from "express";
import { AppError } from "../types";

/**
 * Global error handler. Catches AppError and returns structured JSON.
 * Must be registered LAST with app.use().
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // TODO:
  // 1. If err is AppError: respond with err.statusCode and { error: err.message, code: err.code }
  // 2. Otherwise: log error, respond with 500 and { error: 'Internal server error' }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
