import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../lib/api";
import type { Conversation, Message } from "../lib/types";

export type ChatsState = {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  status: "idle" | "loading" | "error";
  typingByConversation: Record<string, string[]>;
};

const initialState: ChatsState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  status: "idle",
  typingByConversation: {}
};

export const fetchConversations = createAsyncThunk("chats/list", async () => {
  const { data } = await api.get("/chats");
  return data.conversations as Conversation[];
});

export const fetchMessages = createAsyncThunk(
  "chats/messages",
  async ({ conversationId }: { conversationId: string }) => {
    const { data } = await api.get(`/chats/${conversationId}/messages`);
    return { conversationId, messages: data.messages as Message[] };
  }
);

export const sendChatMessage = createAsyncThunk(
  "chats/send",
  async ({
    conversationId,
    content,
    type,
    attachment,
    senderId
  }: {
    conversationId: string;
    content: string;
    type?: "TEXT" | "IMAGE" | "FILE";
    attachment?: { url: string; type: string; size?: number };
    senderId?: string;
    clientId?: string;
  }) => {
    const { data } = await api.post(`/chats/${conversationId}/messages`, {
      content,
      type,
      attachment
    });
    return { conversationId, message: data.message as Message };
  }
);

export const createConversation = createAsyncThunk(
  "chats/create",
  async ({ type, title, participantIds }: { type: "DIRECT" | "GROUP"; title?: string; participantIds: string[] }) => {
    const { data } = await api.post("/chats", { type, title, participantIds });
    return data.conversation as Conversation;
  }
);

export const deleteChatMessage = createAsyncThunk(
  "chats/delete",
  async ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
    await api.delete(`/chats/${conversationId}/messages/${messageId}`);
    return { conversationId, messageId };
  }
);

const chatsSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    selectConversation(state, action: PayloadAction<string>) {
      state.activeConversationId = action.payload;
    },
    receiveMessage(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      const exists = state.messages[conversationId].some((item) => item.id === message.id);
      if (!exists) {
        state.messages[conversationId].push(message);
      }
    },
    removeMessage(state, action: PayloadAction<{ conversationId: string; messageId: string }>) {
      const { conversationId, messageId } = action.payload;
      state.messages[conversationId] = (state.messages[conversationId] ?? []).filter(
        (message) => message.id !== messageId
      );
    },
    setTyping(state, action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>) {
      const { conversationId, userId, isTyping } = action.payload;
      const current = state.typingByConversation[conversationId] ?? [];
      if (isTyping && !current.includes(userId)) {
        state.typingByConversation[conversationId] = [...current, userId];
      }
      if (!isTyping) {
        state.typingByConversation[conversationId] = current.filter((id) => id !== userId);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = "idle";
        state.conversations = action.payload;
        if (!state.activeConversationId && action.payload.length > 0) {
          state.activeConversationId = action.payload[0].id;
        }
      })
      .addCase(fetchConversations.rejected, (state) => {
        state.status = "error";
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(sendChatMessage.pending, (state, action) => {
        const { conversationId, content, type, attachment, senderId, clientId } = action.meta.arg as {
          conversationId: string;
          content: string;
          type?: "TEXT" | "IMAGE" | "FILE";
          attachment?: { url: string; type: string; size?: number };
          senderId?: string;
          clientId?: string;
        };
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        if (clientId) {
          state.messages[conversationId].push({
            id: clientId,
            conversationId,
            senderId: senderId ?? "",
            content,
            type: type ?? "TEXT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            attachments: attachment ? [{ id: clientId, url: attachment.url, type: attachment.type, size: attachment.size }] : []
          });
        }
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId] = state.messages[conversationId].filter(
          (item) => !item.id.startsWith("temp-")
        );
        const exists = state.messages[conversationId].some((item) => item.id === message.id);
        if (!exists) {
          state.messages[conversationId].push(message);
        }
      })
      .addCase(deleteChatMessage.fulfilled, (state, action) => {
        state.messages[action.payload.conversationId] = (
          state.messages[action.payload.conversationId] ?? []
        ).filter((message) => message.id !== action.payload.messageId);
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload);
        state.activeConversationId = action.payload.id;
      });
  }
});

export const { selectConversation, receiveMessage, setTyping, removeMessage } = chatsSlice.actions;
export default chatsSlice.reducer;
