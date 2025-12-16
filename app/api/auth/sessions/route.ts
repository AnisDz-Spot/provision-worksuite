import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getActiveSessions, revokeAllSessions } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current token to mark current session
  const token = request.cookies.get("auth-token")?.value;

  try {
    // Need ID (int) from user record since AuthUser uses uid (string) ?
    // AuthUser has uid, checking if it has numeric id logic?
    // Actually AuthUser from lib/auth.ts only has { uid, email, role }.
    // So I need to fetch the numeric ID from DB.

    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

    if (!dbUser) throw new Error("User not found");

    const sessions = await getActiveSessions(dbUser.id);

    return NextResponse.json({
      sessions: sessions.map((s: any) => ({
        ...s,
        isCurrent: s.token === token,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = request.cookies.get("auth-token")?.value;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

    if (!dbUser) throw new Error("User not found");

    // Revoke all EXCEPT current
    await revokeAllSessions(dbUser.id, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to revoke sessions" },
      { status: 500 }
    );
  }
}
