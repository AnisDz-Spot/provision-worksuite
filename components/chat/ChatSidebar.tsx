"use client";

import Image from "next/image";
import { Search, Users, MessageCircle, Circle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { type ChatConversation } from "@/lib/utils";

// ... (props omitted for brevity in instruction, will be included in ReplacementContent)

interface ChatSidebarProps {
  viewMode: "active" | "archived" | "directory";
  setViewMode: (mode: "active" | "archived" | "directory") => void;
  chatGroups: any[];
  filteredMembers: any[];
  conversations: ChatConversation[];
  adminConversations?: any[];
  activeChat: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isMasterAdmin: boolean;
  handleStartChat: (id: string, cid?: string) => void;
  getOnlineStatus: (id: string) => string;
  showMobileSidebar: boolean;
}

export function ChatSidebar({
  viewMode,
  setViewMode,
  chatGroups,
  filteredMembers,
  conversations,
  adminConversations,
  activeChat,
  activeConversationId, // New destructure
  searchQuery,
  setSearchQuery,
  isMasterAdmin,
  handleStartChat,
  getOnlineStatus,
  showMobileSidebar,
}: ChatSidebarProps & { activeConversationId?: string | null }) {
  return (
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

      {/* Sidebar Tabs */}
      <div className="flex border-b border-border bg-card/50">
        <button
          onClick={() => setViewMode("active")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setViewMode("directory")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === "directory"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Team
        </button>
        {isMasterAdmin && (
          <button
            onClick={() => setViewMode("archived")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === "archived"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Archives
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Chat Groups Section */}
        {viewMode === "active" && chatGroups.length > 0 && (
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
                      {group.project && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[10px] font-medium border border-blue-500/20">
                          {group.project.name}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Individual Members Section */}
        {viewMode === "active" &&
          (filteredMembers.length === 0 && chatGroups.length === 0 ? (
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
                  (c) => c.withUser === member.uid || c.withUser === member.name
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
                          className="w-12 h-12 rounded-full border border-border"
                        />
                        <Circle
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                            status === "online"
                              ? "bg-green-500 text-green-500"
                              : status === "away"
                                ? "bg-yellow-500 text-yellow-500"
                                : "bg-gray-400 text-gray-400"
                          }`}
                          fill="currentColor"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm truncate">
                            {member.name}
                          </span>
                          {conv && (
                            <span className="text-[10px] text-muted-foreground">
                              {/* Last message time would go here if available */}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate flex-1">
                            {member.role.replace("_", " ")}
                          </p>
                          {conv && conv.unreadCount > 0 && (
                            <span className="ml-2 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          ))}

        {/* Archives View (Master Admin Only) */}
        {viewMode === "archived" && isMasterAdmin && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Archived Conversations
            </div>
            {adminConversations &&
            adminConversations.filter((c: any) => c.isArchived).length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No archived conversations found
              </div>
            ) : (
              adminConversations
                ?.filter((c: any) => c.isArchived)
                .map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() =>
                      handleStartChat(conv.name || conv.id, conv.id)
                    }
                    className={`w-full p-4 hover:bg-accent/50 transition-colors border-b border-border text-left ${
                      activeConversationId === conv.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm truncate">
                            {conv.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.memberCount} members • {conv.type}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
            )}
          </div>
        )}

        {/* Directory View (All Team Members) */}
        {viewMode === "directory" && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Team Directory
            </div>
            {filteredMembers.map((member) => (
              <button
                key={member.uid || member.name}
                onClick={() => handleStartChat(member.uid || member.name)}
                className="w-full p-4 hover:bg-accent/50 transition-colors border-b border-border text-left flex items-center gap-3"
              >
                <Image
                  src={member.avatar}
                  alt={member.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.role.replace("_", " ")}
                  </p>
                </div>
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
