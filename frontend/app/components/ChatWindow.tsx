"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { Video, MoreVertical, Search, Image as ImageIcon } from "lucide-react";
import { MessageComposer } from "@/app/components/MessageComposer";
import type { RootState } from "../store/store";
import type { MockMessage, MockConversation } from "../data/mock";
import type { Message, Conversation } from "../lib/types";
import { useAppDispatch } from "../store/hooks";
import { deleteChatMessage, fetchMessages, removeMessage } from "../store/chatsSlice";
import { useCall } from "../hooks/useCall";
import { api } from "../lib/api";
import type { MediaItem } from "../lib/types";

export function ChatWindow() {
  const dispatch = useAppDispatch();
  const conversations = useSelector<RootState, RootState["chats"]["conversations"]>(
    (state) => state.chats.conversations
  );
  const activeConversationId = useSelector<RootState, RootState["chats"]["activeConversationId"]>(
    (state) => state.chats.activeConversationId
  );
  const messages = useSelector<RootState, RootState["chats"]["messages"]>(
    (state) => state.chats.messages
  );
  const user = useSelector<RootState, RootState["auth"]["user"]>((state) => state.auth.user);
  const typingUsers = useSelector<RootState, RootState["chats"]["typingByConversation"]>(
    (state) => state.chats.typingByConversation
  );
  const activeConversation = (conversations as Conversation[]).find(
    (item) => item.id === activeConversationId
  );
  const otherParticipant = activeConversation?.participants.find((p) => p.userId !== user?.id)?.user;
  const headerName =
    activeConversation?.type === "GROUP"
      ? activeConversation?.title ?? "Group"
      : otherParticipant?.username ?? "Direct chat";
  const headerAvatar =
    activeConversation?.type === "GROUP"
      ? "https://i.pravatar.cc/100?img=5"
      : otherParticipant?.avatarUrl ?? "https://i.pravatar.cc/100?img=12";
  const thread = activeConversationId ? (messages[activeConversationId] ?? []) : [];
  const call = useCall(activeConversationId ?? null, user?.id ?? null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);


  useEffect(() => {
    if (activeConversationId) {
      dispatch(fetchMessages({ conversationId: activeConversationId }));
    }
  }, [activeConversationId, dispatch]);

  useEffect(() => {
    if (!searchOpen || !activeConversationId) return;
    const handle = setTimeout(async () => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 2) {
        setSearchResults([]);
        return;
      }
      const { data } = await api.get(`/chats/${activeConversationId}/search?q=${encodeURIComponent(trimmed)}`);
      setSearchResults(data.messages ?? []);
    }, 200);

    return () => clearTimeout(handle);
  }, [searchOpen, searchQuery, activeConversationId]);

  useEffect(() => {
    if (!mediaOpen || !activeConversationId) return;
    const load = async () => {
      const { data } = await api.get(`/chats/${activeConversationId}/media`);
      setMediaItems(data.items ?? []);
    };
    load();
  }, [mediaOpen, activeConversationId]);

  const grouped = useMemo(() => {
    return [...(thread as Message[])]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((message) => ({
      ...message,
      time: format(new Date(message.createdAt), "p")
    }));
  }, [thread]);

  if (!activeConversation) {
    return (
      <section className="flex flex-1 items-center justify-center bg-[#f0f2f5]">
        <p className="text-sm text-slate-500">Select a conversation to start chatting</p>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col bg-[#f0f2f5]">
      <header className="flex items-center justify-between border-b border-slate-200/60 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src={headerAvatar}
            className="h-11 w-11 rounded-full"
            alt={headerName}
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">{headerName}</p>
            <p className="text-xs text-emerald-600">
              {typingUsers[activeConversation.id]?.length ? "typing..." : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </button>
          <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="Media" onClick={() => setMediaOpen(true)}>
            <ImageIcon className="h-5 w-5" />
          </button>
          <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="More">
            <MoreVertical className="h-5 w-5" />
          </button>
            <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="Video call" onClick={() => call.startCall(true)}>
              <Video className="h-5 w-5" />
            </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {grouped.map((message: Message & { time: string }) => {
            const isMine = message.senderId === user?.id || message.sender?.id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
              >
                {!isMine ? (
                  <img
                    src={message.sender?.avatarUrl ?? "https://i.pravatar.cc/100?img=12"}
                    alt={message.sender?.username ?? "User"}
                    className="h-8 w-8 rounded-full"
                  />
                ) : null}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    isMine
                      ? "bg-emerald-500 text-white rounded-br-md"
                      : "bg-white text-slate-900 rounded-bl-md"
                  }`}
                >
                  {!isMine && message.sender?.username ? (
                    <p className="mb-1 text-[11px] font-semibold text-emerald-600">
                      {message.sender.username}
                    </p>
                  ) : null}
                  {isMine ? (
                    <button
                      className="mb-1 text-[10px] text-emerald-100/90 hover:text-white"
                      onClick={() => {
                        dispatch(deleteChatMessage({
                          conversationId: activeConversationId!,
                          messageId: message.id
                        }));
                        dispatch(removeMessage({
                          conversationId: activeConversationId!,
                          messageId: message.id
                        }));
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                  {message.type === "IMAGE" && message.attachments?.[0]?.url ? (
                    <img
                      src={message.attachments[0].url}
                      alt={message.content}
                      className="mb-2 w-full max-w-xs rounded-xl"
                    />
                  ) : null}
                  {message.type === "FILE" && message.attachments?.[0]?.url ? (
                    <a
                      href={message.attachments[0].url}
                      target="_blank"
                      rel="noreferrer"
                      className={`mb-2 inline-block rounded-lg px-3 py-2 text-xs font-semibold ${
                        isMine ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      Download {message.content}
                    </a>
                  ) : null}
                  <p>{message.content}</p>
                  <div className={`mt-2 text-[10px] ${isMine ? "text-emerald-100" : "text-slate-400"}`}>
                    {message.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MessageComposer conversationId={activeConversationId!} />

      {searchOpen ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Search messages</h3>
              <button className="text-sm text-slate-500" onClick={() => setSearchOpen(false)}>
                Close
              </button>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in conversation"
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <div className="mt-4 max-h-96 overflow-y-auto">
              {searchResults.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-500">{item.sender?.username ?? "User"}</p>
                  <p className="text-sm text-slate-900">{item.content}</p>
                </div>
              ))}
              {!searchResults.length && searchQuery ? (
                <p className="text-sm text-slate-500">No messages found.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {mediaOpen ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Media gallery</h3>
              <button className="text-sm text-slate-500" onClick={() => setMediaOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              {mediaItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 p-2">
                  {item.type === "image" || item.type === "image/jpeg" || item.type === "image/png" ? (
                    <img src={item.url} alt={item.message.content} className="h-32 w-full rounded-lg object-cover" />
                  ) : (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-emerald-600"
                    >
                      {item.message.content}
                    </a>
                  )}
                </div>
              ))}
            </div>
            {!mediaItems.length ? <p className="mt-4 text-sm text-slate-500">No media yet.</p> : null}
          </div>
        </div>
      ) : null}
      {call.state.incoming ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white p-6 text-center shadow-xl">
            <p className="text-sm text-slate-600">Incoming call...</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={call.answerCall}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Answer
              </button>
              <button
                onClick={() => call.hangup()}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {call.state.active ? (
        <div className="absolute inset-0 z-20 flex flex-col bg-black/90">
          <div className="flex-1 p-6">
            <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
              <video
                ref={(el) => {
                  if (el && call.state.localStream) {
                    el.srcObject = call.state.localStream;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="h-full w-full rounded-2xl bg-black object-cover"
              />
              <video
                ref={(el) => {
                  if (el && call.state.remoteStream) {
                    el.srcObject = call.state.remoteStream;
                  }
                }}
                autoPlay
                playsInline
                className="h-full w-full rounded-2xl bg-black object-cover"
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 bg-black/80 p-4">
            <button
              onClick={() => call.hangup()}
              className="rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white"
            >
              End call
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
