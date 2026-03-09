import apiClient from "./client";
import type { AuthResponse, UserDTO, UserRole } from "../types";

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
    return apiClient.post("/auth/register", input).then((r) => r.data);
  },

  login(input: LoginInput): Promise<AuthResponse> {
    return apiClient.post("/auth/login", input).then((r) => r.data);
  },

  logout(): Promise<void> {
    // Server may clear cookie/session; client-side token cleanup happens in authSlice/UI.
    return apiClient.post("/auth/logout").then(() => {
      return;
    });
  },

  getMe(): Promise<UserDTO> {
    return apiClient.get("/auth/me").then((r) => r.data);
  },
};
