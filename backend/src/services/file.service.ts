import { v4 as uuidv4 } from "uuid";
import { PresignUploadInput, PresignUploadResponse, AppError } from "../types";
import { fileClient } from "../clients/file.client";
import { s3Client } from "../clients/s3.client";

export interface IFileService {
  presignUpload(
    ownerId: string,
    input: PresignUploadInput
  ): Promise<PresignUploadResponse>;
  getDownloadUrl(fileId: string): Promise<string>;
}

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function normalizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export class FileService implements IFileService {
  async presignUpload(
    ownerId: string,
    input: PresignUploadInput
  ): Promise<PresignUploadResponse> {
    const fileName = input.fileName?.trim();
    const mimeType = input.mimeType?.trim();
    const sizeBytes = Number(input.sizeBytes);

    if (!fileName) {
      throw AppError.badRequest("fileName is required");
    }

    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      throw AppError.badRequest(
        "mimeType must be one of image/png, image/jpeg, application/pdf"
      );
    }

    if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
      throw AppError.badRequest("sizeBytes must be a positive integer");
    }

    if (sizeBytes > MAX_UPLOAD_BYTES) {
      throw AppError.badRequest(`sizeBytes must be <= ${MAX_UPLOAD_BYTES}`);
    }

    const bucketKey = `uploads/${ownerId}/${uuidv4()}-${normalizeFileName(fileName)}`;

    const fileRecord = await fileClient.create({
      ownerId,
      bucketKey,
      mimeType,
      sizeBytes,
      originalName: fileName,
    });

    try {
      const uploadUrl = await s3Client.getPresignedUploadUrl(bucketKey, mimeType);
      return {
        uploadUrl,
        fileId: fileRecord.id,
        bucketKey,
      };
    } catch (error) {
      await fileClient.delete(fileRecord.id).catch(() => undefined);
      throw error;
    }
  }

  async getDownloadUrl(fileId: string): Promise<string> {
    const file = await fileClient.findById(fileId);
    if (!file) {
      throw AppError.notFound("File not found");
    }

    return s3Client.getPresignedDownloadUrl(file.bucketKey);
  }
}

export const fileService = new FileService();
