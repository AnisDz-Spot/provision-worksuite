import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Master Admin Check
  // Assuming role 'master_admin' or checking specific email/uid if needed
  // For now we check role from DB or AuthContext (which we don't have here, so DB check is safer)
  const dbUser = await prisma.user.findUnique({
    where: { uid: user.uid },
    select: { role: true },
  });

  if (!dbUser) {
    console.log(`[Admin API] User ${user.uid} not found in database`);
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  const isAuthorized =
    dbUser.role === "master_admin" ||
    dbUser.role === "Master Admin" ||
    dbUser.role === "Administrator" ||
    dbUser.role === "admin";

  console.log(
    `[Admin API] User: ${user.email}, DB Role: ${dbUser.role}, Authorized: ${isAuthorized}`
  );

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden: ${dbUser.role} role does not have admin access`,
      },
      { status: 403 }
    );
  }

  try {
    // Fetch ALL conversations
    const allConversations = await prisma.conversation.findMany({
      include: {
        members: true, // Need this to show who is in the chat
        chatGroups: true, // Check for global archival
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Preview last message
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = await Promise.all(
      allConversations.map(async (conv: any) => {
        // Resolve member names
        const memberUids = conv.members.map((m: any) => m.userId);
        const memberUsers = await prisma.user.findMany({
          where: { uid: { in: memberUids } },
          select: { uid: true, name: true, avatarUrl: true, email: true },
        });

        // Create a human readable title: "Alice, Bob"
        const title =
          conv.name ||
          memberUsers.map((u: any) => u.name).join(", ") ||
          "Unknown";

        const lastMsg = conv.messages[0];
        const linkedGroup = conv.chatGroups?.[0];

        return {
          id: conv.id,
          type: conv.type,
          name: title,
          members: memberUsers,
          lastMessage: lastMsg?.message || "",
          lastTimestamp: lastMsg?.createdAt || conv.updatedAt,
          memberCount: conv.members.length,
          isArchived: linkedGroup?.isArchived || false,
        };
      })
    );

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    log.error({ err: error }, "Admin fetch conversations error");
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit log" },
      { status: 500 }
    );
  }
}
