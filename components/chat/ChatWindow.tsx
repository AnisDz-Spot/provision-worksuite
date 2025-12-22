"use client";

import React, { RefObject, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Users,
  Circle,
  MoreVertical,
  Trash2,
  Download,
  MessageCircle,
  File,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Video,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChatInput } from "./ChatInput";
import { getInitials } from "@/lib/utils";

interface ChatWindowProps {
  activeChat: string | null;
  messages: any[];
  currentUser: string;
  teamMembers: any[];
  filteredMembers: any[];
  chatGroups: any[];
  adminConversations: any[];
  viewMode: string;
  isMasterAdmin: boolean;
  activeConversationId: string | null;
  showActionMenu: boolean;
  setShowActionMenu: (val: boolean) => void;
  actionMenuRef: RefObject<HTMLDivElement | null>;
  setShowDeleteConfirm: (val: boolean) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  lastReadMessageId: string | null;
  setPreviewFile: (file: any | null) => void;
  attachments: any[];
  getStatusColor: (status: string) => string;
  getOnlineStatus: (id: string) => string;
  handleSendMessage: () => void;
  inputMessage: string;
  setInputMessage: (val: string) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (id: string) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (val: boolean) => void;
  handleEmojiSelect: (emoji: string) => void;
  handleRetryMessage: (msg: any) => void;
  formatFileSize: (bytes: number) => string;
  onBack: () => void;
  onStartCall: (type: "video" | "audio") => void;
}

export function ChatWindow({
  activeChat,
  messages,
  currentUser,
  teamMembers,
  filteredMembers,
  chatGroups,
  adminConversations,
  viewMode,
  isMasterAdmin,
  activeConversationId,
  showActionMenu,
  setShowActionMenu,
  actionMenuRef,
  setShowDeleteConfirm,
  messagesEndRef,
  lastReadMessageId,
  setPreviewFile,
  attachments,
  getStatusColor,
  getOnlineStatus,
  handleSendMessage,
  inputMessage,
  setInputMessage,
  fileInputRef,
  handleFileSelect,
  removeAttachment,
  showEmojiPicker,
  setShowEmojiPicker,
  handleEmojiSelect,
  handleRetryMessage,
  formatFileSize,
  onBack,
  onStartCall,
}: ChatWindowProps) {
  const router = useRouter();

  const resolvedMembers = useMemo(() => {
    if (!activeChat) return [];

    // 1. Check if it's an archived conversation (Admin View)
    if (viewMode === "archived" && isMasterAdmin) {
      const archivedConv = adminConversations.find(
        (c: any) => c.id === activeChat
      );
      if (archivedConv && Array.isArray(archivedConv.members)) {
        return archivedConv.members.map((m: any) => ({
          uid: m.uid,
          name: m.name || m.uid,
          avatar:
            m.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.uid}`,
        }));
      }
    }

    // 2. Check if it's a group
    const group = chatGroups.find((g: any) => g.id === activeChat);
    if (group) {
      return group.members.map((email: string) => {
        const member = teamMembers.find(
          (m: any) => m.email === email || m.uid === email || m.name === email
        );
        return {
          uid: member?.uid || email,
          name: member?.name || email,
          avatar:
            member?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        };
      });
    }

    // 3. Simple Direct Message
    const partner = teamMembers.find(
      (m: any) => m.uid === activeChat || m.name === activeChat
    );
    if (partner) return [partner];

    return [];
  }, [
    activeChat,
    viewMode,
    isMasterAdmin,
    adminConversations,
    chatGroups,
    teamMembers,
  ]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8 bg-background">
        <div>
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
          <p className="text-muted-foreground">
            Choose a team member from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  const archivedConv =
    viewMode === "archived" && isMasterAdmin
      ? adminConversations.find((c) => c.id === activeChat)
      : null;

  const group = chatGroups.find((g: any) => g.id === activeChat);
  const partnerMatch = teamMembers.find(
    (m: any) => m.uid === activeChat || m.name === activeChat
  );

  return (
    <div className="flex-1 flex flex-col bg-background min-w-0 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {archivedConv ? (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{archivedConv.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Archived • {resolvedMembers.length} members
                  </span>
                  <div className="flex -space-x-2 overflow-hidden">
                    {resolvedMembers.slice(0, 5).map((m: any) => (
                      <button
                        key={m.uid}
                        onClick={() => router.push(`/team/${m.uid}`)}
                        className="inline-block"
                        title={m.name}
                      >
                        <Image
                          src={m.avatar}
                          alt={m.name}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full border border-background ring-2 ring-background hover:ring-primary transition-all"
                        />
                      </button>
                    ))}
                    {resolvedMembers.length > 5 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] ring-2 ring-background">
                        +{resolvedMembers.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : group ? (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{group.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {resolvedMembers.length} members
                  </span>
                  <div className="flex -space-x-2 overflow-hidden">
                    {resolvedMembers.slice(0, 5).map((m: any) => (
                      <button
                        key={m.uid}
                        onClick={() => router.push(`/team/${m.uid}`)}
                        className="inline-block"
                        title={m.name}
                      >
                        <Image
                          src={m.avatar}
                          alt={m.name}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full border border-background ring-2 ring-background hover:ring-primary transition-all"
                        />
                      </button>
                    ))}
                    {resolvedMembers.length > 5 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] ring-2 ring-background">
                        +{resolvedMembers.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Image
                  src={
                    partnerMatch?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat}`
                  }
                  alt={partnerMatch?.name || activeChat}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full border border-border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    partnerMatch?.uid &&
                    router.push(`/team/${partnerMatch.uid}`)
                  }
                  title={partnerMatch?.name || activeChat}
                />
                <Circle
                  className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(getOnlineStatus(activeChat))} rounded-full border-2 border-card`}
                  fill="currentColor"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={() =>
                    partnerMatch?.uid &&
                    router.push(`/team/${partnerMatch.uid}`)
                  }
                >
                  {partnerMatch?.name || activeChat}
                </h3>
                <p className="text-xs text-muted-foreground uppercase truncate">
                  {getOnlineStatus(activeChat)}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="relative" ref={actionMenuRef}>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => onStartCall("audio")}
              title="Voice call"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => onStartCall("video")}
              title="Video call"
            >
              <Video className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 text-muted-foreground hover:text-danger transition-colors"
              onClick={() => setShowActionMenu(!showActionMenu)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          {showActionMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-t-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete Conversation
              </button>
              <button
                onClick={() => {
                  alert("Export feature coming soon!");
                  setShowActionMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 rounded-b-lg"
              >
                <Download className="w-4 h-4" />
                Export Chat
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg: any) => {
            const isCurrentUser = msg.fromUser === currentUser;
            const isFileMessage = msg.message.startsWith("📎");
            const chatPartner = filteredMembers.find(
              (m: any) =>
                m.uid === activeChat || (activeChat && m.name === activeChat)
            );
            const sender = teamMembers.find((m: any) => m.uid === msg.fromUser);
            const isGroup = chatGroups.some((g: any) => g.id === activeChat);
            const isArchived = viewMode === "archived";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
              >
                {!isCurrentUser && (isGroup || isArchived) && (
                  <span className="text-[10px] font-medium text-muted-foreground mb-1 ml-2">
                    {sender?.name || msg.fromUser}
                  </span>
                )}
                <div
                  className={`relative max-w-[70%] rounded-2xl px-4 py-2 ${
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  } ${msg.status === "sending" ? "opacity-70" : ""} ${
                    msg.status === "error"
                      ? "border-destructive ring-1 ring-destructive/20"
                      : ""
                  }`}
                >
                  {/* Error indicator for current user messages */}
                  {isCurrentUser && msg.status === "error" && (
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => handleRetryMessage(msg)}
                        className="p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        title="Retry sending"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    </div>
                  )}

                  {isFileMessage ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <File className="w-4 h-4 shrink-0" />
                      <span className="text-sm truncate" title={msg.message}>
                        {msg.message}
                      </span>
                      <button
                        onClick={() => {
                          if (msg.attachment) {
                            setPreviewFile(msg.attachment);
                          } else {
                            const fileName = msg.message.replace("📎 ", "");
                            const file = attachments.find(
                              (a: any) => a.name === fileName
                            );
                            if (file) setPreviewFile(file);
                          }
                        }}
                        className="ml-2 p-1 hover:bg-accent/20 rounded"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm wrap-break-word whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <p
                      className={`text-xs ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {isCurrentUser && msg.status === "sending" && (
                      <Loader2 className="w-3 h-3 animate-spin opacity-50" />
                    )}
                  </div>
                  {isCurrentUser &&
                    msg.id === lastReadMessageId &&
                    msg.status !== "error" && (
                      <div className="absolute -bottom-2 -right-2">
                        {chatPartner?.avatar ? (
                          <Image
                            src={chatPartner.avatar}
                            alt="Seen"
                            width={16}
                            height={16}
                            className="w-4 h-4 rounded-full border border-background shadow-sm"
                            title={`Seen by ${chatPartner.name}`}
                          />
                        ) : (
                          <div
                            className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] border border-background shadow-sm"
                            title={`Seen by ${chatPartner?.name || "User"}`}
                          >
                            {getInitials(chatPartner?.name || "?")}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        attachments={attachments}
        removeAttachment={removeAttachment}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        handleEmojiSelect={handleEmojiSelect}
        formatFileSize={formatFileSize}
      />

      <p className="text-xs text-muted-foreground mt-2 px-4 pb-4">
        🔒 Messages are securely stored and encrypted
      </p>
    </div>
  );
}
