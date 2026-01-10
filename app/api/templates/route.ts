import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldReturnMockData } from "@/lib/mock-helper";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { createProjectSchema, validateRequest } from "@/lib/schemas/validation";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Workaround: Use "Template" tag to identify templates
  if (!shouldUseDatabaseData()) {
    return NextResponse.json({ success: true, data: [] }); // No mock templates for now
  }

  try {
    const templates = await prisma.project.findMany({
      where: {
        tags: {
          has: "Template",
        },
        archivedAt: null,
      },
      include: {
        _count: {
          select: {
            tasks: true,
            milestones: true,
          },
        },
        tasks: {
          where: { archivedAt: null },
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform for UI
    const formattedTemplates = templates.map((t: any) => ({
      id: t.uid, // Use UID for frontend
      name: t.name,
      description: t.description,
      category:
        t.categories && t.categories.length > 0 ? t.categories[0] : "Other",
      tags: t.tags.filter((tag: string) => tag !== "Template"), // Hide internal tag
      tasks: t.tasks, // Simplified tasks
      milestones: [], // Placeholder
      projectData: {
        priority: t.priority,
      },
    }));

    return NextResponse.json({ success: true, data: formattedTemplates });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(RATE_LIMITS.MUTATION, async (req: any) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins/PMs can create templates
  const allowedRoles = [
    "admin",
    "global-admin",
    "project-manager",
    "master-admin",
  ];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Use existing project schema but allow some looseness if needed
    // We force the "Template" tag
    const validation = validateRequest(createProjectSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const { name, description, tags, categories, priority } = validation.data;

    // Ensure "Template" tag is present
    const templateTags = Array.isArray(tags) ? [...tags] : [];
    if (!templateTags.includes("Template")) {
      templateTags.push("Template");
    }

    const dbUser = await prisma.user.findUnique({ where: { uid: user.uid } });
    if (!dbUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let uniqueSlug = slug;
    // Simple uniqueness check
    const existing = await prisma.project.findFirst({
      where: { slug: uniqueSlug },
    });
    if (existing) uniqueSlug = `${slug}-${Date.now()}`;

    const template = await prisma.project.create({
      data: {
        name,
        slug: uniqueSlug,
        description,
        status: "active", // Templates are active projects technically
        userId: dbUser.id,
        tags: templateTags,
        categories: categories || [],
        priority: priority || "medium",
        visibility: "public", // Templates usually public to team
        // Initialize with default lists/tasks if provided (future)
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});
