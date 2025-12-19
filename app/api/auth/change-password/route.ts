import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // 3. Prevent global admin password change via this API if it's the backdoor account
    if (
      authUser.uid === "admin-global" ||
      authUser.email === "admin@provision.com"
    ) {
      // Check if there is a real record for this email
      const realUser = await prisma.user.findUnique({
        where: { email: authUser.email },
      });

      if (!realUser) {
        return NextResponse.json(
          {
            error:
              "Cannot change password for the global backdoor account. Create a real user instead.",
          },
          { status: 403 }
        );
      }
    }

    // 4. Get user from DB
    const user = await prisma.user.findUnique({
      where: { uid: authUser.uid },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 5. Verify current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash || ""
    );
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect current password" },
        { status: 400 }
      );
    }

    // 6. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 7. Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    log.info({ uid: authUser.uid }, "User changed password successfully");

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
