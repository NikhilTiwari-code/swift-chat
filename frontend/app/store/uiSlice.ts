import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UiState = {
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
};

const initialState: UiState = {
  sidebarCollapsed: false,
  theme: "light"
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setTheme(state, action: PayloadAction<"light" | "dark">) {
      state.theme = action.payload;
    }
  }
});

export const { toggleSidebar, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
