"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Users, Check, X } from "lucide-react";
import { useAppDispatch } from "../store/hooks";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { createConversation } from "../store/chatsSlice";
import { api } from "../lib/api";
import { Avatar } from "./Avatar";
import toast from "react-hot-toast";

type User = { id: string; username: string; email: string; avatarUrl?: string | null };

export function NewChatPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [results, setResults] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    api.get("/users/all").then(({ data }) => {
      const users = (data.users ?? []).filter((u: User) => u.id !== currentUser?.id);
      setAllUsers(users);
      setResults(users);
    });
  }, [currentUser?.id]);

  useEffect(() => {
    if (!query.trim()) { setResults(allUsers); return; }
    setResults(
      allUsers.filter((u) =>
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [query, allUsers]);

  const startDirect = async (userId: string) => {
    try {
      await dispatch(createConversation({ type: "DIRECT", participantIds: [userId] })).unwrap();
      router.push("/chats");
    } catch {
      toast.error("Failed to start chat");
    }
  };

  const createGroup = async () => {
    if (isCreating) return;
    try {
      setIsCreating(true);
      await dispatch(
        createConversation({ type: "GROUP", title: groupTitle.trim(), participantIds: selectedIds })
      ).unwrap();
      toast.success("Group created! 🎉");
      router.push("/chats");
    } catch {
      toast.error("Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="flex h-full flex-col bg-white">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-4 pt-5">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white">
            {isGroup ? "New Group" : "New Chat"}
          </h1>
          <p className="text-xs text-emerald-200">
            {isGroup
              ? `${selectedIds.length} of ${allUsers.length} selected`
              : `${allUsers.length} contacts`}
          </p>
        </div>
        {/* Group Toggle */}
        <button
          onClick={() => { setIsGroup(!isGroup); setSelectedIds([]); setGroupTitle(""); }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            isGroup
              ? "bg-white text-emerald-700"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Group
        </button>
      </div>

      {/* ── Group Name Input (when group mode) ── */}
      {isGroup && (
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <input
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder="Enter group name..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus={!isGroup}
          />
          {query ? (
            <button onClick={() => setQuery("")}>
              <X className="h-4 w-4 text-slate-400" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Selected chips (group mode) ── */}
      {isGroup && selectedIds.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3">
          {selectedIds.map((id) => {
            const u = allUsers.find((x) => x.id === id);
            if (!u) return null;
            return (
              <button
                key={id}
                onClick={() => toggleSelect(id)}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <div className="relative">
                  <Avatar name={u.username} avatarUrl={u.avatarUrl} size="sm" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-white">
                    <X className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                </div>
                <span className="max-w-[48px] truncate text-[10px] text-slate-600">{u.username}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Users List ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Section header */}
        {!query && (
          <p className="px-5 pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {isGroup ? "Select Members" : "All Contacts"}
          </p>
        )}

        {results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Search className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        )}

        {results.map((u) => {
          const selected = selectedIds.includes(u.id);
          return (
            <button
              key={u.id}
              onClick={() => isGroup ? toggleSelect(u.id) : startDirect(u.id)}
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              <Avatar name={u.username} avatarUrl={u.avatarUrl} size="md" />
              <div className="flex-1 min-w-0 border-b border-slate-100 pb-3.5 -mb-3.5">
                <p className="truncate text-[15px] font-semibold text-slate-900">{u.username}</p>
                <p className="truncate text-sm text-slate-500 mt-0.5">{u.email}</p>
              </div>
              {isGroup ? (
                <div className={`ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  selected
                    ? "border-emerald-500 bg-emerald-500 scale-110"
                    : "border-slate-300"
                }`}>
                  {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── Create Group CTA ── */}
      {isGroup && (
        <div className="border-t border-slate-100 bg-white px-5 py-4">
          <button
            disabled={selectedIds.length < 1 || !groupTitle.trim() || isCreating}
            onClick={createGroup}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCreating ? (
              "Creating group..."
            ) : (
              <>
                <Users className="h-4 w-4" />
                Create Group · {selectedIds.length} members
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
