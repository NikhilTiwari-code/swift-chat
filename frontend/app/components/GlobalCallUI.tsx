"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../store/hooks";
import type { RootState } from "../store/store";
import { clearOutbound } from "../store/callSlice";
import { useCall } from "../hooks/useCall";
import { Video, Phone, Mic, MicOff } from "lucide-react";

export function GlobalCallUI() {
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const callState = useSelector((state: RootState) => state.call);
  const conversations = useSelector((state: RootState) => state.chats.conversations);

  const conversationId = callState.conversationId || callState.outbound?.conversationId || null;
  const activeConversation = conversations.find((c) => c.id === conversationId);

  const otherParticipant = activeConversation?.participants.find((p) => p.userId !== user?.id)?.user;
  const headerName = activeConversation?.type === "GROUP"
    ? activeConversation.title ?? "Group"
    : otherParticipant?.username ?? "Chat";

  const call = useCall(conversationId, user?.id);

  // Handle outbound call trigger from anywhere in the app
  useEffect(() => {
    if (callState.outbound) {
      call.startCall(callState.outbound.video);
      dispatch(clearOutbound());
    }
  }, [callState.outbound, call, dispatch]);

  if (!user) return null;

  return (
    <>
      {/* Incoming Call Popup */}
      {call.state.incoming ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <Video className="h-9 w-9 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">Incoming {call.state.incomingVideo ? "Video" : "Audio"} Call</p>
            <p className="mt-1 text-sm text-slate-500">{headerName}</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => call.hangup()}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 shadow-lg shadow-rose-200 transition hover:bg-rose-600"
              >
                <Phone className="h-7 w-7 rotate-[135deg] text-white" />
              </button>
              <button
                onClick={call.answerCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
              >
                <Phone className="h-7 w-7 text-white" />
              </button>
            </div>
            <div className="mt-4 flex justify-center gap-8 text-xs text-slate-400">
              <span>Decline</span>
              <span>Accept</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Active Call UI overlay */}
      {call.state.active ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          {/* Videos Container */}
          <div className="relative flex-1 overflow-hidden">
            {/* Remote Stream Video */}
            <video
              ref={(el) => {
                if (el && call.state.remoteStream) {
                  if (el.srcObject !== call.state.remoteStream) {
                    el.srcObject = call.state.remoteStream;
                  }
                }
              }}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            {/* Local Stream Video PIP */}
            <div className="absolute right-4 top-4 h-32 w-24 overflow-hidden rounded-2xl border-2 border-white/30 shadow-2xl md:h-48 md:w-36">
              <video
                ref={(el) => {
                  if (el && call.state.localStream) {
                    if (el.srcObject !== call.state.localStream) {
                      el.srcObject = call.state.localStream;
                    }
                  }
                }}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            </div>
            {/* Call Participant Label */}
            <div className="absolute left-4 top-4 rounded-xl bg-black/40 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">{headerName}</p>
              <p className="text-xs text-white/70">Connected</p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-center gap-6 bg-black/80 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <MuteButton localStream={call.state.localStream} />
            <button
              onClick={() => call.hangup()}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 shadow-lg shadow-rose-500/40 transition hover:bg-rose-600"
            >
              <Phone className="h-7 w-7 rotate-[135deg] text-white" />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30">
              <Video className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ── Mic Mute Toggle ──
function MuteButton({ localStream }: { localStream: MediaStream | null }) {
  const [muted, setMuted] = useState(false);
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setMuted((prev) => !prev);
    }
  };
  return (
    <button
      onClick={toggleMute}
      className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
        muted ? "bg-white text-slate-900" : "bg-white/20 text-white hover:bg-white/30"
      }`}
    >
      {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </button>
  );
}
