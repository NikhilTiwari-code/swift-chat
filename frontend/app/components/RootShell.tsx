"use client";

import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { SideNav } from "./SideNav";
import { useRealtime } from "../hooks/useRealtime";

export function RootShell({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);

  useRealtime();

  return (
    <div className="flex min-h-screen bg-[#eae6df]">
      {user ? <SideNav /> : null}
      <main className="flex-1">{children}</main>
    </div>
  );
}
