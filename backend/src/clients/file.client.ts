import { FileObject } from "@prisma/client";

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

// TODO: Implement FileClient using prisma
export class FileClient implements IFileClient {
  async findById(_id: string): Promise<FileObject | null> {
    // TODO: prisma.fileObject.findUnique({ where: { id } })
    throw new Error("Not implemented");
  }

  async create(_data: {
    ownerId: string;
    bucketKey: string;
    mimeType: string;
    sizeBytes: number;
    originalName: string;
  }): Promise<FileObject> {
    // TODO: prisma.fileObject.create({ data })
    throw new Error("Not implemented");
  }

  async delete(_id: string): Promise<void> {
    // TODO: prisma.fileObject.delete({ where: { id } })
    throw new Error("Not implemented");
  }
}

export const fileClient = new FileClient();
