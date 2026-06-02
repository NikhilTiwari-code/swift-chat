"use client";

import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { AuthGate } from "../components/AuthGate";
import { useAppDispatch } from "../store/hooks";
import { markNotificationRead } from "../store/notificationsSlice";

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const items = useSelector((state: RootState) => state.notifications.items);

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#eae6df] px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-2 text-sm text-slate-500">Your recent activity.</p>

          <div className="mt-6 space-y-4">
            {items.map((item) => {
              const fromUser = item.payload?.fromUser;
              const messageId = item.payload?.messageId;
              const title = item.type === "message" ? "New message" : item.type;
              const description = item.type === "message"
                ? "You received a new message in a conversation."
                : "New activity";

              return (
                <div key={item.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{title}</p>
                      <p className="mt-1 text-xs text-slate-500">{description}</p>
                    </div>
                    {item.readAt ? (
                      <span className="text-xs text-slate-400">Read</span>
                    ) : (
                      <button
                        className="text-xs font-semibold text-emerald-600"
                        onClick={() => dispatch(markNotificationRead(item.id))}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  {fromUser?.username ? (
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      From: {fromUser.username}
                    </div>
                  ) : null}
                  {messageId ? (
                    <div className="mt-2 text-xs text-slate-500">Message: {messageId}</div>
                  ) : null}
                </div>
              );
            })}
            {!items.length ? <p className="text-sm text-slate-500">No notifications yet.</p> : null}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
