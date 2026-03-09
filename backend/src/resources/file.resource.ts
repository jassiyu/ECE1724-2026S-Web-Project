import { Router, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// POST /files/presign-upload
router.post(
  "/presign-upload",
  requireAuth,
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const result = await fileService.presignUpload(req.user!.userId, req.body);
      // res.json(result);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

// GET /files/:fileId/download
router.get(
  "/:fileId/download",
  async (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      // TODO:
      // const url = await fileService.getDownloadUrl(req.params.fileId);
      // res.redirect(url);
      throw new Error("Not implemented");
    } catch (err) {
      next(err);
    }
  }
);

export default router;
