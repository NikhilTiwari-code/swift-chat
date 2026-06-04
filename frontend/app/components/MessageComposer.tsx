"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Paperclip, SmilePlus, Send } from "lucide-react";
import { useAppDispatch } from "../store/hooks";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { sendChatMessage } from "../store/chatsSlice";
import toast from "react-hot-toast";
import { api } from "../lib/api";

const schema = z.object({
  message: z.string().min(1, "Type a message")
});

type FormValues = z.infer<typeof schema>;
type EmojiCategory = {
  key: string;
  label: string;
  icon: string;
  emojis: string[];
};

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    key: "smileys",
    label: "Smileys",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
      "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
      "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
      "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏", "😒",
      "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
      "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡"
    ]
  },
  {
    key: "gestures",
    label: "Gestures",
    icon: "👍",
    emojis: [
      "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🫰",
      "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️",
      "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "👏", "🙌",
      "👐", "🤲", "🙏", "✍️", "💪", "🦾", "🫶", "💅"
    ]
  },
  {
    key: "love",
    label: "Love",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓",
      "💗", "💖", "💘", "💝", "💟", "♥️", "💌", "💋",
      "🌹", "🥀", "💍", "🫂", "😍", "🥰", "😘", "🫶"
    ]
  },
  {
    key: "people",
    label: "People",
    icon: "🧑",
    emojis: [
      "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "👩",
      "🧔", "👴", "👵", "🙍", "🙎", "🙅", "🙆", "💁",
      "🙋", "🧏", "🙇", "🤦", "🤷", "👮", "🕵️", "💂",
      "🥷", "👷", "🧑‍⚕️", "🧑‍🎓", "🧑‍💻", "🧑‍🍳", "🧑‍🚀", "🦸"
    ]
  },
  {
    key: "nature",
    label: "Nature",
    icon: "🌿",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
      "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
      "🐧", "🐦", "🦋", "🐝", "🐢", "🐍", "🦕", "🐙",
      "🌸", "🌼", "🌻", "🌹", "🌴", "🌵", "🌿", "🍀"
    ]
  },
  {
    key: "food",
    label: "Food",
    icon: "🍔",
    emojis: [
      "🍎", "🍌", "🍇", "🍉", "🍓", "🥭", "🍍", "🥥",
      "🥑", "🍅", "🥕", "🌽", "🥔", "🍞", "🥐", "🧀",
      "🍗", "🍖", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮",
      "🍜", "🍝", "🍛", "🍚", "🍩", "🍪", "🎂", "☕"
    ]
  },
  {
    key: "travel",
    label: "Travel",
    icon: "🚗",
    emojis: [
      "🚗", "🚕", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚲",
      "🛵", "🏍️", "🚂", "✈️", "🚀", "🛸", "🚁", "⛵",
      "🚢", "🏠", "🏢", "🏫", "🏥", "🏟️", "⛲", "⛰️",
      "🏖️", "🏝️", "🌋", "🌍", "🌙", "⭐", "⚡", "🔥"
    ]
  },
  {
    key: "objects",
    label: "Objects",
    icon: "💡",
    emojis: [
      "📱", "💻", "⌚", "📷", "🎧", "🎤", "🎮", "🕹️",
      "💡", "🔦", "📚", "✏️", "📌", "📎", "✂️", "🔒",
      "🔑", "💰", "💳", "🎁", "🎈", "🏆", "🥇", "⚽",
      "🏏", "🎯", "🎲", "🧩", "🛒", "🧸", "🪄", "✅"
    ]
  }
];

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([
    "😀", "😂", "😍", "🥰", "👍", "🙏", "❤️", "🔥"
  ]);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const helper = useMemo(() => errors.message?.message ?? "", [errors.message?.message]);
  const messageField = register("message");
  const emojiCategories = useMemo(
    () => [
      {
        key: "recent",
        label: "Recent",
        icon: "🕘",
        emojis: recentEmojis
      },
      ...EMOJI_CATEGORIES
    ],
    [recentEmojis]
  );
  const visibleEmojis =
    emojiCategories.find((category) => category.key === activeEmojiCategory)?.emojis ??
    emojiCategories[0].emojis;

  const insertEmoji = (emoji: string) => {
    const current = getValues("message") ?? "";
    const input = messageInputRef.current;
    const start = input?.selectionStart ?? current.length;
    const end = input?.selectionEnd ?? current.length;
    const next = `${current.slice(0, start)}${emoji}${current.slice(end)}`;

    setValue("message", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setRecentEmojis((items) => [emoji, ...items.filter((item) => item !== emoji)].slice(0, 24));

    requestAnimationFrame(() => {
      const cursor = start + emoji.length;
      messageInputRef.current?.focus();
      messageInputRef.current?.setSelectionRange(cursor, cursor);
    });
  };

  const onSubmit = (values: FormValues) => {
    const clientId = `temp-${Date.now()}`;
    dispatch(
      sendChatMessage({
        conversationId,
        content: values.message,
        type: "TEXT",
        senderId: user?.id,
        clientId
      })
    );
    toast.success("Message sent");
    reset();
    setEmojiOpen(false);
  };

  const handleFilePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const type = file.type.startsWith("image/") ? "IMAGE" : "FILE";
      dispatch(
        sendChatMessage({
          conversationId,
          content: file.name,
          type,
          attachment: { url: data.url, type: data.resourceType, size: data.bytes },
          senderId: user?.id,
          clientId: `temp-${Date.now()}`
        })
      );
      toast.success("File sent");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-t border-slate-200/60 bg-white px-4 py-3.5 md:px-6"
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative">
          <button
            type="button"
            className={`rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 ${
              emojiOpen ? "bg-emerald-50 text-emerald-600" : ""
            }`}
            aria-label="Open emoji picker"
            aria-expanded={emojiOpen}
            onClick={() => setEmojiOpen((open) => !open)}
          >
            <SmilePlus className="h-4.5 w-4.5" />
          </button>

          {emojiOpen ? (
            <div className="absolute bottom-12 left-0 z-30 w-[min(88vw,360px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Emoji wall
                </p>
                <p className="text-sm font-semibold text-slate-900">Pick an emoji</p>
              </div>
              <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
                {emojiCategories.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    title={category.label}
                    aria-label={category.label}
                    onClick={() => setActiveEmojiCategory(category.key)}
                    className={`h-9 w-9 shrink-0 rounded-lg text-lg transition hover:bg-slate-100 ${
                      activeEmojiCategory === category.key ? "bg-emerald-100" : ""
                    }`}
                  >
                    {category.icon}
                  </button>
                ))}
              </div>
              <div className="grid max-h-64 grid-cols-8 gap-1 overflow-y-auto p-3">
                {visibleEmojis.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-slate-100"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFilePick}
        />
        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="h-4.5 w-4.5" />
        </button>
        <div className="relative flex-1">
          <input
            {...messageField}
            ref={(node) => {
              messageField.ref(node);
              messageInputRef.current = node;
            }}
            placeholder="Type a message"
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-base text-slate-900 focus:border-emerald-400 focus:outline-none"
          />
          {helper ? (
            <span className="absolute left-4 top-13 text-[11px] text-rose-500">{helper}</span>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60 hover:scale-105 active:scale-95"
          aria-label={uploading ? "Uploading" : "Send message"}
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </div>
    </form>
  );
}
