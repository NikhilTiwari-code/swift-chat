"use client";

import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { Pencil } from "lucide-react";

export function NewChatFAB() {
  const router = useRouter();
  const callActive = useSelector((state: RootState) => state.call.active || state.call.incoming);

  // Hide during call
  if (callActive) return null;

  return (
    <button
      id="new-chat-fab"
      onClick={() => router.push("/new-chat")}
      aria-label="New chat"
      className="absolute bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-all duration-200 hover:scale-105 hover:bg-emerald-600 hover:shadow-[0_6px_24px_rgba(16,185,129,0.6)] active:scale-95"
    >
      <Pencil className="h-6 w-6 text-white" />
    </button>
  );
}
