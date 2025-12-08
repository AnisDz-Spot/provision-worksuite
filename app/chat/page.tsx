"use client";
import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Paperclip,
  File,
  X,
  Circle,
  Search,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";
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

type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [currentUser] = useState("You");
  const [teamMembers] = useState([
    {
      name: "Alice Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
      role: "project_manager",
    },
    {
      name: "Bob Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
      role: "member",
    },
    {
      name: "Carol Davis",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
      role: "admin",
    },
    {
      name: "David Lee",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      role: "member",
    },
  ]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
      const interval = setInterval(() => loadMessages(activeChat), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = () => {
    const convs = getChatConversations(currentUser);
    setConversations(convs);
  };

  const loadMessages = (otherUser: string) => {
    const msgs = getChatMessages(currentUser, otherUser);
    setMessages(msgs);
    markMessagesAsRead(currentUser, otherUser);
    loadConversations();
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() && attachments.length === 0) return;
    if (!activeChat) return;

    if (inputMessage.trim()) {
      sendChatMessage(currentUser, activeChat, inputMessage.trim());
    }

    for (const attachment of attachments) {
      const fileMessage = `📎 ${attachment.name}`;
      sendChatMessage(currentUser, activeChat, fileMessage);
    }

    setInputMessage("");
    setAttachments([]);
    loadMessages(activeChat);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = Array.from(files).map((file) => ({
      id: `file_${Date.now()}_${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleStartChat = (memberName: string) => {
    setActiveChat(memberName);
    setShowMobileSidebar(false);
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

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name !== currentUser &&
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  return (
    <section className="flex flex-col h-[calc(100vh-64px)]">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Secure team communication
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`w-full md:w-80 border-r border-border bg-card flex flex-col ${
            activeChat && !showMobileSidebar ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {searchQuery ? "No matches found" : "No team members available"}
              </div>
            ) : (
              filteredMembers.map((member) => {
                const conv = conversations.find(
                  (c) => c.withUser === member.name
                );
                const status = getOnlineStatus(member.name);

                return (
                  <button
                    key={member.name}
                    onClick={() => handleStartChat(member.name)}
                    className={`w-full p-4 hover:bg-accent/50 transition-colors border-b border-border text-left ${
                      activeChat === member.name ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <Circle
                          className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(status)} rounded-full border-2 border-card`}
                          fill="currentColor"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm truncate">
                            {member.name}
                          </span>
                          {conv && conv.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv?.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-background">
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Select a conversation
                </h2>
                <p className="text-muted-foreground">
                  Choose a team member from the sidebar to start chatting
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => {
                      setActiveChat(null);
                      setShowMobileSidebar(true);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="relative">
                    <img
                      src={
                        teamMembers.find((m) => m.name === activeChat)
                          ?.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat}`
                      }
                      alt={activeChat}
                      className="w-10 h-10 rounded-full"
                    />
                    <Circle
                      className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(getOnlineStatus(activeChat))} rounded-full border-2 border-card`}
                      fill="currentColor"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{activeChat}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {getOnlineStatus(activeChat)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCurrentUser = msg.fromUser === currentUser;
                    const isFileMessage = msg.message.startsWith("📎");

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border"
                          }`}
                        >
                          {isFileMessage ? (
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4" />
                              <span className="text-sm">{msg.message}</span>
                            </div>
                          ) : (
                            <p className="text-sm">{msg.message}</p>
                          )}
                          <p
                            className={`text-xs mt-1 ${
                              isCurrentUser
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
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {attachments.length > 0 && (
                <div className="px-4 py-2 border-t border-border bg-accent/20">
                  <div className="flex gap-2 flex-wrap">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 bg-card border border-border rounded-lg p-2 pr-1"
                      >
                        {file.type.startsWith("image/") ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <File className="w-8 h-8 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAttachment(file.id)}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-border bg-card">
                <div className="flex gap-2 items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSendMessage()
                    }
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() && attachments.length === 0}
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  🔒 Messages are securely stored and encrypted
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
