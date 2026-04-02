import { FileObject } from "@prisma/client";
import prisma from "./prisma.client";

export interface IFileClient {
  findById(id: string): Promise<FileObject | null>;
  create(data: {
    ownerId: string;
    bucketKey: string;
    mimeType: string;
    sizeBytes: number;
    originalName: string;
  }): Promise<FileObject>;
  delete(id: string): Promise<void>;
}

export class FileClient implements IFileClient {
  async findById(id: string): Promise<FileObject | null> {
    return prisma.fileObject.findUnique({ where: { id } });
  }

  async create(data: {
    ownerId: string;
    bucketKey: string;
    mimeType: string;
    sizeBytes: number;
    originalName: string;
  }): Promise<FileObject> {
    return prisma.fileObject.create({ data });
  }

  async delete(id: string): Promise<void> {
    await prisma.fileObject.delete({ where: { id } });
  }
}

export const fileClient = new FileClient();
