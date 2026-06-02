"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "../store/hooks";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { receiveMessage, removeMessage, setTyping } from "../store/chatsSlice";
import { receiveNotification } from "../store/notificationsSlice";
import type { Message } from "../lib/types";

export const useRealtime = () => {
  const dispatch = useAppDispatch();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const socketRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const bindHandlers = (ws: WebSocket) => {
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string);
          if (payload.type === "message:new") {
            dispatch(receiveMessage({
              conversationId: payload.payload.message.conversationId,
              message: payload.payload.message as Message
            }));
          }
          if (payload.type === "typing") {
            dispatch(
              setTyping({
                conversationId: payload.payload.conversationId,
                userId: payload.payload.userId,
                isTyping: payload.payload.isTyping
              })
            );
          }
          if (payload.type === "message:deleted") {
            dispatch(
              removeMessage({
                conversationId: payload.payload.conversationId,
                messageId: payload.payload.messageId
              })
            );
          }
          if (payload.type === "notification:new") {
            dispatch(receiveNotification(payload.payload.notification));
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (reconnectTimer) return;
        reconnectTimer = setTimeout(() => {
          socketRef.current = new WebSocket(`${wsUrl}?token=${accessToken}`);
          if (socketRef.current) {
            bindHandlers(socketRef.current);
          }
          reconnectTimer = null;
        }, 1500);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
      socketRef.current = new WebSocket(`${wsUrl}?token=${accessToken}`);
      bindHandlers(socketRef.current);
    }

    if (!pingRef.current) {
      pingRef.current = setInterval(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    }

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (pingRef.current) {
        clearInterval(pingRef.current);
        pingRef.current = null;
      }
    };
  }, [accessToken, dispatch]);
};
