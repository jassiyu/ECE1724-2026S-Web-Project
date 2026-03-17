import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserDTO } from "../../types";

interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
}

function readDemoSessionFromQuery(): { token: string | null; user: UserDTO | null } {
  const params = new URLSearchParams(window.location.search);
  const demoToken = params.get("demoToken");
  const demoUser = params.get("demoUser");

  if (!demoToken || !demoUser) {
    return { token: null, user: null };
  }

  try {
    const normalized = demoUser.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const user = JSON.parse(window.atob(padded)) as UserDTO;
    return { token: demoToken, user };
  } catch {
    return { token: null, user: null };
  }
}

function readStoredUser(): UserDTO | null {
  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserDTO;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

const demoSession = readDemoSessionFromQuery();
const storedToken = demoSession.token ?? localStorage.getItem("token");
const storedUser = demoSession.user ?? readStoredUser();

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!storedToken,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: UserDTO; token: string }>
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    clearCredentials(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    setUser(state, action: PayloadAction<UserDTO>) {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
});

export const { setCredentials, clearCredentials, setUser } = authSlice.actions;
export default authSlice.reducer;
