import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projects } = await request.json();

    if (!Array.isArray(projects)) {
      return NextResponse.json(
        { success: false, error: "Invalid projects array" },
        { status: 400 }
      );
    }

    if (projects.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Limit batch size to prevent timeout
    if (projects.length > 100) {
      return NextResponse.json(
        { success: false, error: "Maximum 100 projects per batch" },
        { status: 400 }
      );
    }

    // Process each project sequentially to avoid transaction complexity
    let successCount = 0;
    const errors: string[] = [];

    for (const project of projects) {
      try {
        const uid = String(project.uid || project.id || "");
        if (!uid) continue; // Skip if no ID

        // Generate a simple slug if not provided, just to satisfy unique constraint if creating
        // For updates, we don't want to overwrite unless necessary.
        // Ideally slug generation happens on creation.
        // We'll use the ID as fallback slug if needed or just let the default(cuid) handle it on create.

        await prisma.project.upsert({
          where: { uid: uid },
          create: {
            uid: uid,
            name: project.name || "Untitled Project",
            description: project.description || null,
            status: (project.status || "active").toLowerCase(),
            deadline: project.deadline ? new Date(project.deadline) : null,
            priority: project.priority || null,
            budget: project.budget || null,
            userId: user.uid ? parseInt(user.uid) : 0, // Ensure int
            tags: project.tags || [],
            categories: project.categories || [],
            visibility: project.privacy || "private",
            completedAt: project.status === "Completed" ? new Date() : null,
            // Slug will use default(cuid()) if not provided here, which is safe for unique constraint
          },
          update: {
            name: project.name || "Untitled Project",
            description: project.description || null,
            status: (project.status || "active").toLowerCase(),
            deadline: project.deadline ? new Date(project.deadline) : null,
            priority: project.priority || null,
            budget: project.budget || null,
            tags: project.tags || [],
            categories: project.categories || [],
            visibility: project.privacy || "private",
            completedAt: project.status === "Completed" ? new Date() : null,
          },
        });
        successCount++;
      } catch (err) {
        errors.push(`Project ${project.id || project.name}: ${err}`);
      }
    }

    log.info(
      { count: successCount, errors: errors.length, userId: user.uid },
      "Bulk saved projects"
    );

    return NextResponse.json({
      success: errors.length === 0,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    log.error({ err: error }, "Bulk save projects failed");
    return NextResponse.json(
      { success: false, error: "Failed to save projects" },
      { status: 500 }
    );
  }
}
