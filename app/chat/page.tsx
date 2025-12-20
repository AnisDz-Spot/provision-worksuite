"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  Smile,
  Trash2,
  Download,
  Eye,
  Plus,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
  const { currentUser: authUser } = useAuth();
  const currentUser = authUser?.id || "You";
  const currentUserName = authUser?.name || "You";
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Initialize current user from auth context or similar if available, else standard "You"
  // But we need to fetch real members
  useEffect(() => {
    import("@/lib/dataSource").then(({ shouldUseDatabaseData }) => {
      if (shouldUseDatabaseData()) {
        fetch("/api/users")
          .then((res) => res.json())
          .then((json) => {
            if (json.success && json.data) {
              const mapped = json.data.map((u: any) => ({
                uid: u.uid,
                name: u.name,
                email: u.email,
                avatar:
                  u.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
                role: u.role,
              }));
              setTeamMembers(mapped);
            }
          })
          .catch((err) => console.error("Failed to load chat members", err));
      } else {
        // Mock fallback
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
    });
  }, []);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const activeChatRef = useRef<string | null>(null); // For polling ref
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [currentUserRole] = useState<string>("admin"); // In real app, get from auth
  const canCreateGroups =
    currentUserRole === "admin" || currentUserRole === "project_manager";

  // Group creation state
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    members: [] as string[],
    isPrivate: false,
  });

  // Group creation status notification
  const [groupCreationStatus, setGroupCreationStatus] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  // Chat groups state
  const [chatGroups, setChatGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [presenceData, setPresenceData] = useState<any[]>([]);

  const loadPresence = async () => {
    if (shouldUseDatabaseData()) {
      try {
        const res = await fetch("/api/presence");
        const json = await res.json();
        if (json.success) setPresenceData(json.data);
      } catch (err) {
        console.error("Failed to load presence", err);
      }
    }
  };

  useEffect(() => {
    if (mounted) {
      loadPresence();
      const interval = setInterval(loadPresence, 5000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  const loadChatGroups = async () => {
    setIsLoadingGroups(true);
    try {
      // Try API first
      const response = await fetch("/api/chat-groups", {
        credentials: "include", // Include auth cookies
      });

      if (response.ok) {
        const data = await response.json();

        // Check if response indicates offline mode
        if (data.offline && Array.isArray(data.groups)) {
          // Use localStorage for offline mode
          const stored = localStorage.getItem("pv:chatGroups");
          if (stored) {
            setChatGroups(JSON.parse(stored));
          } else {
            setChatGroups([]);
          }
        } else if (Array.isArray(data)) {
          // Normal API response - only update if not empty
          if (data.length > 0) {
            setChatGroups(data);
            localStorage.setItem("pv:chatGroups", JSON.stringify(data));
          } else {
            // API empty - keep localStorage
            const stored = localStorage.getItem("pv:chatGroups");
            setChatGroups(stored ? JSON.parse(stored) : []);
          }
        }
      } else if (response.status === 401) {
        // Not authenticated, fall back to localStorage
        const stored = localStorage.getItem("pv:chatGroups");
        if (stored) {
          setChatGroups(JSON.parse(stored));
        }
      } else {
        throw new Error("Failed to fetch groups");
      }
    } catch (error) {
      log.error(
        { err: error },
        "Failed to load chat groups from API, using localStorage"
      );
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem("pv:chatGroups");
        if (stored) {
          setChatGroups(JSON.parse(stored));
        }
      } catch (localError) {
        log.error({ err: localError }, "Failed to load from localStorage");
      }
    } finally {
      setIsLoadingGroups(false);
    }
  };

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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActionMenu]);

  useEffect(() => {
    setMounted(true);
    loadConversations();
    loadChatGroups(); // Load groups on mount

    // Load persisted active chat from localStorage (as ID/UID)
    if (typeof window !== "undefined") {
      const persistedChat = localStorage.getItem("pv:activeChatUser");
      if (persistedChat) {
        setActiveChat(persistedChat);
        activeChatRef.current = persistedChat;
      }
    }

    const interval = setInterval(() => {
      loadConversations();
      loadChatGroups(); // Refresh groups

      // Check for active chat changes from other tabs/components
      if (typeof window !== "undefined") {
        const currentStored = localStorage.getItem("pv:activeChatUser");
        if (currentStored !== activeChatRef.current) {
          setActiveChat(currentStored);
          activeChatRef.current = currentStored || null;
        }
      }
    }, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [currentUser]);

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

  const loadConversations = async () => {
    if (shouldUseDatabaseData()) {
      const convs = await dbFetchConversations(currentUser);
      setConversations(convs);
    } else {
      const { getChatConversations } =
        await import("@/lib/utils/team-utilities");
      const convs = getChatConversations(currentUser);
      setConversations(convs);
    }
  };

  const loadMessages = async (otherUser: string) => {
    if (shouldUseDatabaseData()) {
      const msgs = await dbFetchThread(currentUser, otherUser);
      setMessages(msgs);
      await dbMarkRead(currentUser, otherUser);
      // We don't need to await the second loadConversations, can do it periodically or after markRead
      loadConversations();
    } else {
      const { getChatMessages, markMessagesAsRead } =
        await import("@/lib/utils/team-utilities");
      const msgs = getChatMessages(currentUser, otherUser);
      setMessages(msgs);
      markMessagesAsRead(currentUser, otherUser);
      loadConversations();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;
    if (!activeChat) return;

    if (shouldUseDatabaseData()) {
      if (inputMessage.trim()) {
        await dbSendMessage(currentUser, activeChat, inputMessage.trim());
      }
      // Attachments are still simulated in local state for now, but
      // in a real app they would be uploaded to /api/uploads
      for (const attachment of attachments) {
        const fileMessage = `📎 ${attachment.name}`;
        await dbSendMessage(currentUser, activeChat, fileMessage);
      }
    } else {
      const { sendChatMessage } = await import("@/lib/utils/team-utilities");
      if (inputMessage.trim()) {
        sendChatMessage(currentUser, activeChat, inputMessage.trim());
      }
      for (const attachment of attachments) {
        const fileMessage = `📎 ${attachment.name}`;
        sendChatMessage(currentUser, activeChat, fileMessage, attachment);
      }
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
    const fileToRemove = attachments.find((a) => a.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleClearChat = async () => {
    const partner =
      teamMembers.find((m) => m.name === activeChat)?.name || activeChat;
    if (activeChat && confirm(`Clear all messages with ${partner}?`)) {
      if (shouldUseDatabaseData()) {
        // In DB mode, we need the partner's UID.
        // We assume teamMembers contains the mapping if needed,
        // but often activeChat IS the UID in DB mode.
        const partnerUid =
          teamMembers.find((m) => m.name === activeChat)?.uid || activeChat;
        await dbDeleteThread(currentUser, partnerUid);
      } else {
        localStorage.removeItem(
          `pv:chat:${[currentUser, activeChat].sort().join(":")}`
        );
      }
      setMessages([]);
      loadConversations();
      setShowActionMenu(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputMessage(inputMessage + emoji);
    setShowEmojiPicker(false);
  };

  const handleStartChat = (memberNameOrUid: string) => {
    setActiveChat(memberNameOrUid);
    activeChatRef.current = memberNameOrUid;
    if (typeof window !== "undefined") {
      localStorage.setItem("pv:activeChatUser", memberNameOrUid);
    }
    setShowMobileSidebar(false);
    loadMessages(memberNameOrUid);
  };

  const getOnlineStatus = (memberNameOrUid: string) => {
    if (shouldUseDatabaseData()) {
      const p = presenceData.find(
        (item) => item.uid === memberNameOrUid || item.name === memberNameOrUid
      );
      if (!p) return "offline";
      const threshold = Date.now() - 5 * 60 * 1000;
      const lastSeen = new Date(p.lastSeen).getTime();
      const isOnline =
        (p.status === "online" || p.status === "available") &&
        lastSeen >= threshold;
      if (isOnline) return "online";
      if (lastSeen >= Date.now() - 30 * 60 * 1000) return "away";
      return "offline";
    }

    // Mock fallback
    try {
      const stored = localStorage.getItem("pv:memberActivity");
      if (stored) {
        const activities = JSON.parse(stored);
        const activity = activities[memberNameOrUid];
        if (!activity) return "offline";
        const timeSinceActive = Date.now() - activity.lastActive;
        if (timeSinceActive < 5 * 60 * 1000) return "online";
        if (timeSinceActive < 30 * 60 * 1000) return "away";
      }
    } catch {}
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

  const toggleMember = (memberName: string) => {
    setNewGroup((prev) => ({
      ...prev,
      members: prev.members.includes(memberName)
        ? prev.members.filter((m) => m !== memberName)
        : [...prev.members, memberName],
    }));
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;

    try {
      // Try API first
      const response = await fetch("/api/chat-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include auth cookies
        body: JSON.stringify({
          name: newGroup.name.trim(),
          description: newGroup.description.trim() || undefined,
          members: newGroup.members,
          isPrivate: newGroup.isPrivate,
        }),
      });

      if (response.ok) {
        const createdGroup = await response.json();

        // Update localStorage cache
        const stored = localStorage.getItem("pv:chatGroups");
        const groups = stored ? JSON.parse(stored) : [];
        localStorage.setItem(
          "pv:chatGroups",
          JSON.stringify([...groups, createdGroup])
        );

        // Reset form and close modal
        setNewGroup({
          name: "",
          description: "",
          members: [],
          isPrivate: false,
        });
        setShowCreateGroup(false);
        loadChatGroups(); // Refresh groups list

        // Show success notification
        setGroupCreationStatus({
          show: true,
          type: "success",
          message: `Group "${createdGroup.name}" created successfully!`,
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setGroupCreationStatus({ show: false, type: "success", message: "" });
        }, 5000);
      } else if (response.status === 503) {
        // Database offline - use fallback
        const data = await response.json();

        // Create local version using fallback data
        const localGroup = {
          id: `group_${Date.now()}`,
          name: data.fallback?.name || newGroup.name.trim(),
          description:
            data.fallback?.description ||
            newGroup.description.trim() ||
            undefined,
          members: data.fallback?.members || [currentUser, ...newGroup.members],
          createdBy: currentUser,
          createdAt: new Date().toISOString(),
          isPrivate: data.fallback?.isPrivate || newGroup.isPrivate,
        };

        const stored = localStorage.getItem("pv:chatGroups");
        const groups = stored ? JSON.parse(stored) : [];
        localStorage.setItem(
          "pv:chatGroups",
          JSON.stringify([...groups, localGroup])
        );

        // Reset form and close modal
        setNewGroup({
          name: "",
          description: "",
          members: [],
          isPrivate: false,
        });
        setShowCreateGroup(false);
        loadChatGroups(); // Refresh groups list

        // Show success notification with offline indicator
        setGroupCreationStatus({
          show: true,
          type: "success",
          message: `Group "${localGroup.name}" created successfully! (Offline mode)`,
        });

        setTimeout(() => {
          setGroupCreationStatus({ show: false, type: "success", message: "" });
        }, 5000);
      } else if (response.status === 403) {
        setGroupCreationStatus({
          show: true,
          type: "error",
          message: "You don't have permission to create chat groups.",
        });
      } else if (response.status === 409) {
        setGroupCreationStatus({
          show: true,
          type: "error",
          message: "You already have a group with this name.",
        });
      } else {
        // Generic error
        const errorData = await response.json().catch(() => ({}));
        setGroupCreationStatus({
          show: true,
          type: "error",
          message:
            errorData.error || "Failed to create group. Please try again.",
        });
      }
    } catch (error) {
      log.error(
        { err: error },
        "Failed to create group via API, trying localStorage"
      );

      // Fallback to localStorage only
      try {
        const group = {
          id: `group_${Date.now()}`,
          name: newGroup.name.trim(),
          description: newGroup.description.trim() || undefined,
          members: newGroup.members,
          createdBy: currentUser,
          createdAt: new Date().toISOString(),
          isPrivate: newGroup.isPrivate,
        };

        const stored = localStorage.getItem("pv:chatGroups");
        const groups = stored ? JSON.parse(stored) : [];
        localStorage.setItem(
          "pv:chatGroups",
          JSON.stringify([...groups, group])
        );

        // Reset form and close modal
        setNewGroup({
          name: "",
          description: "",
          members: [],
          isPrivate: false,
        });
        setShowCreateGroup(false);
        loadChatGroups(); // Refresh groups list

        // Show success notification
        setGroupCreationStatus({
          show: true,
          type: "success",
          message: `Group "${group.name}" created successfully! (Offline mode)`,
        });

        setTimeout(() => {
          setGroupCreationStatus({ show: false, type: "success", message: "" });
        }, 5000);
      } catch (localError) {
        log.error({ err: localError }, "Failed to create group");
        setGroupCreationStatus({
          show: true,
          type: "error",
          message: "Failed to create group. Please try again.",
        });
      }
    }
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
        {canCreateGroups && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateGroup(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Group
          </Button>
        )}
      </div>

      {/* Group Creation Success/Error Toast */}
      {groupCreationStatus.show && (
        <div
          className={`mx-4 mt-4 p-4 rounded-lg border flex items-start gap-3 animate-in slide-in-from-top ${
            groupCreationStatus.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          {groupCreationStatus.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm font-medium flex-1 ${
              groupCreationStatus.type === "success"
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            }`}
          >
            {groupCreationStatus.message}
          </p>
          <button
            onClick={() =>
              setGroupCreationStatus({
                show: false,
                type: "success",
                message: "",
              })
            }
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            {/* Chat Groups Section */}
            {chatGroups.length > 0 && (
              <div className="border-b border-border">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  Groups
                </div>
                {chatGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleStartChat(group.id)}
                    className={`w-full p-4 hover:bg-accent/50 transition-colors border-b border-border text-left ${
                      activeChat === group.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm truncate">
                            {group.name}
                          </span>
                          {group.isPrivate && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded ml-2">
                              Private
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {group.members.length} member
                          {group.members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Individual Members Section */}
            {filteredMembers.length === 0 && chatGroups.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {searchQuery ? "No matches found" : "No contacts available"}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No individual contacts match your search
              </div>
            ) : (
              <>
                {chatGroups.length > 0 && (
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Direct Messages
                  </div>
                )}
                {filteredMembers.map((member) => {
                  const conv = conversations.find(
                    (c) =>
                      c.withUser === member.uid || c.withUser === member.name
                  );
                  const status = getOnlineStatus(member.uid);

                  return (
                    <button
                      key={member.uid || member.name}
                      onClick={() => handleStartChat(member.uid || member.name)}
                      className={`w-full p-4 hover:bg-accent/50 transition-colors border-b border-border text-left ${
                        activeChat === member.uid || activeChat === member.name
                          ? "bg-accent"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Image
                            src={member.avatar}
                            alt={member.name}
                            width={48}
                            height={48}
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
                })}
              </>
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
                  {(() => {
                    const group = chatGroups.find((g) => g.id === activeChat);
                    if (group) {
                      return (
                        <>
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{group.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {group.members.length} members
                            </p>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <div className="relative">
                            <Image
                              src={
                                teamMembers.find(
                                  (m) =>
                                    m.uid === activeChat ||
                                    m.name === activeChat
                                )?.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat}`
                              }
                              alt={activeChat}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full"
                            />
                            <Circle
                              className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(getOnlineStatus(activeChat))} rounded-full border-2 border-card`}
                              fill="currentColor"
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {teamMembers.find(
                                (m) =>
                                  m.uid === activeChat || m.name === activeChat
                              )?.name || activeChat}
                            </h3>
                            <p className="text-xs text-muted-foreground uppercase">
                              {getOnlineStatus(activeChat)}
                            </p>
                          </div>
                        </>
                      );
                    }
                  })()}
                </div>
                <div className="relative" ref={actionMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowActionMenu(!showActionMenu)}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                  {showActionMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                      <button
                        onClick={handleClearChat}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 rounded-t-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Chat
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
                              <button
                                onClick={() => {
                                  // Use attachment from message if available
                                  if (msg.attachment) {
                                    setPreviewFile(msg.attachment);
                                  } else {
                                    // Fallback for legacy messages or if attachment missing
                                    const fileName = msg.message.replace(
                                      "📎 ",
                                      ""
                                    );
                                    // Try to find in current session attachments (unlikely but safe)
                                    const file = attachments.find(
                                      (a) => a.name === fileName
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
                    accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="relative flex-1">
                    <Input
                      id="chat-message-input"
                      name="message"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && !e.shiftKey && handleSendMessage()
                      }
                      placeholder="Type a message..."
                      className="flex-1 pr-10 h-12"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 p-3 bg-card border border-border rounded-lg shadow-lg grid grid-cols-8 gap-2 max-w-xs">
                        {[
                          "😊",
                          "😂",
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
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="text-2xl hover:bg-accent p-2 rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() && attachments.length === 0}
                    className="shrink-0 h-12"
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

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-accent rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              {previewFile.type.startsWith("image/") ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <File className="w-16 h-16 mb-4" />
                  <p className="text-sm">{previewFile.name}</p>
                  <p className="text-xs mt-1">
                    {formatFileSize(previewFile.size)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = previewFile.url;
                  a.download = previewFile.name;
                  a.click();
                }}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewFile(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateGroup(false)}
        >
          <div
            className="bg-card border border-border rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Chat Group</h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="p-2 hover:bg-accent rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Group Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Project Team"
                  className="w-full"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  placeholder="Optional description"
                  className="w-full"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Add Members
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {teamMembers.map((member) => (
                    <label
                      key={member.name}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={newGroup.members.includes(member.email)}
                        onChange={() => toggleMember(member.email)}
                      />
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role.replace("_", " ")}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  className="rounded"
                  checked={newGroup.isPrivate}
                  onChange={(e) =>
                    setNewGroup((prev) => ({
                      ...prev,
                      isPrivate: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="private" className="text-sm">
                  Private group (only visible to members)
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateGroup}
                  disabled={!newGroup.name.trim()}
                  className="flex-1"
                >
                  Create Group
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
