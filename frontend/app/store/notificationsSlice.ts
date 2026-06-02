import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../lib/api";

export type NotificationItem = {
  id: string;
  type: string;
  payload?: any;
  readAt?: string | null;
  createdAt: string;
};

export type NotificationsState = {
  items: NotificationItem[];
  status: "idle" | "loading" | "error";
};

const initialState: NotificationsState = {
  items: [],
  status: "idle"
};

export const fetchNotifications = createAsyncThunk("notifications/list", async () => {
  const { data } = await api.get("/notifications");
  return data.notifications as NotificationItem[];
});

export const markNotificationRead = createAsyncThunk(
  "notifications/read",
  async (notificationId: string) => {
    const { data } = await api.post(`/notifications/${notificationId}/read`);
    return data.notification as NotificationItem;
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    receiveNotification(state, action: PayloadAction<NotificationItem>) {
      const exists = state.items.some((item) => item.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = "error";
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.items = state.items.map((item) => (item.id === action.payload.id ? action.payload : item));
      });
  }
});

export const { receiveNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
