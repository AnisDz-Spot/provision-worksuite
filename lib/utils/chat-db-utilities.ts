import { fetchWithCsrf } from "@/lib/csrf-client";
import { type ChatConversation, type ChatMessage } from "./team-utilities";

/**
 * DB-backed Chat Helpers
 * These functions interact with the /api/messages related endpoints.
 */

export async function dbFetchThread(
  user1: string,
  user2: string,
  conversationId?: string
) {
  try {
    const url = conversationId
      ? `/api/messages?conversationId=${encodeURIComponent(conversationId)}`
      : `/api/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`;

    const res = await fetch(url, { credentials: "include", cache: "no-store" });
    const data = await res.json();

    if (!res.ok || !data?.success) throw new Error("API Error");
    return (data.data || []).map((row: any) => ({
      id: String(row.id),
      fromUser: row.from_user,
      toUser: row.to_user,
      message: row.message,
      timestamp: new Date(row.created_at).getTime(),
      read: !!row.is_read,
      conversationId: row.conversationId,
    }));
  } catch (error) {
    console.error("dbFetchThread error:", error);
    return [];
  }
}

export async function dbSendMessage(
  fromUser: string,
  toUser: string,
  message: string,
  conversationId?: string
) {
  try {
    const res = await fetchWithCsrf("/api/messages", {
      method: "POST",
      body: JSON.stringify({ fromUser, toUser, message, conversationId }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("dbSendMessage error:", error);
    return { success: false };
  }
}

export async function dbMarkRead(
  currentUser: string,
  otherUser: string,
  conversationId?: string
) {
  try {
    await fetchWithCsrf("/api/messages/mark-read", {
      method: "POST",
      body: JSON.stringify({ currentUser, otherUser, conversationId }),
    });
    return true;
  } catch (error) {
    console.error("dbMarkRead error:", error);
    return false;
  }
}

export async function dbDeleteMessage(id: string) {
  try {
    const res = await fetchWithCsrf(`/api/messages/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error("dbDeleteMessage error:", error);
    return false;
  }
}

export async function dbDeleteThread(
  user1: string,
  user2: string,
  conversationId?: string
) {
  try {
    const url = conversationId
      ? `/api/messages?conversationId=${encodeURIComponent(conversationId)}`
      : `/api/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`;

    const res = await fetchWithCsrf(url, { method: "DELETE" });
    return res.ok;
  } catch (error) {
    console.error("dbDeleteThread error:", error);
    return false;
  }
}

export async function dbFetchConversations(
  user: string
): Promise<ChatConversation[]> {
  try {
    const res = await fetch(
      `/api/messages/conversations?user=${encodeURIComponent(user)}`,
      { credentials: "include", cache: "no-store" }
    );
    const data = await res.json();

    if (!res.ok || !data?.success) throw new Error("API Error");
    return (data.data || []).map((row: any) => ({
      id: row.id,
      withUser: row.withUser,
      withUserName: row.withUserName || row.withUser,
      withUserAvatar: row.withUserAvatar,
      lastMessage: row.lastMessage,
      lastTimestamp: new Date(row.lastTimestamp).getTime(),
      unreadCount: row.unreadCount || 0,
      isOnline: !!row.isOnline,
      type: row.type || "direct",
      name: row.name,
    }));
  } catch (error) {
    console.error("dbFetchConversations error:", error);
    return [];
  }
}
