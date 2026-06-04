"use client";

import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { AuthGate } from "../components/AuthGate";
import { useAppDispatch } from "../store/hooks";
import { markNotificationRead } from "../store/notificationsSlice";
import { formatDistanceToNow } from "date-fns";
import { Bell, MessageSquare, Check } from "lucide-react";
import { Avatar } from "../components/Avatar";

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const items = useSelector((state: RootState) => state.notifications.items);

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#eae6df]">
        {/* Header */}
        <div className="bg-[#075e54] px-5 py-5 pt-6">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          <p className="mt-0.5 text-sm text-emerald-200">
            {items.filter((i) => !i.readAt).length} unread
          </p>
        </div>

        <div className="mx-auto max-w-2xl px-0 pb-6">
          {!items.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Bell className="mb-4 h-16 w-16 opacity-20" />
              <p className="text-base font-medium">No notifications yet</p>
              <p className="mt-1 text-sm">Messages you receive will appear here</p>
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm mx-4">
              {items.map((item, index) => {
                const fromUser = item.payload?.fromUser;
                const messageContent = item.payload?.content ?? item.payload?.message?.content;
                const isUnread = !item.readAt;
                const isMessage = item.type === "message";

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 px-4 py-4 transition-colors ${
                      index !== items.length - 1 ? "border-b border-slate-100" : ""
                    } ${isUnread ? "bg-emerald-50/60" : "bg-white"}`}
                  >
                    {/* Avatar / Icon */}
                    <div className="shrink-0 pt-0.5">
                      {fromUser?.username ? (
                        <Avatar name={fromUser.username} avatarUrl={fromUser.avatarUrl} size="md" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                          <Bell className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {fromUser?.username ?? "SwiftChat"}
                          </p>
                          {/* Actual message content */}
                          {messageContent ? (
                            <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
                              {messageContent}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-sm text-slate-500">
                              {isMessage ? "Sent you a message" : item.type}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Unread dot / Mark read */}
                        <div className="shrink-0">
                          {isUnread ? (
                            <button
                              onClick={() => dispatch(markNotificationRead(item.id))}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-sm transition hover:bg-emerald-600"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300">Read</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
