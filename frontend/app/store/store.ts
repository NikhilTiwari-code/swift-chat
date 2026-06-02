import { configureStore } from "@reduxjs/toolkit";
import authReducer, { AuthState } from "./authSlice";
import chatsReducer, { ChatsState } from "./chatsSlice";
import uiReducer, { UiState } from "./uiSlice";
import notificationsReducer, { NotificationsState } from "./notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chats: chatsReducer,
    ui: uiReducer,
    notifications: notificationsReducer
  }
});

export type RootState = {
  auth: AuthState;
  chats: ChatsState;
  ui: UiState;
  notifications: NotificationsState;
};
export type AppDispatch = typeof store.dispatch;
