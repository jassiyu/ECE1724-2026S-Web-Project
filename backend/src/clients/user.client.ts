import { User } from "@prisma/client";

export interface IUserClient {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: {
    email: string;
    passwordHash: string;
    role: string;
  }): Promise<User>;
}

// TODO: Implement UserClient using prisma
export class UserClient implements IUserClient {
  async findById(_id: string): Promise<User | null> {
    // TODO: prisma.user.findUnique({ where: { id } })
    throw new Error("Not implemented");
  }

  async findByEmail(_email: string): Promise<User | null> {
    // TODO: prisma.user.findUnique({ where: { email } })
    throw new Error("Not implemented");
  }

  async create(_data: {
    email: string;
    passwordHash: string;
    role: string;
  }): Promise<User> {
    // TODO: prisma.user.create({ data })
    throw new Error("Not implemented");
  }
}

export const userClient = new UserClient();
