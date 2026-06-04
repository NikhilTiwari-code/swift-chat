"use client";

import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { SideNav } from "./SideNav";
import { BottomNav } from "./BottomNav";
import { useRealtime } from "../hooks/useRealtime";
import { GlobalCallUI } from "./GlobalCallUI";

export function RootShell({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);

  useRealtime();

  return (
    <div className="flex min-h-screen bg-[#eae6df]">
      {/* SideNav: only visible on desktop (md+) */}
      {user ? <div className="hidden md:flex"><SideNav /></div> : null}

      {/* Main content — add bottom padding on mobile for BottomNav */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {/* BottomNav: only visible on mobile */}
      {user ? <BottomNav /> : null}

      {/* Global Call Overlay (signals/UI) */}
      <GlobalCallUI />
    </div>
  );
}
