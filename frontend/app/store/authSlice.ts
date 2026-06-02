import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import type { User } from "../lib/types";

export type AuthState = {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload: { email: string; username: string; password: string }) => {
    const { data } = await api.post("/auth/register", payload);
    storage.setTokens(data.accessToken, data.refreshToken);
    return data as { user: User; accessToken: string; refreshToken: string };
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload: { identifier: string; password: string }) => {
    const { data } = await api.post("/auth/login", payload);
    storage.setTokens(data.accessToken, data.refreshToken);
    return data as { user: User; accessToken: string; refreshToken: string };
  }
);

export const fetchMe = createAsyncThunk<User, void, { rejectValue: number | undefined }>(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/users/me");
      return data.user as User;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.status);
      }
      throw error;
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  const refreshToken = storage.getRefreshToken();
  if (refreshToken) {
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch {
      // Clear local auth even if the server-side logout request fails.
    }
  }
  storage.clearTokens();
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateTokens(state) {
      state.accessToken = storage.getAccessToken();
      state.refreshToken = storage.getRefreshToken();
      state.hydrated = true;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.hydrated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Registration failed";
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.hydrated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = "idle";
        state.user = null;
        if (action.payload === 401 || action.payload === 403) {
          storage.clearTokens();
          state.accessToken = null;
          state.refreshToken = null;
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = "idle";
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.hydrated = true;
      });
  }
});

export const { hydrateTokens } = authSlice.actions;
export default authSlice.reducer;
