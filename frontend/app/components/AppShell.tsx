"use client";

import { useSelector } from "react-redux";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import type { RootState } from "../store/store";

export function AppShell() {
  const activeConversationId = useSelector(
    (state: RootState) => state.chats.activeConversationId
  );

  return (
    // Mobile: full height minus bottom nav (4rem = 64px)
    // Desktop: 92vh with margin
    <div className="bg-[#eae6df] text-slate-900">
      <div
        className="mx-auto flex max-w-7xl overflow-hidden rounded-none bg-white shadow-[0_20px_80px_rgba(0,0,0,0.12)] md:my-6 md:rounded-2xl"
        style={{
          height: "calc(100dvh - 4rem)",
        }}
      >
        {/* Sidebar (chat list):
            Mobile → full screen, visible ONLY when no chat selected
            Desktop → always visible, fixed width */}
        <div
          className={`w-full md:w-auto md:flex ${
            activeConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          <Sidebar />
        </div>

        {/* ChatWindow:
            Mobile → full screen, visible ONLY when a chat is selected
            Desktop → always visible, fills remaining space */}
        <div
          className={`flex-1 md:flex ${
            activeConversationId ? "flex" : "hidden md:flex"
          }`}
        >
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
