"use client";
import { useEffect, useState, useRef } from "react";
import { X, MessageCircle, Send, Paperclip, Smile } from "lucide-react";
import { usePathname } from "next/navigation";
import { playMessageTone } from "@/lib/notificationSound";
import {
  getChatMessages,
  sendChatMessage,
  markMessagesAsRead,
  getActiveChatUser,
  type ChatMessage,
} from "@/lib/utils/team-utilities";

// Simple toast for notifications
type ToastNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
};

export function ChatNotificationToast() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser] = useState("You");
  const [activeChat, setActiveChat] = useState<string>("Alice Johnson"); // Default to PM
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hide on /chat page (including sub-routes)
  if (pathname?.startsWith("/chat")) return null;

  // Poll for messages in active chat
  useEffect(() => {
    // Initial load of active chat from storage
    const storedChat = getActiveChatUser();
    if (storedChat) setActiveChat(storedChat);

    if (!isOpen) return;

    const loadMessages = () => {
      const msgs = getChatMessages(currentUser, activeChat);
      setMessages(msgs);
      // Mark as read when panel is open
      markMessagesAsRead(currentUser, activeChat);

      // Check if active chat changed elsewhere
      const currentStored = getActiveChatUser();
      if (currentStored && currentStored !== activeChat) {
        setActiveChat(currentStored);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, activeChat, currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    sendChatMessage(currentUser, activeChat, inputValue.trim());
    setInputValue("");
    setShowEmojiPicker(false);

    // Refresh messages immediately
    setMessages(getChatMessages(currentUser, activeChat));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For demo: create blob URL and send as link
      // In real app: upload to server
      const msg = `📎 ${file.name}`;
      const attachment = {
        id: `file_${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      };
      sendChatMessage(currentUser, activeChat, msg, attachment);
      setMessages(getChatMessages(currentUser, activeChat));
    }
  };

  const onEmojiClick = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Rest of the existing notification logic...
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function setupChatToasts() {
      try {
        const { startChatNotificationSimulation } =
          await import("@/lib/chatNotificationSimulator");

        const cleanup = startChatNotificationSimulation((chatNotif) => {
          // Play sound
          playMessageTone();

          const toast: ToastNotification = {
            id: chatNotif.id,
            title: chatNotif.from,
            message: chatNotif.message,
            timestamp: new Date(chatNotif.timestamp),
            read: false,
          };

          // Add to visible toasts
          setNotifications((prev) => [toast, ...prev].slice(0, 3));

          // Auto-dismiss toast
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== toast.id));
          }, 5000);
        }, 60000);

        return cleanup;
      } catch (error) {
        console.error("Failed to setup chat toasts:", error);
      }
    }

    setupChatToasts();
  }, [mounted]);

  // Calculate unread from actual messages in future (using simulation for now for badge)
  const unreadCount = notifications.length;

  if (!mounted) return null;

  return (
    <>
      {/* Toast Notifications */}
      {notifications.length > 0 && (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-card border-2 border-primary shadow-lg rounded-lg p-4 min-w-[300px] animate-in slide-in-from-right"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">
                    {notif.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {notif.message}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.filter((n) => n.id !== notif.id)
                    );
                    // Mark as read in backend
                    if (notif.title) {
                      markMessagesAsRead(currentUser, notif.title);
                    }
                  }}
                  className="p-1 hover:bg-accent rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110"
          aria-label="Chat messages"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Messages Panel */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 md:w-96 h-[500px] bg-card border-2 border-border shadow-2xl rounded-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {activeChat
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{activeChat}</h3>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-accent rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground">
                    No messages yet. Say hello! 👋
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.fromUser === currentUser;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted border border-border"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p
                          className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}
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

            {/* Input Area */}
            <div className="p-3 border-t border-border bg-card">
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 bg-card border border-border rounded-lg shadow-xl p-2 z-50 grid grid-cols-6 gap-2">
                  {[
                    "😊",
                    "😂",
                    "❤️",
                    "👍",
                    "🎉",
                    "🔥",
                    "🤔",
                    "😢",
                    "👀",
                    "✅",
                    "❌",
                    "👋",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onEmojiClick(emoji)}
                      className="hover:bg-accent p-1 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1 flex flex-col gap-2 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full min-h-[44px] max-h-32 px-3 py-2 rounded-lg border border-input bg-background resize-none text-sm focus:outline-none focus:ring-1 focus:ring-primary pr-8"
                    rows={1}
                  />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="p-2 rounded-lg bg-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
