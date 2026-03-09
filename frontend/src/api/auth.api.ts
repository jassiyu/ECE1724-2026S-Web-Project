import apiClient from "./client";
import { AuthResponse, UserDTO, UserRole } from "../types";

export interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register(input: RegisterInput): Promise<AuthResponse> {
    // TODO: return apiClient.post('/auth/register', input).then(r => r.data);
    throw new Error("Not implemented");
  },

  login(input: LoginInput): Promise<AuthResponse> {
    // TODO: return apiClient.post('/auth/login', input).then(r => r.data);
    throw new Error("Not implemented");
  },

  logout(): Promise<void> {
    // TODO: return apiClient.post('/auth/logout').then(r => r.data);
    throw new Error("Not implemented");
  },

  getMe(): Promise<UserDTO> {
    // TODO: return apiClient.get('/auth/me').then(r => r.data);
    throw new Error("Not implemented");
  },
};
