export interface IS3Client {
  getPresignedUploadUrl(
    bucketKey: string,
    mimeType: string,
    expiresIn?: number
  ): Promise<string>;

  getPresignedDownloadUrl(
    bucketKey: string,
    expiresIn?: number
  ): Promise<string>;

  deleteObject(bucketKey: string): Promise<void>;
}

// TODO: Implement S3Client using @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
export class S3Client implements IS3Client {
  async getPresignedUploadUrl(
    _bucketKey: string,
    _mimeType: string,
    _expiresIn?: number
  ): Promise<string> {
    // TODO: Implement using PutObjectCommand + getSignedUrl
    throw new Error("Not implemented");
  }

  async getPresignedDownloadUrl(
    _bucketKey: string,
    _expiresIn?: number
  ): Promise<string> {
    // TODO: Implement using GetObjectCommand + getSignedUrl
    throw new Error("Not implemented");
  }

  async deleteObject(_bucketKey: string): Promise<void> {
    // TODO: Implement using DeleteObjectCommand
    throw new Error("Not implemented");
  }
}

export const s3Client = new S3Client();
