import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Check if users exist in the database
 * Used for Global Admin access control
 */
export async function GET(req: NextRequest) {
  try {
    // Check if any users exist
    const userCount = await prisma.user.count();

    // Check if any master admin exists
    const masterAdminCount = await prisma.user.count({
      where: {
        isMasterAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      hasUsers: userCount > 0,
      hasMasterAdmin: masterAdminCount > 0,
      canAccessWithGlobalAdmin: userCount === 0, // Can use Global Admin if no users exist
    });
  } catch (error: any) {
    // If database error, allow Global Admin access
    console.error("Error checking users:", error);
    return NextResponse.json({
      success: false,
      hasUsers: false,
      hasMasterAdmin: false,
      canAccessWithGlobalAdmin: true, // DB error = allow Global Admin
      error: error.message,
    });
  }
}
