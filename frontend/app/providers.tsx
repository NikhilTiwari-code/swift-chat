"use client";

import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "./store/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster position="top-right" />
    </Provider>
  );
}
