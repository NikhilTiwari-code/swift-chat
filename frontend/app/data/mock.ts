export type MockUser = {
  id: string;
  name: string;
  avatar: string;
  status: string;
  lastSeen: string;
};

export type MockMessage = {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
};

export type MockConversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  isGroup?: boolean;
};

export const mockUsers: MockUser[] = [
  {
    id: "u1",
    name: "You",
    avatar: "https://i.pravatar.cc/100?img=32",
    status: "Online",
    lastSeen: new Date().toISOString()
  },
  {
    id: "u2",
    name: "Aarav Mehta",
    avatar: "https://i.pravatar.cc/100?img=12",
    status: "Typing...",
    lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: "u3",
    name: "Product Team",
    avatar: "https://i.pravatar.cc/100?img=5",
    status: "Last seen 2h ago",
    lastSeen: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: "u4",
    name: "Neha Kapoor",
    avatar: "https://i.pravatar.cc/100?img=47",
    status: "Online",
    lastSeen: new Date().toISOString()
  }
];

export const mockConversations: MockConversation[] = [
  {
    id: "c1",
    name: "Aarav Mehta",
    avatar: "https://i.pravatar.cc/100?img=12",
    lastMessage: "Are we on for the demo today?",
    lastTime: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    unread: 2
  },
  {
    id: "c2",
    name: "Product Team",
    avatar: "https://i.pravatar.cc/100?img=5",
    lastMessage: "Pinned: Updated roadmap is live",
    lastTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: 0,
    isGroup: true
  },
  {
    id: "c3",
    name: "Neha Kapoor",
    avatar: "https://i.pravatar.cc/100?img=47",
    lastMessage: "Sending the files now.",
    lastTime: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    unread: 1
  }
];

export const mockMessagesByConversation: Record<string, MockMessage[]> = {
  c1: [
    {
      id: "m1",
      senderId: "u2",
      content: "Hey! Just confirming the time for today.",
      timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      status: "read"
    },
    {
      id: "m2",
      senderId: "u1",
      content: "Yes, 3 PM works for me.",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      status: "read"
    },
    {
      id: "m3",
      senderId: "u2",
      content: "Great. I will share the link shortly.",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      status: "delivered"
    }
  ],
  c2: [
    {
      id: "m4",
      senderId: "u3",
      content: "Pinned: Updated roadmap is live",
      timestamp: new Date(Date.now() - 1000 * 60 * 33).toISOString(),
      status: "read"
    },
    {
      id: "m5",
      senderId: "u1",
      content: "Reviewing and adding comments now.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: "read"
    }
  ],
  c3: [
    {
      id: "m6",
      senderId: "u4",
      content: "Sending the files now.",
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      status: "read"
    }
  ]
};
