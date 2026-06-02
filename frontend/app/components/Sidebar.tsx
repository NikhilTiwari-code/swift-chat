"use client";

import { useSelector } from "react-redux";
import { useAppDispatch } from "../store/hooks";
import type { RootState } from "../store/store";
import { selectConversation } from "../store/chatsSlice";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageSquarePlus, Settings, Users } from "lucide-react";
import Link from "next/link";
import type { MockConversation } from "../data/mock";
import type { Conversation } from "../lib/types";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { createConversation } from "../store/chatsSlice";
import toast from "react-hot-toast";

export function Sidebar() {
  const dispatch = useAppDispatch();
  const conversations = useSelector<RootState, RootState["chats"]["conversations"]>(
    (state) => state.chats.conversations
  );
  const activeConversationId = useSelector<RootState, RootState["chats"]["activeConversationId"]>(
    (state) => state.chats.activeConversationId
  );
  const user = useSelector<RootState, RootState["auth"]["user"]>((state) => state.auth.user);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState<Array<{ id: string; username: string; email: string; avatarUrl?: string | null }>>([]);
  const [results, setResults] = useState<Array<{ id: string; username: string; email: string; avatarUrl?: string | null }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const { data } = await api.get('/users/all');
        setAllUsers(data.users ?? []);
        setResults(data.users ?? []);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    if (showModal) {
      fetchAllUsers();
    }
  }, [showModal]);

  useEffect(() => {
    if (!showModal || !query.trim()) {
      setResults(allUsers);
      return;
    }
    const filtered = allUsers.filter((u) => 
      u.username.toLowerCase().includes(query.toLowerCase()) || 
      u.email.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query, showModal, allUsers]);

  return (
    <aside className="hidden w-90 shrink-0 border-r border-white/10 bg-[#075e54] text-white md:flex md:flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatarUrl ?? "https://i.pravatar.cc/100?img=1"}
            alt={user?.username ?? "User"}
            className="h-11 w-11 rounded-full border border-white/20"
          />
          <div>
            <p className="text-sm font-semibold">{user?.username ?? "You"}</p>
            <p className="text-xs text-emerald-200">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <button
            className="rounded-lg p-2 hover:bg-white/10"
            aria-label="New chat"
            onClick={() => setShowModal(true)}
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
          <button className="rounded-lg p-2 hover:bg-white/10" aria-label="Groups">
            <Users className="h-5 w-5" />
          </button>
          <Link href="/profile" className="rounded-lg p-2 hover:bg-white/10" aria-label="Profile">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
          <Search className="h-4 w-4 text-white/70" />
          <input
            className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
            placeholder="Search or start new chat"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {(conversations as Conversation[]).map((chat) => {
          const isActive = chat.id === activeConversationId;
          const lastMessage = chat.messages?.[0]?.content ?? "Start a conversation";
          const lastTime = chat.lastMessageAt ?? chat.messages?.[0]?.createdAt;
          const otherParticipant = chat.participants.find((p) => p.userId !== user?.id)?.user;
          const displayName = chat.type === "GROUP" ? chat.title ?? "Group" : otherParticipant?.username ?? "Direct chat";
          const displayAvatar =
            chat.type === "GROUP"
              ? "https://i.pravatar.cc/100?img=5"
              : otherParticipant?.avatarUrl ?? "https://i.pravatar.cc/100?img=32";
          return (
            <button
              key={chat.id}
              onClick={() => dispatch(selectConversation(chat.id))}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                isActive ? "bg-white/15" : "hover:bg-white/10"
              }`}
            >
              <img
                src={displayAvatar}
                alt={displayName}
                className="h-12 w-12 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{displayName}</p>
                  <span className="text-[11px] text-white/70">
                    {lastTime
                      ? formatDistanceToNow(new Date(lastTime), { addSuffix: false })
                      : ""}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-white/70">{lastMessage}</p>
              </div>
            </button>
          );
        })}
      </div>

      {showModal ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Start a new chat</h3>
              <button className="text-sm text-slate-500" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={isGroup}
                  onChange={(e) => {
                    setIsGroup(e.target.checked);
                    setSelectedIds([]);
                    setGroupTitle("");
                  }}
                />
                Create group
              </label>
              {isGroup ? (
                <input
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="Group name"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              ) : null}
            </div>
            <div className="mt-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username or email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
            <div className="mt-4 max-h-64 overflow-y-auto">
              {results.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                  onClick={() => {
                    if (isGroup) {
                      setSelectedIds((prev) =>
                        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                      );
                    } else {
                      dispatch(
                        createConversation({
                          type: "DIRECT",
                          participantIds: [item.id]
                        })
                      );
                      setShowModal(false);
                      setQuery("");
                      setResults([]);
                    }
                  }}
                >
                  <img
                    src={item.avatarUrl ?? "https://i.pravatar.cc/100?img=5"}
                    className="h-10 w-10 rounded-full"
                    alt={item.username}
                  />
                  <div>
                    <p className="text-sm font-semibold">{item.username}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                  </div>
                  {isGroup ? (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => {
                        setSelectedIds((prev) =>
                          prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                        );
                      }}
                      className="ml-auto h-4 w-4"
                    />
                  ) : null}
                </button>
              ))}
              {!results.length && query ? (
                <p className="text-sm text-slate-500">No users found.</p>
              ) : null}
            </div>
            {isGroup ? (
              <button
                className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                disabled={selectedIds.length < 1 || !groupTitle.trim() || isCreatingGroup}
                onClick={async () => {
                  if (isCreatingGroup) return;
                  try {
                    setIsCreatingGroup(true);
                    await dispatch(
                      createConversation({
                        type: "GROUP",
                        title: groupTitle.trim(),
                        participantIds: selectedIds
                      })
                    ).unwrap();
                    setShowModal(false);
                    setQuery("");
                    setResults([]);
                    setSelectedIds([]);
                    setGroupTitle("");
                    setIsGroup(false);
                  } catch {
                    toast.error("Failed to create group");
                  } finally {
                    setIsCreatingGroup(false);
                  }
                }}
              >
                {isCreatingGroup ? "Creating..." : "Create group"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
