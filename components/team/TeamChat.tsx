"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Trash2,
  Smile,
  Video,
  Phone,
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
import { fetchWithCsrf } from "@/lib/csrf-client";
import { playMessageTone } from "@/lib/notificationSound";

// DB-backed helpers are now imported from @/lib/utils/chat-db-utilities
import {
  dbFetchThread,
  dbSendMessage,
  dbMarkRead,
  dbDeleteMessage,
  dbDeleteThread,
  dbFetchConversations,
  getInitials,
} from "@/lib/utils";

type ChatWindowProps = {
  currentUser: string;
  targetUser: string;
  conversationId?: string;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  conversations?: ChatConversation[];
};

function ChatWindow({
  currentUser,
  targetUser,
  conversationId,
  onClose,
  isMinimized,
  onToggleMinimize,
  conversations = [],
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activity, setActivity] = useState(getMemberActivity(targetUser));
  const [targetName, setTargetName] = useState(() => {
    const conv = conversations.find(
      (c: ChatConversation) => c.withUser === targetUser
    );
    // If not found in convs, we can't do much yet but wait for the fetch
    // However, if targetUser doesn't look like a UUID, use it as is
    return conv?.withUserName || (targetUser.length > 30 ? "Chat" : targetUser);
  });
  const [targetAvatar, setTargetAvatar] = useState(() => {
    const conv = conversations.find(
      (c: ChatConversation) => c.withUser === targetUser
    );
    return conv?.withUserAvatar || "";
  });
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Update ref whenever messages change to avoid stale closures in polling
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadMessages = React.useCallback(async () => {
    if (shouldUseDatabaseData()) {
      const msgs = await dbFetchThread(currentUser, targetUser, conversationId);
      // Use ref to avoid stale closure in comparison logic for notification sound
      if (msgs.length > messagesRef.current.length) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.fromUser !== currentUser && !lastMsg.read) {
          playMessageTone();
        }
      }
      setMessages(msgs);

      // Only mark as read if there are unread messages from the other user
      // Optimization: Check local state first, but dbMarkRead is safe/idempotent anyway
      const hasUnread = msgs.some(
        (m: ChatMessage) => m.fromUser !== currentUser && !m.read
      );
      if (hasUnread) {
        dbMarkRead(currentUser, targetUser, conversationId);
      }
    } else {
      const msgs = getChatMessages(currentUser, targetUser);
      if (msgs.length > messagesRef.current.length) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.fromUser !== currentUser && !lastMsg.read) {
          playMessageTone();
        }
      }
      setMessages(msgs);
    }
  }, [currentUser, targetUser]);

  // Derived state: Find the last message sent by ME that was read by THEM
  const lastReadMessageId = React.useMemo(() => {
    // We want the last message where (fromUser === currentUser) AND (read === true)
    // Since messages are ordered by time, we can reverse find
    // But array.findLast might not be available in all envs yet, so let's iterate backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.fromUser === currentUser && msg.read) {
        return msg.id;
      }
    }
    return null;
  }, [messages, currentUser]);

  // Fetch target user details to resolve UUID to name
  useEffect(() => {
    if (shouldUseDatabaseData()) {
      fetch(`/api/users/${targetUser}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setTargetName(json.data.name);
            setTargetAvatar(json.data.avatar_url || json.data.avatarUrl);
          }
        });
    }
  }, [targetUser]);

  // Also sync with the conversations list we have in parent
  useEffect(() => {
    const conv = conversations.find((c) => c.withUser === targetUser);
    if (conv) {
      if (conv.withUserName) setTargetName(conv.withUserName);
      if (conv.withUserAvatar) setTargetAvatar(conv.withUserAvatar);
    }
  }, [conversations, targetUser]);

  useEffect(() => {
    loadMessages();
    if (shouldUseDatabaseData()) {
      dbMarkRead(currentUser, targetUser, conversationId);
    } else {
      markMessagesAsRead(currentUser, targetUser);
    }

    const interval = setInterval(() => {
      loadMessages();
      if (shouldUseDatabaseData()) {
        fetch("/api/presence", { cache: "no-store" })
          .then((res) => res.json())
          .then((json) => {
            if (json.success && json.data) {
              if (json.serverTime) {
                const serverDate = new Date(json.serverTime).getTime();
                const clientDate = Date.now();
                setServerTimeOffset(serverDate - clientDate);
              }

              const p = json.data.find((item: any) => item.uid === targetUser);
              if (p) {
                const nowOnServer = Date.now() + (serverTimeOffset || 0);
                const threshold = nowOnServer - 5 * 60 * 1000;
                // Use standardized lastSeen property
                const lastSeen = new Date(p.lastSeen).getTime();

                const normalizedStatus = (p.status || "").toLowerCase();
                const isOnline =
                  (normalizedStatus === "online" ||
                    normalizedStatus === "available") &&
                  lastSeen >= threshold;

                setActivity({
                  memberName: targetUser,
                  lastActive: lastSeen,
                  status: isOnline ? p.status || "available" : "offline",
                  currentStatus: isOnline ? "online" : "offline",
                });
              } else {
                setActivity({
                  memberName: targetUser,
                  lastActive: 0,
                  status: "offline",
                  currentStatus: "offline",
                });
              }
            }
          });
      } else {
        setActivity(getMemberActivity(targetUser));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser, targetUser, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDelete = async (id: string) => {
    if (shouldUseDatabaseData()) {
      const success = await dbDeleteMessage(id);
      if (success) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleDeleteThread = async () => {
    if (shouldUseDatabaseData()) {
      const success = await dbDeleteThread(
        currentUser,
        targetUser,
        conversationId
      );
      if (success) {
        setMessages([]);
        setShowDeleteConfirm(false);
        onClose();
      }
    } else {
      setMessages([]);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const msg = newMessage.trim();
    setNewMessage(""); // Clear early for better UX
    if (shouldUseDatabaseData()) {
      const res = await dbSendMessage(
        currentUser,
        targetUser,
        msg,
        conversationId
      );
      if (res.success) {
        await loadMessages();
      }
    } else {
      sendChatMessage(currentUser, targetUser, msg);
      await loadMessages();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleStartCall = async (type: "video" | "audio") => {
    if (!targetUser) return;

    try {
      // 1. Determine title and participants
      // In floating chat, we might not have all context, but we can try to guess
      const isGroup = conversations.some(
        (c) => c.withUser === targetUser && c.type === "group"
      );
      const conv = conversations.find((c) => c.withUser === targetUser);

      let title = targetName || "Meeting";
      let participantUids: string[] = [];

      if (isGroup) {
        // Fetch group members
        const res = await fetch(`/api/chat-groups/${targetUser}/members`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.members)) {
            participantUids = data.members.map((m: any) => m.uid);
          }
        }
      } else {
        // Direct chat - targetUser is usually the UID in DB mode
        // If not a UUID, we try to find it in conversations
        const uid = targetUser;
        if (uid) {
          participantUids = [uid];
        }
      }

      // 2. Create meeting via API
      if (shouldUseDatabaseData()) {
        const response = await fetchWithCsrf("/api/meetings/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: `Started from chat`,
            participantUids,
            type,
            conversationId,
          }),
        });

        const data = await response.json();
        if (data.success && data.meeting) {
          window.open(`/meetings/${data.meeting.roomId}`, "_blank");
        } else {
          alert("Failed to start meeting: " + (data.error || "Unknown error"));
        }
      } else {
        // Demo mode
        const mockRoomId = `demo-${Date.now()}`;
        window.open(`/meetings/${mockRoomId}`, "_blank");
      }
    } catch (error) {
      console.error("Error starting meeting:", error);
      alert("Failed to start meeting.");
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "online":
      case "available":
        return "bg-green-500";
      case "away":
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] md:w-96 z-50 shadow-2xl rounded-lg overflow-hidden border border-border bg-card">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            {targetAvatar ? (
              <img
                src={targetAvatar}
                alt={targetName}
                className="w-8 h-8 rounded-full object-cover bg-primary-foreground/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-semibold">
                {getInitials(targetName)}
              </div>
            )}
            <Circle
              className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 ${getStatusColor(activity?.currentStatus)} rounded-full fill-current border-2 border-primary`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm truncate max-w-[150px]">
              {targetName}
            </h3>
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
            onClick={() => handleStartCall("audio")}
            className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-colors"
            title="Audio call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStartCall("video")}
            className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-colors"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 hover:bg-destructive/20 text-primary-foreground/70 hover:text-white rounded transition-colors cursor-pointer"
            title="Delete entire conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMinimize}
            className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-60 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="animate-in fade-in zoom-in duration-200">
            <Trash2 className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h4 className="font-bold text-lg mb-2">Delete Conversation?</h4>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete all messages in this thread for both
              participants.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteThread}
              >
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  className={`flex group ${msg.fromUser === currentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 relative ${
                      msg.fromUser === currentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border"
                    }`}
                  >
                    {msg.fromUser === currentUser && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="absolute -top-2 -left-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
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
                    {/* Seen Indicator */}
                    {msg.id === lastReadMessageId && (
                      <div className="absolute -bottom-1 -right-2">
                        {targetAvatar ? (
                          <img
                            src={targetAvatar}
                            alt="Seen"
                            className="w-4 h-4 rounded-full border border-background shadow-sm"
                            title={`Seen by ${targetName}`}
                          />
                        ) : (
                          <div
                            className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] border border-background shadow-sm font-bold"
                            title={`Seen by ${targetName}`}
                          >
                            {getInitials(targetName)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card relative">
            {activity?.currentStatus !== "online" && (
              <p className="text-xs text-muted-foreground text-center py-1 mb-2">
                {targetName} is offline. Your message will be delivered when
                they return.
              </p>
            )}

            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-card border border-border rounded-lg shadow-xl grid grid-cols-6 gap-1 z-50 animate-in slide-in-from-bottom-2 duration-200">
                {[
                  "😊",
                  "😂",
                  "🤣",
                  "❤️",
                  "👍",
                  "👎",
                  "🎉",
                  "🔥",
                  "✅",
                  "❌",
                  "💯",
                  "🤔",
                  "😍",
                  "😢",
                  "😠",
                  "🙏",
                  "👏",
                  "✨",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-1.5 hover:bg-accent rounded text-xl transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="w-full pr-10"
                />
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent transition-colors ${showEmojiPicker ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <Button onClick={handleSend} size="sm" className="h-10 px-4">
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
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [simulatedUnread, setSimulatedUnread] = useState(0);

  // Track if we're on chat page (for conditional rendering, NOT for hooks)
  const isOnChatPage = pathname?.startsWith("/chat");

  const loadConversations = useCallback(async () => {
    if (shouldUseDatabaseData()) {
      const [convs, presenceRes] = await Promise.all([
        dbFetchConversations(currentUser),
        fetch("/api/presence", { cache: "no-store" }).then((res) => res.json()),
      ]);

      const presenceData = presenceRes.success ? presenceRes.data : [];

      // Update conversations with live presence
      const updatedConvs = convs.map((conv) => {
        const p = presenceData.find((item: any) => item.uid === conv.withUser);
        let isOnline = false;
        if (p) {
          const threshold = Date.now() - 5 * 60 * 1000;
          const lastSeen = new Date(p.lastSeen).getTime();
          isOnline = lastSeen >= threshold;
        }
        return { ...conv, isOnline };
      });

      // Play sound if unread count increased globally
      const prevUnread = conversations.reduce(
        (sum, c) => sum + c.unreadCount,
        0
      );
      const newUnread = updatedConvs.reduce((sum, c) => sum + c.unreadCount, 0);

      if (newUnread > prevUnread && !activeChat) {
        playMessageTone();
        window.dispatchEvent(new CustomEvent("chatNotification"));
      }

      setConversations(updatedConvs);
    } else {
      const convs = getChatConversations(currentUser);
      setConversations(convs);
    }
  }, [currentUser, conversations.length, activeChat]); // conversations.length is enough to check for changes if we just want to avoid redundant re-renders

  useEffect(() => {
    // Don't load conversations if on chat page
    if (isOnChatPage) return;

    loadConversations();
    const interval = setInterval(loadConversations, 3000);

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
  }, [currentUser, isOnChatPage, loadConversations]);

  const openChat = (user: string, convId?: string) => {
    setActiveChat(user);
    setActiveConversationId(convId || null);
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
      <div className={activeChat ? "hidden" : "block"}>
        <button
          onClick={() => {
            setShowConversations(!showConversations);
            // Clear simulated unread when opening list
            if (!showConversations) setSimulatedUnread(0);
          }}
          className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all cursor-pointer z-50 flex items-center justify-center"
          title="Team Chat"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse shadow-lg z-10">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Conversations List - Persistent but hidden */}
      <div className={showConversations && !activeChat ? "block" : "hidden"}>
        <Card className="fixed bottom-20 right-4 w-[calc(100vw-2rem)] md:w-80 max-h-96 z-50 shadow-2xl overflow-hidden">
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
                  onClick={() => openChat(conv.withUser, conv.id)}
                  className="w-full p-3 hover:bg-secondary transition-colors text-left border-b border-border cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        {conv.withUserAvatar ? (
                          <img
                            src={conv.withUserAvatar}
                            alt={conv.withUserName || conv.withUser}
                            className="w-10 h-10 rounded-full object-cover shadow-sm bg-accent"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-sm">
                            {getInitials(conv.withUserName || conv.withUser)}
                          </div>
                        )}
                        <Circle
                          className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 ${
                            conv.isOnline ? "bg-green-500" : "bg-gray-400"
                          } rounded-full fill-current border-2 border-card`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {conv.withUserName || conv.withUser}
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
      </div>

      {/* Active Chat Window - Persistent but conditionally hidden */}
      {/* Note: We actually WANT to unmount ChatWindow when switching users to reset internal state, 
          BUT users want persistence when toggling minimize. 
          Current issue is likely opening/closing causing complete re-mount.
          For now, let's keep conditional render for different users, but maybe wrap it? 
          Actually, the user says "whenever I open the floating chat box it has to refetch". 
          This implies opening/closing the widget entirely. 
      */}
      {activeChat && (
        <ChatWindow
          currentUser={currentUser}
          targetUser={activeChat}
          conversationId={activeConversationId || undefined}
          conversations={conversations}
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
