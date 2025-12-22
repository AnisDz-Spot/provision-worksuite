"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatModals } from "@/components/chat/ChatModals";
import {
  dbFetchThread,
  dbSendMessage,
  dbMarkRead,
  dbDeleteThread,
  dbFetchConversations,
  type ChatMessage,
  type ChatConversation,
} from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthContext";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { log } from "@/lib/logger";

type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const { currentUser: authUser, isMasterAdmin } = useAuth();
  const currentUser = authUser?.id || "You";

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  // Admin Audit State
  const [viewMode, setViewMode] = useState<"active" | "archived" | "directory">(
    "active"
  );
  const [adminConversations, setAdminConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [currentUserRole] = useState<string>("admin");
  const canCreateGroups =
    currentUserRole === "admin" || currentUserRole === "project_manager";

  // Group creation state
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    members: [] as string[],
    isPrivate: false,
    projectId: undefined as number | undefined,
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Group creation status notification
  const [groupCreationStatus, setGroupCreationStatus] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const [chatGroups, setChatGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [presenceData, setPresenceData] = useState<any[]>([]);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Keep refs in sync
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadPresence = useCallback(async () => {
    if (shouldUseDatabaseData()) {
      try {
        const res = await fetch("/api/presence", { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          setPresenceData(json.data);
          if (json.serverTime) {
            const serverDate = new Date(json.serverTime).getTime();
            const clientDate = Date.now();
            setServerTimeOffset(serverDate - clientDate);
          }
        }
      } catch (err) {
        console.error("Failed to load presence", err);
      }
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch("/api/projects", {
        cache: "no-store",
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          setProjects(json.data);
        }
      }
    } catch (error) {
      console.error("Failed to load projects", error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const loadChatGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const response = await fetch("/api/chat-groups", {
        credentials: "include",
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.offline && Array.isArray(data.groups)) {
          const stored = localStorage.getItem("pv:chatGroups");
          setChatGroups(stored ? JSON.parse(stored) : []);
        } else if (Array.isArray(data)) {
          setChatGroups(
            data.length > 0
              ? data
              : JSON.parse(localStorage.getItem("pv:chatGroups") || "[]")
          );
          if (data.length > 0) {
            localStorage.setItem("pv:chatGroups", JSON.stringify(data));
          }
        }
      }
    } catch (error) {
      console.error("Failed to load chat groups", error);
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    if (shouldUseDatabaseData()) {
      setIsLoadingConversations(true);
      try {
        const convs = await dbFetchConversations(currentUser);
        setConversations(convs);
      } finally {
        setIsLoadingConversations(false);
      }
    } else {
      const { getChatConversations } =
        await import("@/lib/utils/team-utilities");
      setConversations(getChatConversations(currentUser));
    }
  }, [currentUser]);

  const loadAdminConversations = useCallback(async () => {
    if (!isMasterAdmin) return;
    try {
      const res = await fetch("/api/admin/conversations", {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setAdminConversations(json.data);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    }
  }, [isMasterAdmin]);

  useEffect(() => {
    if (viewMode === "archived" && isMasterAdmin) {
      loadAdminConversations();
    }
  }, [viewMode, isMasterAdmin, loadAdminConversations]);

  const loadMessages = useCallback(
    async (otherUser: string, convId?: string) => {
      if (shouldUseDatabaseData()) {
        const msgs = await dbFetchThread(currentUser, otherUser, convId);
        setMessages(msgs);
        await dbMarkRead(currentUser, otherUser, convId);
        loadConversations();
      } else {
        const { getChatMessages, markMessagesAsRead } =
          await import("@/lib/utils/team-utilities");
        setMessages(getChatMessages(currentUser, otherUser));
        markMessagesAsRead(currentUser, otherUser);
        loadConversations();
      }
    },
    [currentUser, loadConversations]
  );

  useEffect(() => {
    if (mounted) {
      loadPresence();
      const interval = setInterval(loadPresence, 5000);
      return () => clearInterval(interval);
    }
  }, [mounted, loadPresence]);

  useEffect(() => {
    setMounted(true);
    loadConversations();
    loadChatGroups();
    loadProjects();

    if (typeof window !== "undefined") {
      const persistedChat = localStorage.getItem("pv:activeChatUser");
      const persistedConvId = localStorage.getItem("pv:activeConversationId");
      if (persistedChat) {
        setActiveChat(persistedChat);
        activeChatRef.current = persistedChat;
      }
      if (persistedConvId) {
        setActiveConversationId(persistedConvId);
      }
    }

    const interval = setInterval(() => {
      if (viewMode === "archived") return;
      loadConversations();
      loadChatGroups();
      if (typeof window !== "undefined") {
        const currentStored = localStorage.getItem("pv:activeChatUser");
        if (currentStored !== activeChatRef.current) {
          setActiveChat(currentStored);
          activeChatRef.current = currentStored || null;
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser, loadConversations, loadChatGroups, viewMode]);

  useEffect(() => {
    if (activeChat || activeConversationId) {
      const targetUser = activeChat || "";
      const cid = activeConversationId || undefined;
      loadMessages(targetUser, cid);
      const interval = setInterval(() => loadMessages(targetUser, cid), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat, activeConversationId, loadMessages]);

  const lastReadMessageId = useCallback(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.fromUser === currentUser && msg.read) {
        return msg.id;
      }
    }
    return null;
  }, [messages, currentUser])();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setShowActionMenu(false);
      }
    }
    if (showActionMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActionMenu]);

  useEffect(() => {
    if (shouldUseDatabaseData()) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setTeamMembers(
              json.data.map((u: any) => ({
                uid: u.uid,
                name: u.name,
                email: u.email,
                avatar:
                  u.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
                role: u.role,
              }))
            );
          }
        })
        .catch((err) => console.error("Failed to load team members", err));
    } else {
      setTeamMembers([
        {
          name: "Alice Johnson",
          email: "alice@example.com",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
          role: "project_manager",
        },
        {
          name: "Bob Smith",
          email: "bob@example.com",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
          role: "member",
        },
      ]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;
    if (!activeChat) return;

    if (shouldUseDatabaseData()) {
      if (inputMessage.trim()) {
        const res = await dbSendMessage(
          currentUser,
          activeChat,
          inputMessage.trim(),
          activeConversationId || undefined
        );
        if (res.success && res.data?.conversationId && !activeConversationId) {
          setActiveConversationId(res.data.conversationId);
        }
      }
      for (const attachment of attachments) {
        await dbSendMessage(currentUser, activeChat, `📎 ${attachment.name}`);
      }
    } else {
      const { sendChatMessage } = await import("@/lib/utils/team-utilities");
      if (inputMessage.trim())
        sendChatMessage(currentUser, activeChat, inputMessage.trim());
      for (const attachment of attachments) {
        sendChatMessage(
          currentUser,
          activeChat,
          `📎 ${attachment.name}`,
          attachment
        );
      }
    }
    setInputMessage("");
    setAttachments([]);
    loadMessages(activeChat, activeConversationId || undefined);
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
    const fileToRemove = attachments.find((a) => a.id === id);
    if (fileToRemove) URL.revokeObjectURL(fileToRemove.url);
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleClearChat = async () => {
    if (viewMode === "archived" && isMasterAdmin && activeChat) {
      if (shouldUseDatabaseData()) {
        if (await dbDeleteThread(currentUser, "", activeChat)) {
          setMessages([]);
          setActiveChat(null);
          setActiveConversationId(null);
          localStorage.removeItem("pv:activeChatUser");
          localStorage.removeItem("pv:activeConversationId");
          loadAdminConversations();
        }
      }
      setShowActionMenu(false);
      setShowDeleteConfirm(false);
      return;
    }

    const partner = teamMembers.find(
      (m) => m.uid === activeChat || m.name === activeChat
    );
    if (!activeChat || !partner) return;

    if (shouldUseDatabaseData()) {
      if (
        await dbDeleteThread(
          currentUser,
          partner.uid || activeChat,
          activeConversationId || undefined
        )
      ) {
        setMessages([]);
        setActiveChat(null);
        setActiveConversationId(null);
        localStorage.removeItem("pv:activeChatUser");
        localStorage.removeItem("pv:activeConversationId");
        loadConversations();
      }
    } else {
      localStorage.removeItem(
        `pv:chat:${[currentUser, activeChat].sort().join(":")}`
      );
      setMessages([]);
      setActiveChat(null);
      loadConversations();
    }
    setShowActionMenu(false);
    setShowDeleteConfirm(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputMessage(inputMessage + emoji);
    setShowEmojiPicker(false);
  };

  const handleStartChat = (memberNameOrUid: string) => {
    setActiveChat(memberNameOrUid);
    activeChatRef.current = memberNameOrUid;
    setViewMode("active");

    const group = chatGroups.find((g) => g.id === memberNameOrUid);
    let cid =
      group?.conversationId ||
      conversations.find(
        (c) =>
          c.withUser === memberNameOrUid || c.withUserName === memberNameOrUid
      )?.id ||
      null;

    setActiveConversationId(cid);
    localStorage.setItem("pv:activeChatUser", memberNameOrUid);
    if (cid) localStorage.setItem("pv:activeConversationId", cid);
    else localStorage.removeItem("pv:activeConversationId");

    setShowMobileSidebar(false);
    loadMessages(memberNameOrUid, cid || undefined);
  };

  const getOnlineStatus = (memberNameOrUid: string) => {
    if (shouldUseDatabaseData()) {
      const p = presenceData.find(
        (i) => i.uid === memberNameOrUid || i.name === memberNameOrUid
      );
      if (!p) return "offline";
      const nowOnServer = Date.now() + serverTimeOffset;
      const lastSeen = new Date(p.lastSeen).getTime();
      const status = p.status?.toLowerCase() || "";
      if (
        (status === "online" || status === "available") &&
        lastSeen >= nowOnServer - 5 * 60 * 1000
      )
        return "online";
      if (lastSeen >= nowOnServer - 30 * 60 * 1000) return "away";
      return "offline";
    }
    return "offline";
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-orange-500";
      default:
        return "bg-gray-400";
    }
  };

  const filteredMembers = teamMembers.filter((m) => {
    if (m.name === currentUser || m.uid === currentUser) return false;
    const matchesSearch = m.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (searchQuery.trim()) return matchesSearch;
    return conversations.some(
      (c) => c.withUser === m.uid || c.withUser === m.name
    );
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleMember = (memberEmail: string) => {
    setNewGroup((prev) => ({
      ...prev,
      members: prev.members.includes(memberEmail)
        ? prev.members.filter((m) => m !== memberEmail)
        : [...prev.members, memberEmail],
    }));
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;
    try {
      const res = await fetchWithCsrf("/api/chat-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });

      if (res.ok) {
        const created = await res.json();
        setNewGroup({
          name: "",
          description: "",
          members: [],
          isPrivate: false,
          projectId: undefined,
        });
        setShowCreateGroup(false);
        loadChatGroups();
        setGroupCreationStatus({
          show: true,
          type: "success",
          message: `Group "${created.name}" created!`,
        });
        setTimeout(
          () =>
            setGroupCreationStatus({
              show: false,
              type: "success",
              message: "",
            }),
          5000
        );
      } else {
        const error = await res.json();
        setGroupCreationStatus({
          show: true,
          type: "error",
          message: error.error || "Failed to create group",
        });
      }
    } catch {
      setGroupCreationStatus({
        show: true,
        type: "error",
        message: "Failed to create group",
      });
    }
  };

  if (!mounted)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading chat...
      </div>
    );

  return (
    <section className="flex flex-col h-[calc(100vh-64px)]">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card text-card-foreground">
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
        {(isMasterAdmin || canCreateGroups) && (
          <Button
            onClick={() => setShowCreateGroup(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        )}
      </div>

      {groupCreationStatus.show && (
        <div
          className={`px-4 py-2 flex items-center justify-between ${groupCreationStatus.type === "success" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"}`}
        >
          <div className="flex items-center gap-2">
            {groupCreationStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <p className="text-sm font-medium">{groupCreationStatus.message}</p>
          </div>
          <button
            onClick={() =>
              setGroupCreationStatus({
                show: false,
                type: "success",
                message: "",
              })
            }
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <ChatSidebar
          viewMode={viewMode}
          setViewMode={setViewMode}
          chatGroups={chatGroups}
          filteredMembers={filteredMembers}
          conversations={conversations}
          activeChat={activeChat}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isMasterAdmin={isMasterAdmin}
          handleStartChat={handleStartChat}
          getOnlineStatus={getOnlineStatus}
          showMobileSidebar={showMobileSidebar}
        />

        <ChatWindow
          activeChat={activeChat}
          messages={messages}
          currentUser={currentUser}
          teamMembers={teamMembers}
          filteredMembers={filteredMembers}
          chatGroups={chatGroups}
          adminConversations={adminConversations}
          viewMode={viewMode}
          isMasterAdmin={isMasterAdmin}
          activeConversationId={activeConversationId}
          showActionMenu={showActionMenu}
          setShowActionMenu={setShowActionMenu}
          actionMenuRef={actionMenuRef}
          setShowDeleteConfirm={setShowDeleteConfirm}
          messagesEndRef={messagesEndRef}
          lastReadMessageId={lastReadMessageId}
          setPreviewFile={setPreviewFile}
          attachments={attachments}
          getStatusColor={getStatusColor}
          getOnlineStatus={getOnlineStatus}
          handleSendMessage={handleSendMessage}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          fileInputRef={fileInputRef}
          handleFileSelect={handleFileSelect}
          removeAttachment={removeAttachment}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          handleEmojiSelect={handleEmojiSelect}
          formatFileSize={formatFileSize}
          onBack={() => {
            setActiveChat(null);
            setShowMobileSidebar(true);
          }}
        />
      </div>

      <ChatModals
        previewFile={previewFile}
        setPreviewFile={setPreviewFile}
        showCreateGroup={showCreateGroup}
        setShowCreateGroup={setShowCreateGroup}
        newGroup={newGroup}
        setNewGroup={setNewGroup}
        projects={projects}
        teamMembers={teamMembers}
        toggleMember={toggleMember}
        handleCreateGroup={handleCreateGroup}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        handleClearChat={handleClearChat}
      />
    </section>
  );
}
