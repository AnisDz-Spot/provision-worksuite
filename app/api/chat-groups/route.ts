import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData } from "@/lib/dataSource";

// Type definitions
interface CreateGroupRequest {
  name: string;
  description?: string;
  members: string[];
  isPrivate?: boolean;
}

// Helper to validate email format
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export async function GET(request: NextRequest) {
  try {
    // In demo mode, return empty or mock from localStorage handles it
    if (!shouldUseDatabaseData()) {
      return NextResponse.json([]);
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email;

    // Try to fetch groups, catch DB errors
    try {
      const groups = await prisma.chatGroup.findMany({
        where: {
          OR: [{ createdBy: userEmail }, { members: { has: userEmail } }],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      });

      return NextResponse.json(groups);
    } catch (dbError) {
      log.warn({ err: dbError }, "Database unavailable for chat groups");
      return NextResponse.json([]);
    }
  } catch (error) {
    log.error({ err: error }, "Failed to fetch chat groups");
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!shouldUseDatabaseData()) {
      return NextResponse.json(
        { error: "Database mode required for creating groups" },
        { status: 403 }
      );
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email;

    const body = (await request.json()) as CreateGroupRequest;
    const { name, description, members = [], isPrivate = false } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // ... (rest of validation)
    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "Group name must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (!Array.isArray(members)) {
      return NextResponse.json(
        { error: "Members must be an array" },
        { status: 400 }
      );
    }

    // Validate member emails
    const invalidEmails = members.filter((email) => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(", ")}` },
        { status: 400 }
      );
    }

    // Remove duplicates and ensure creator is included
    const uniqueMembers = Array.from(new Set([userEmail, ...members]));

    // Limit members
    if (uniqueMembers.length > 100) {
      return NextResponse.json(
        { error: "Group cannot have more than 100 members" },
        { status: 400 }
      );
    }

    // Try to create in database
    try {
      // Check for duplicate group name by same creator
      const existing = await prisma.chatGroup.findFirst({
        where: {
          name: name.trim(),
          createdBy: userEmail,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "You already have a group with this name" },
          { status: 409 }
        );
      }

      // Create chat group
      const group = await prisma.chatGroup.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          members: uniqueMembers,
          createdBy: userEmail,
          isPrivate: isPrivate,
        },
      });

      log.info({ groupId: group.id, userEmail }, "Chat group created");

      return NextResponse.json(group, { status: 201 });
    } catch (dbError) {
      log.error({ err: dbError }, "Database error during group creation");
      return NextResponse.json(
        { error: "Failed to create group in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error({ err: error }, "Failed to create chat group");
    return NextResponse.json(
      { error: "Failed to create chat group" },
      { status: 500 }
    );
  }
}
