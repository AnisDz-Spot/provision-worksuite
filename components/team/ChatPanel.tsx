"use client";
import * as React from "react";
import { MessageCircle, Send, X, Circle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  sendChatMessage,
  getChatMessages,
  getChatConversations,
  markMessagesAsRead,
  getMemberActivity,
  type ChatMessage,
  type ChatConversation,
} from "@/lib/utils";

interface ChatPanelProps {
  currentUser: string;
  teamMembers: Array<{ name: string; avatar: string }>;
}

export function ChatPanel({ currentUser, teamMembers }: ChatPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [conversations, setConversations] = React.useState<ChatConversation[]>(
    []
  );
  const [activeChat, setActiveChat] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const loadConversations = React.useCallback(() => {
    const convs = getChatConversations(currentUser);
    setConversations(convs);
  }, [currentUser]);

  const loadMessages = React.useCallback(
    (otherUser: string) => {
      const msgs = getChatMessages(currentUser, otherUser);
      setMessages(msgs);
      markMessagesAsRead(currentUser, otherUser);
      loadConversations();
    },
    [currentUser, loadConversations]
  );

  React.useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [loadConversations]);

  React.useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
      const interval = setInterval(() => loadMessages(activeChat), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat, loadMessages]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeChat) return;

    sendChatMessage(currentUser, activeChat, inputMessage.trim());
    setInputMessage("");
    loadMessages(activeChat);
  };

  const handleStartChat = (memberName: string) => {
    setActiveChat(memberName);
    loadMessages(memberName);
  };

  const getOnlineStatus = (memberName: string) => {
    const activity = getMemberActivity(memberName);
    if (!activity) return "offline";
    const timeSinceActive = Date.now() - activity.lastActive;
    if (timeSinceActive < 5 * 60 * 1000) return "online";
    if (timeSinceActive < 30 * 60 * 1000) return "away";
    return "offline";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all z-50 cursor-pointer"
        title="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
            {totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">
            {activeChat ? activeChat : "Team Chat"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {activeChat && (
            <button
              onClick={() => setActiveChat(null)}
              className="p-1 hover:bg-secondary rounded cursor-pointer"
              title="Back to conversations"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-secondary rounded cursor-pointer"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!activeChat ? (
        // Conversations List
        <div className="flex-1 overflow-y-auto">
          {teamMembers
            .filter((m) => m.name !== currentUser)
            .map((member) => {
              const conv = conversations.find(
                (c) => c.withUser === member.name
              );
              const status = getOnlineStatus(member.name);

              return (
                <button
                  key={member.name}
                  onClick={() => handleStartChat(member.name)}
                  className="w-full p-3 hover:bg-secondary transition-colors border-b border-border text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <Circle
                        className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(status)} rounded-full border-2 border-card`}
                        fill="currentColor"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {member.name}
                        </span>
                        {conv && conv.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      ) : (
        // Active Chat
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isCurrentUser = msg.fromUser === currentUser;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
