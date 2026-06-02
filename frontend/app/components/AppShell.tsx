"use client";

import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#eae6df] text-slate-900">
      <div className="mx-auto flex h-screen max-w-7xl overflow-hidden rounded-none bg-white shadow-[0_20px_80px_rgba(0,0,0,0.12)] md:my-6 md:h-[92vh] md:rounded-2xl">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
}
