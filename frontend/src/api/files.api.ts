import apiClient from "./client";
import type { PresignUploadResponse } from "../types";

export const filesApi = {
  presignUpload(
    fileName: string,
    mimeType: string,
    sizeBytes: number
  ): Promise<PresignUploadResponse> {
    return apiClient
      .post("/files/presign-upload", { fileName, mimeType, sizeBytes })
      .then((r) => r.data);
  },

  async uploadToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file to storage");
    }
  },

  getDownloadUrl(fileId: string): string {
    return `/api/files/${encodeURIComponent(fileId)}/download`;
  },
};
