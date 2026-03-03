import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  UserDTO,
} from "../types";

export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResponse>;
  login(input: LoginInput): Promise<AuthResponse>;
  getMe(userId: string): Promise<UserDTO>;
}

// TODO: Implement AuthService
// Dependencies: userClient, bcryptjs, jsonwebtoken
export class AuthService implements IAuthService {
  async register(_input: RegisterInput): Promise<AuthResponse> {
    // TODO:
    // 1. Check if user with email already exists (userClient.findByEmail)
    // 2. Hash password with bcrypt
    // 3. Create user (userClient.create)
    // 4. Generate JWT token
    // 5. Return { token, user }
    throw new Error("Not implemented");
  }

  async login(_input: LoginInput): Promise<AuthResponse> {
    // TODO:
    // 1. Find user by email (userClient.findByEmail)
    // 2. Verify password with bcrypt
    // 3. Generate JWT token
    // 4. Return { token, user }
    throw new Error("Not implemented");
  }

  async getMe(_userId: string): Promise<UserDTO> {
    // TODO:
    // 1. Find user by id (userClient.findById)
    // 2. Throw AppError.notFound if not found
    // 3. Return user DTO (strip passwordHash)
    throw new Error("Not implemented");
  }
}

export const authService = new AuthService();
