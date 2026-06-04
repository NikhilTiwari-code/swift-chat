"use client";

import { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { receiveMessage, removeMessage, setTyping } from "../store/chatsSlice";
import { receiveNotification } from "../store/notificationsSlice";
import { setIncomingCall, clearCall } from "../store/callSlice";
import type { Message } from "../lib/types";
import { wsManager } from "../lib/wsManager";

export const useRealtime = () => {
  const dispatch = useAppDispatch();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
    wsManager.connect(`${wsUrl}?token=${accessToken}`);

    const unsubscribe = wsManager.subscribe((payload) => {
      // ── Chat messages ──
      if (payload.type === "message:new") {
        const p = payload.payload as Record<string, unknown>;
        dispatch(receiveMessage({
          conversationId: (p.message as Message).conversationId,
          message: p.message as Message,
        }));
      }

      // ── Typing indicator ──
      if (payload.type === "typing") {
        const p = payload.payload as Record<string, unknown>;
        dispatch(setTyping({
          conversationId: p.conversationId as string,
          userId: p.userId as string,
          isTyping: p.isTyping as boolean,
        }));
      }

      // ── Message deleted ──
      if (payload.type === "message:deleted") {
        const p = payload.payload as Record<string, unknown>;
        dispatch(removeMessage({
          conversationId: p.conversationId as string,
          messageId: p.messageId as string,
        }));
      }

      // ── Notification ──
      if (payload.type === "notification:new") {
        const p = payload.payload as Record<string, unknown>;
        dispatch(receiveNotification(p.notification as Parameters<typeof receiveNotification>[0]));
      }

      // ── Call: incoming offer ──
      if (payload.type === "call:offer") {
        const p = payload.payload as Record<string, unknown>;
        dispatch(setIncomingCall({
          callId: p.callId as string,
          conversationId: p.conversationId as string,
          incomingVideo: Boolean(p.video),
          sdpOffer: p.sdp as RTCSessionDescriptionInit,
        }));
      }

      // ── Call: hangup ──
      if (payload.type === "call:hangup") {
        dispatch(clearCall());
      }
    });

    return () => {
      unsubscribe();
      // Don't disconnect wsManager here — it's a singleton used by useCall too
    };
  }, [accessToken, dispatch]);
};
