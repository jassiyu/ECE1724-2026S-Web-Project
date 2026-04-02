import {
  S3Client as AwsS3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface IS3Client {
  getPresignedUploadUrl(
    bucketKey: string,
    mimeType: string,
    expiresIn?: number
  ): Promise<string>;

  getPresignedDownloadUrl(
    bucketKey: string,
    expiresIn?: number,
    fileName?: string
  ): Promise<string>;

  deleteObject(bucketKey: string): Promise<void>;
}

const bucket = process.env.S3_BUCKET || "";
const region = process.env.S3_REGION || "us-east-1";
const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

const awsS3Client = new AwsS3Client({
  region,
  endpoint,
  forcePathStyle: Boolean(endpoint),
  credentials:
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined,
});

function requireBucketName(): string {
  if (!bucket) {
    throw new Error("S3_BUCKET is not configured");
  }
  return bucket;
}

export class S3Client implements IS3Client {
  async getPresignedUploadUrl(
    bucketKey: string,
    mimeType: string,
    expiresIn = 900
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: requireBucketName(),
      Key: bucketKey,
      ContentType: mimeType,
    });

    return getSignedUrl(awsS3Client, command, { expiresIn });
  }

  async getPresignedDownloadUrl(
    bucketKey: string,
    expiresIn = 900,
    fileName?: string
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: requireBucketName(),
      Key: bucketKey,
      ...(fileName && {
        ResponseContentDisposition: `attachment; filename="${fileName.replace(/["\\\r\n]/g, "_")}"`,
      }),
    });

    return getSignedUrl(awsS3Client, command, { expiresIn });
  }

  async deleteObject(bucketKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: requireBucketName(),
      Key: bucketKey,
    });
    await awsS3Client.send(command);
  }
}

export const s3Client = new S3Client();
