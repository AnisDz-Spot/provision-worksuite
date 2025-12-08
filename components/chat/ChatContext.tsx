"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  getChatMessages,
  sendChatMessage as sendMsg,
  markMessagesAsRead as markRead,
  getActiveChatUser,
  setActiveChatUser,
  type ChatMessage,
} from "@/lib/utils/team-utilities";

type ChatContextType = {
  messages: ChatMessage[];
  activeChat: string;
  unreadCount: number;
  setActiveChat: (user: string) => void;
  sendMessage: (message: string) => void;
  markAsRead: () => void;
  refreshMessages: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentUser] = useState("You");
  const [activeChat, setActiveChatState] = useState<string>("Alice Johnson");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial active chat from storage
  useEffect(() => {
    const stored = getActiveChatUser();
    if (stored) {
      setActiveChatState(stored);
    }
  }, []);

  // Refresh messages periodically
  useEffect(() => {
    const loadMessages = () => {
      const msgs = getChatMessages(currentUser, activeChat);
      setMessages(msgs);

      // Calculate unread count
      const unread = msgs.filter(
        (m) => m.fromUser !== currentUser && !m.read
      ).length;
      setUnreadCount(unread);
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChat, currentUser]);

  const setActiveChat = useCallback((user: string) => {
    setActiveChatState(user);
    setActiveChatUser(user);
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      sendMsg(currentUser, activeChat, message.trim());
      // Immediately refresh messages
      setMessages(getChatMessages(currentUser, activeChat));
    },
    [currentUser, activeChat]
  );

  const markAsRead = useCallback(() => {
    markRead(currentUser, activeChat);
    setMessages(getChatMessages(currentUser, activeChat));
    setUnreadCount(0);
  }, [currentUser, activeChat]);

  const refreshMessages = useCallback(() => {
    setMessages(getChatMessages(currentUser, activeChat));
  }, [currentUser, activeChat]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        activeChat,
        unreadCount,
        setActiveChat,
        sendMessage,
        markAsRead,
        refreshMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

// Optional hook that doesn't throw if outside provider
export function useChatContextOptional() {
  return useContext(ChatContext);
}
