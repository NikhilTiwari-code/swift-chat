export type User = {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  status?: string | null;
  lastSeenAt?: string | null;
};

export type Conversation = {
  id: string;
  type: "DIRECT" | "GROUP";
  title?: string | null;
  lastMessageAt?: string | null;
  participants: {
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    user?: { id: string; username: string; email: string; avatarUrl?: string | null };
  }[];
  messages?: Message[];
};

export type MessageStatus = {
  id: string;
  messageId: string;
  userId: string;
  status: "SENT" | "DELIVERED" | "READ";
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type?: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  createdAt: string;
  updatedAt: string;
  sender?: { id: string; username: string; email: string; avatarUrl?: string | null };
  statuses?: MessageStatus[];
  attachments?: { id: string; url: string; type: string; size?: number | null }[];
};

export type MediaItem = {
  id: string;
  url: string;
  type: string;
  size?: number | null;
  createdAt: string;
  message: { id: string; content: string; createdAt: string; senderId: string };
};
