"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../store/hooks";
import type { RootState } from "../store/store";
import { setCallActive, clearCall } from "../store/callSlice";
import { wsManager } from "../lib/wsManager";
import toast from "react-hot-toast";

const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export const useCall = (conversationId: string | null, currentUserId?: string | null) => {
  const dispatch = useAppDispatch();
  const callState = useSelector((state: RootState) => state.call);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // ── Peer connection setup ──
  const initPeer = useCallback(async (callIdToUse: string) => {
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && callIdToUse) {
        wsManager.send({
          type: "call:ice",
          payload: { conversationId, candidate: event.candidate, callId: callIdToUse },
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return pc;
  }, [conversationId]);

  // ── Start outgoing call ──
  const startCall = useCallback(async (video: boolean) => {
    if (!conversationId) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Camera/Microphone not available");
        return;
      }

      const callId = (globalThis.crypto?.randomUUID?.() ?? `call-${Date.now()}`) as string;
      const stream = await navigator.mediaDevices.getUserMedia({
        video,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setLocalStream(stream);

      dispatch(setCallActive({ callId, conversationId }));

      const pc = await initPeer(callId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsManager.send({
        type: "call:offer",
        payload: { conversationId, sdp: offer, callId, video },
      });
    } catch (err) {
      console.error("startCall error:", err);
      dispatch(clearCall());
      toast.error("Unable to start call. Allow camera/mic permissions.");
    }
  }, [conversationId, dispatch, initPeer]);

  // ── Answer incoming call ──
  const answerCall = useCallback(async () => {
    if (!callState.callId || !callState.sdpOffer) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callState.incomingVideo,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setLocalStream(stream);

      const pc = await initPeer(callState.callId);
      await pc.setRemoteDescription(new RTCSessionDescription(callState.sdpOffer));

      // Process queued candidates
      if (iceQueueRef.current.length > 0) {
        for (const candidate of iceQueueRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Failed to add queued ice candidate", e);
          }
        }
        iceQueueRef.current = [];
      }

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsManager.send({
        type: "call:answer",
        payload: { conversationId: callState.conversationId, sdp: answer, callId: callState.callId },
      });

      dispatch(setCallActive({ callId: callState.callId, conversationId: callState.conversationId! }));
    } catch (err) {
      console.error("answerCall error:", err);
      toast.error("Unable to answer call.");
      dispatch(clearCall());
    }
  }, [callState, dispatch, initPeer]);

  // ── Hangup ──
  const hangup = useCallback((fromRemote = false) => {
    if (!fromRemote && callState.callId) {
      wsManager.send({
        type: "call:hangup",
        payload: { conversationId: callState.conversationId, callId: callState.callId },
      });
    }
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    iceQueueRef.current = [];
    pcRef.current?.close();
    pcRef.current = null;
    dispatch(clearCall());
  }, [callState, dispatch, localStream, remoteStream]);

  // ── Listen for call signals via wsManager ──
  useEffect(() => {
    const unsubscribe = wsManager.subscribe(async (payload) => {
      const p = payload.payload as Record<string, unknown>;
      if (!p) return;

      // Verify that this call message is relevant to us (match by callId or conversationId)
      const matchesCall = p.callId && callState.callId 
        ? p.callId === callState.callId 
        : p.conversationId === conversationId;

      if (!matchesCall) return;

      // Answer received (we were the caller)
      if (
        payload.type === "call:answer" &&
        p.fromUserId !== currentUserId
      ) {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(p.sdp as RTCSessionDescriptionInit));

        // Process queued candidates
        if (iceQueueRef.current.length > 0) {
          for (const candidate of iceQueueRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Failed to add queued ice candidate", e);
            }
          }
          iceQueueRef.current = [];
        }
      }

      // ICE candidate received
      if (
        payload.type === "call:ice" &&
        p.fromUserId !== currentUserId
      ) {
        const pc = pcRef.current;
        const candidate = p.candidate as RTCIceCandidateInit;
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Failed to add ice candidate", e);
          }
        } else {
          iceQueueRef.current.push(candidate);
        }
      }
    });

    return unsubscribe;
  }, [conversationId, currentUserId, callState.callId]);

  // Derived state — merge Redux + local streams
  const state = {
    active: callState.active,
    incoming: callState.incoming,
    callId: callState.callId,
    incomingVideo: callState.incomingVideo,
    localStream,
    remoteStream,
  };

  return { state, startCall, answerCall, hangup };
};
