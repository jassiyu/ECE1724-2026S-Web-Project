import { User } from "@prisma/client";
import prisma from "./prisma.client";

export interface IUserClient {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: {
    email: string;
    passwordHash: string;
    role: string;
  }): Promise<User>;
}

export class UserClient implements IUserClient {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: string;
  }): Promise<User> {
    return prisma.user.create({ data: data as any });
  }
}

export const userClient = new UserClient();
