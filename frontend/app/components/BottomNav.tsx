"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareText, Bell, User, Users } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const tabs = [
  { href: "/chats", label: "Chats", icon: MessageSquareText },
  { href: "/notifications", label: "Updates", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const callActive = useSelector((state: RootState) => state.call.active || state.call.incoming);
  const unreadCount = useSelector((state: RootState) =>
    state.notifications.items.filter((item) => !item.readAt).length
  );

  // Hide during active/incoming call — video covers full screen
  if (callActive) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white px-2 pb-safe md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-col items-center gap-1 px-6 py-3 text-[11px] font-semibold transition-colors ${
              active ? "text-emerald-600" : "text-slate-600"
            }`}
          >
            <div className="relative">
              <Icon className="h-6 w-6" />
              {tab.href === "/notifications" && unreadCount > 0 ? (
                <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </div>
            <span>{tab.label}</span>
            {active ? (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-500" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
