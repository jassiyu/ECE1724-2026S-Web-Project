import { PresignUploadInput, PresignUploadResponse, FileDTO } from "../types";

export interface IFileService {
  presignUpload(
    ownerId: string,
    input: PresignUploadInput
  ): Promise<PresignUploadResponse>;
  getDownloadUrl(fileId: string): Promise<string>;
}

// TODO: Implement FileService
// Dependencies: fileClient, s3Client
export class FileService implements IFileService {
  async presignUpload(
    _ownerId: string,
    _input: PresignUploadInput
  ): Promise<PresignUploadResponse> {
    // TODO:
    // 1. Generate unique bucketKey (e.g., `uploads/${uuid}/${fileName}`)
    // 2. fileClient.create({ ownerId, bucketKey, mimeType, sizeBytes, originalName })
    // 3. s3Client.getPresignedUploadUrl(bucketKey, mimeType)
    // 4. Return { uploadUrl, fileId, bucketKey }
    throw new Error("Not implemented");
  }

  async getDownloadUrl(_fileId: string): Promise<string> {
    // TODO:
    // 1. fileClient.findById(fileId)
    // 2. s3Client.getPresignedDownloadUrl(file.bucketKey)
    throw new Error("Not implemented");
  }
}

export const fileService = new FileService();
