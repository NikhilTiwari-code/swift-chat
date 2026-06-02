"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { storage } from "../lib/storage";

type CallState = {
  active: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incoming: boolean;
  callId: string | null;
  incomingVideo: boolean;
};

const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export const useCall = (conversationId: string | null, currentUserId?: string | null) => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pendingSignals = useRef<Array<{ type: string; payload: Record<string, unknown> }>>([]);
  const callIdRef = useRef<string | null>(null);
  const [state, setState] = useState<CallState>({
    active: false,
    localStream: null,
    remoteStream: null,
    incoming: false,
    callId: null,
    incomingVideo: true
  });

  const ensureSocket = useCallback(() => {
    if (socketRef.current || !conversationId) return;
    const token = storage.getAccessToken();
    if (!token) {
      toast.error("Please login again to start a call.");
      return;
    }
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/ws";
    socketRef.current = new WebSocket(`${wsUrl}?token=${token}`);
    socketRef.current.onopen = () => {
      pendingSignals.current.forEach((signal) => {
        socketRef.current?.send(JSON.stringify({ type: signal.type, payload: signal.payload }));
      });
      pendingSignals.current = [];
    };
  }, [conversationId]);

  const teardown = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    callIdRef.current = null;
    setState((prev) => ({
      ...prev,
      active: false,
      incoming: false,
      callId: null,
      incomingVideo: true,
      localStream: null,
      remoteStream: null
    }));
  }, []);

  const sendSignal = useCallback((type: string, payload: Record<string, unknown>) => {
    if (!socketRef.current) {
      ensureSocket();
    }
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      pendingSignals.current.push({ type, payload });
      return;
    }
    socketRef.current.send(JSON.stringify({ type, payload }));
  }, [ensureSocket]);

  const initPeer = useCallback(async () => {
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && callIdRef.current) {
        sendSignal("call:ice", { conversationId, candidate: event.candidate, callId: callIdRef.current });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setState((prev) => ({ ...prev, remoteStream }));
    };

    return pc;
  }, [conversationId, sendSignal, state.callId]);

  const startCall = useCallback(
    async (video: boolean) => {
      if (!conversationId) return;
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          toast.error("Camera/Microphone not available");
          return;
        }

        ensureSocket();
        const callId = (globalThis.crypto?.randomUUID?.() ?? `call-${Date.now()}`) as string;
        callIdRef.current = callId;

        const localStream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
        setState((prev) => ({ ...prev, active: true, incoming: false, callId, localStream }));

        const pc = await initPeer();
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal("call:offer", { conversationId, sdp: offer, callId, video });
      } catch (error) {
        setState((prev) => ({ ...prev, active: false }));
        toast.error("Unable to start call. Allow camera/mic permissions.");
      }
    },
    [conversationId, ensureSocket, initPeer, sendSignal]
  );

  const answerCall = useCallback(async () => {
    if (!state.callId || !conversationId || !state.incoming) return;
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: state.incomingVideo, audio: true });
      setState((prev) => ({ ...prev, localStream, active: true, incoming: false }));

      const pc = pcRef.current;
      if (!pc) return;
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal("call:answer", { conversationId, sdp: answer, callId: state.callId });
    } catch {
      toast.error("Unable to answer call.");
    }
  }, [conversationId, sendSignal, state.callId, state.incoming, state.incomingVideo]);

  const hangup = useCallback(
    (fromRemote = false) => {
      if (!fromRemote && conversationId && callIdRef.current) {
        sendSignal("call:hangup", { conversationId, callId: callIdRef.current });
      }
      state.localStream?.getTracks().forEach((track) => track.stop());
      state.remoteStream?.getTracks().forEach((track) => track.stop());
      teardown();
    },
    [conversationId, sendSignal, state.localStream, state.remoteStream, teardown]
  );

  useEffect(() => {
    if (!conversationId) return;
    ensureSocket();
    const socket = socketRef.current;
    if (!socket) return;

    socket.onmessage = async (event) => {
      const parsed = JSON.parse(event.data as string);
      if (
        parsed.type === "call:offer" &&
        parsed.payload?.conversationId === conversationId &&
        parsed.payload?.fromUserId !== currentUserId
      ) {
        const pc = await initPeer();
        await pc.setRemoteDescription(new RTCSessionDescription(parsed.payload.sdp));
        callIdRef.current = parsed.payload.callId;
        setState((prev) => ({
          ...prev,
          incoming: true,
          callId: parsed.payload.callId,
          incomingVideo: Boolean(parsed.payload.video)
        }));
      }
      if (
        parsed.type === "call:answer" &&
        parsed.payload?.conversationId === conversationId &&
        parsed.payload?.fromUserId !== currentUserId
      ) {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(parsed.payload.sdp));
      }
      if (
        parsed.type === "call:ice" &&
        parsed.payload?.conversationId === conversationId &&
        parsed.payload?.fromUserId !== currentUserId
      ) {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(parsed.payload.candidate));
      }
      if (parsed.type === "call:hangup" && parsed.payload?.conversationId === conversationId) {
        hangup(true);
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [conversationId, ensureSocket, hangup, initPeer]);

  return {
    state,
    startCall,
    answerCall,
    hangup
  };
};
