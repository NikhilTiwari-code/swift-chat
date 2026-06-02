"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquareText, User, PanelLeftClose, PanelLeftOpen, Bell } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { useAppDispatch } from "../store/hooks";
import { toggleSidebar } from "../store/uiSlice";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chats", label: "Chats", icon: MessageSquareText },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User }
];

export function SideNav() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const collapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed);
  const unreadCount = useSelector((state: RootState) =>
    state.notifications.items.filter((item) => !item.readAt).length
  );

  return (
    <nav
      className={`flex h-screen shrink-0 flex-col gap-3 border-r border-slate-200 bg-white py-6 transition-all ${
        collapsed ? "w-20 items-center" : "w-56 px-4"
      }`}
    >
      <button
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 ${
          collapsed ? "w-12 justify-center" : "w-full"
        }`}
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        {collapsed ? null : <span className="font-bold text-emerald-600">MyChatApp</span>}
      </button>
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-2xl text-sm transition ${
              collapsed ? "h-12 w-12 justify-center" : "h-12 w-full px-3"
            } ${active ? "bg-emerald-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            aria-label={item.label}
            title={item.label}
          >
            <Icon className="h-5 w-5" />
            {collapsed ? null : <span className="font-medium">{item.label}</span>}
            {item.href === "/notifications" && unreadCount > 0 && !collapsed ? (
              <span className="ml-auto rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
