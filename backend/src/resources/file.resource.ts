import { Router, Response, NextFunction } from "express";
import { AppError, AuthenticatedRequest } from "../types";
import { requireAuth } from "../middleware/auth.middleware";
import { fileService } from "../services/file.service";

const router = Router();

// POST /files/presign-upload
router.post(
  "/presign-upload",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await fileService.presignUpload(req.user!.userId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /files/:fileId/download
router.get(
  "/:fileId/download",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const fileIdParam = req.params.fileId;
      const rawFileId = Array.isArray(fileIdParam) ? fileIdParam[0] : fileIdParam;
      const fileId = rawFileId?.trim();
      if (!fileId) {
        throw AppError.badRequest("Missing fileId");
      }

      const url = await fileService.getDownloadUrl(fileId);
      res.redirect(url);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
