"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../store/hooks";
import { fetchMe, hydrateTokens } from "../store/authSlice";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { fetchConversations } from "../store/chatsSlice";
import { fetchNotifications } from "../store/notificationsSlice";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const hydrated = useSelector((state: RootState) => state.auth.hydrated);

  useEffect(() => {
    dispatch(hydrateTokens());
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!accessToken) {
      router.push("/login");
      return;
    }
    dispatch(fetchMe());
    dispatch(fetchConversations());
    dispatch(fetchNotifications());
  }, [accessToken, dispatch, hydrated, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eae6df] text-slate-500">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
