"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  MessageCircle,
  Send,
  X,
  Circle,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import {
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  markMessagesAsRead,
  getMemberActivity,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/utils";

// DB-backed helpers
async function dbFetchThread(user1: string, user2: string) {
  try {
    const res = await fetch(
      `/api/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`
    );
    const data = await res.json();
    if (!res.ok || !data?.success) return [] as ChatMessage[];
    return (data.data || []).map((row: any) => ({
      id: String(row.id),
      fromUser: row.from_user,
      toUser: row.to_user,
      message: row.message,
      timestamp: new Date(row.created_at).getTime(),
      read: !!row.is_read,
    }));
  } catch (error) {
    // Silently fail - API might not be available
    return [] as ChatMessage[];
  }
}

async function dbSendMessage(
  fromUser: string,
  toUser: string,
  message: string
) {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromUser, toUser, message }),
  });
  return res.ok;
}

async function dbMarkRead(currentUser: string, otherUser: string) {
  await fetch("/api/messages/mark-read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentUser, otherUser }),
  });
}

async function dbFetchConversations(user: string): Promise<ChatConversation[]> {
  // Don't make API call if not in database mode
  if (!shouldUseDatabaseData()) return [];

  try {
    const res = await fetch(
      `/api/messages/conversations?user=${encodeURIComponent(user)}`
    );
    const data = await res.json();
    if (!res.ok || !data?.success) return [];
    return (data.data || []).map((row: any) => ({
      withUser: row.withUser,
      lastMessage: row.lastMessage,
      lastTimestamp: new Date(row.lastTimestamp).getTime(),
      unreadCount: row.unreadCount || 0,
      isOnline: false,
    }));
  } catch (error) {
    // Silently fail - API might not be available in mock mode
    return [];
  }
}

type ChatWindowProps = {
  currentUser: string;
  targetUser: string;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
};

function ChatWindow({
  currentUser,
  targetUser,
  onClose,
  isMinimized,
  onToggleMinimize,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activity, setActivity] = useState(getMemberActivity(targetUser));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    if (shouldUseDatabaseData()) {
      dbMarkRead(currentUser, targetUser);
    } else {
      markMessagesAsRead(currentUser, targetUser);
    }

    const interval = setInterval(() => {
      loadMessages();
      setActivity(getMemberActivity(targetUser));
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser, targetUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (shouldUseDatabaseData()) {
      const msgs = await dbFetchThread(currentUser, targetUser);
      setMessages(msgs);
    } else {
      const msgs = getChatMessages(currentUser, targetUser);
      setMessages(msgs);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (shouldUseDatabaseData()) {
      const success = await dbSendMessage(
        currentUser,
        targetUser,
        newMessage.trim()
      );
      if (success) {
        setNewMessage("");
        await loadMessages();
      }
    } else {
      sendChatMessage(currentUser, targetUser, newMessage.trim());
      setNewMessage("");
      await loadMessages();
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50 shadow-2xl rounded-lg overflow-hidden border border-border bg-card">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm font-semibold">
              {targetUser.charAt(0).toUpperCase()}
            </div>
            <Circle
              className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 ${getStatusColor(activity?.currentStatus)} rounded-full fill-current`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{targetUser}</h3>
            <p className="text-xs opacity-80">
              {activity?.currentStatus === "online"
                ? "Online"
                : activity?.currentStatus === "away"
                  ? "Away"
                  : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-1.5 hover:bg-primary-foreground/20 rounded transition-colors cursor-pointer"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-primary-foreground/20 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-secondary/30">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.fromUser === currentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      msg.fromUser === currentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border"
                    }`}
                  >
                    <p className="text-sm wrap-break-word">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.fromUser === currentUser
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card">
            {activity?.currentStatus !== "online" && (
              <p className="text-xs text-muted-foreground text-center py-1 mb-2">
                {targetUser} is offline. Your message will be delivered when
                they return.
              </p>
            )}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button onClick={handleSend} size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type TeamChatProps = {
  currentUser: string;
};

export function TeamChat({ currentUser }: TeamChatProps) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [simulatedUnread, setSimulatedUnread] = useState(0);

  // Track if we're on chat page (for conditional rendering, NOT for hooks)
  const isOnChatPage = pathname?.startsWith("/chat");

  useEffect(() => {
    // Don't load conversations if on chat page
    if (isOnChatPage) return;

    loadConversations();
    const interval = setInterval(loadConversations, 5000);

    // Listen for chat open requests from other components
    const handleOpenChat = (event: CustomEvent) => {
      const { memberName } = event.detail;
      if (memberName && memberName !== currentUser) {
        openChat(memberName);
      }
    };

    window.addEventListener("openTeamChat", handleOpenChat as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "openTeamChat",
        handleOpenChat as EventListener
      );
    };
  }, [currentUser, isOnChatPage]);

  // Listen for simulated chat notifications to update unread count
  useEffect(() => {
    // Don't track notifications if on chat page
    if (isOnChatPage) return;

    const handleNewMessage = () => {
      setSimulatedUnread((prev) => Math.min(prev + 1, 9));
    };

    window.addEventListener("chatNotification", handleNewMessage);
    return () =>
      window.removeEventListener("chatNotification", handleNewMessage);
  }, [isOnChatPage]);

  const loadConversations = async () => {
    if (shouldUseDatabaseData()) {
      const convs = await dbFetchConversations(currentUser);
      setConversations(convs);
    } else {
      const convs = getChatConversations(currentUser);
      setConversations(convs);
    }
  };

  const openChat = (user: string) => {
    setActiveChat(user);
    setShowConversations(false);
    setIsMinimized(false);
    // Clear simulated unread when opening chat
    setSimulatedUnread(0);
  };

  // Use real unread from conversations, or simulated unread for dummy mode
  const conversationUnread = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );
  const totalUnread =
    conversationUnread > 0 ? conversationUnread : simulatedUnread;

  // Hide on /chat page - use the full chat page instead
  // This must be AFTER all hooks to comply with React rules of hooks
  if (isOnChatPage) {
    return null;
  }

  return (
    <>
      {/* Chat Button */}
      {!activeChat && (
        <button
          onClick={() => {
            setShowConversations(!showConversations);
            // Clear simulated unread when opening list
            if (!showConversations) setSimulatedUnread(0);
          }}
          className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all cursor-pointer z-40 flex items-center justify-center"
          title="Team Chat"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Conversations List */}
      {showConversations && !activeChat && (
        <Card className="fixed bottom-20 right-4 w-80 max-h-96 z-50 shadow-2xl overflow-hidden">
          <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
            <h3 className="font-semibold">Team Chat</h3>
            <button
              onClick={() => setShowConversations(false)}
              className="p-1 hover:bg-primary-foreground/20 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-80">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No conversations yet</p>
                <p className="text-xs mt-1">
                  Click on a team member to start chatting
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.withUser}
                  onClick={() => openChat(conv.withUser)}
                  className="w-full p-3 hover:bg-secondary transition-colors text-left border-b border-border cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-semibold">
                          {conv.withUser.charAt(0).toUpperCase()}
                        </div>
                        <Circle
                          className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 ${
                            conv.isOnline ? "bg-green-500" : "bg-gray-400"
                          } rounded-full fill-current`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {conv.withUser}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conv.lastTimestamp).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Active Chat Window */}
      {activeChat && (
        <ChatWindow
          currentUser={currentUser}
          targetUser={activeChat}
          onClose={() => {
            setActiveChat(null);
            loadConversations();
          }}
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
        />
      )}
    </>
  );
}
