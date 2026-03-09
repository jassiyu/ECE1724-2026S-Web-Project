import apiClient from "./client";
import { PresignUploadResponse } from "../types";

export const filesApi = {
  presignUpload(
    fileName: string,
    mimeType: string,
    sizeBytes: number
  ): Promise<PresignUploadResponse> {
    // TODO: return apiClient.post('/files/presign-upload', { fileName, mimeType, sizeBytes }).then(r => r.data);
    throw new Error("Not implemented");
  },

  getDownloadUrl(fileId: string): string {
    return `/api/files/${fileId}/download`;
  },
};
