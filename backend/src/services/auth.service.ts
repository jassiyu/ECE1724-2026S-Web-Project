import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  UserDTO,
  JwtPayload,
  AppError,
} from "../types";
import { userClient } from "../clients/user.client";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResponse>;
  login(input: LoginInput): Promise<AuthResponse>;
  getMe(userId: string): Promise<UserDTO>;
}

function toUserDTO(user: { id: string; email: string; role: string; createdAt: Date }): UserDTO {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserDTO["role"],
    createdAt: user.createdAt,
  };
}

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export class AuthService implements IAuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await userClient.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict("Email already registered", "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userClient.create({
      email: input.email,
      passwordHash,
      role: input.role,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as JwtPayload["role"],
    });

    return { token, user: toUserDTO(user) };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await userClient.findByEmail(input.email);
    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as JwtPayload["role"],
    });

    return { token, user: toUserDTO(user) };
  }

  async getMe(userId: string): Promise<UserDTO> {
    const user = await userClient.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return toUserDTO(user);
  }
}

export const authService = new AuthService();
