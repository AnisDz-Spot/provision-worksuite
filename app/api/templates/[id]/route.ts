import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { updateProjectSchema, validateRequest } from "@/lib/schemas/validation";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!shouldUseDatabaseData()) {
    return NextResponse.json(
      { error: "Mock data not supported for single template" },
      { status: 501 }
    );
  }

  const { id } = await params;

  try {
    const template = await prisma.project.findFirst({
      where: {
        uid: id,
        tags: { has: "Template" },
      },
      include: {
        tasks: true,
        milestones: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const PUT = withRateLimit(
  RATE_LIMITS.MUTATION,
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins/PMs can update templates
    const allowedRoles = [
      "admin",
      "global-admin",
      "project-manager",
      "master-admin",
    ];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
      const body = await req.json();

      // We reuse updateProjectSchema but might need to ensure 'Template' tag isn't removed accidentally
      const validation = validateRequest(updateProjectSchema, body);

      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed" },
          { status: 400 }
        );
      }

      // Check if template exists
      const existing = await prisma.project.findFirst({
        where: { uid: id, tags: { has: "Template" } },
        select: { id: true, tags: true },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      // Merge tags to ensure "Template" is kept
      let newTags = validation.data?.tags || existing.tags;
      if (!newTags.includes("Template")) {
        newTags.push("Template");
      }

      const updated = await prisma.project.update({
        where: { id: existing.id },
        data: {
          ...validation.data,
          tags: newTags,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      console.error("Failed to update template:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withRateLimit(
  RATE_LIMITS.MUTATION,
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = [
      "admin",
      "global-admin",
      "project-manager",
      "master-admin",
    ];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
      const template = await prisma.project.findFirst({
        where: { uid: id, tags: { has: "Template" } },
        select: { id: true },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      // Hard delete for templates? Or soft delete?
      // Usually soft delete projects, but if it's just a template... let's soft delete to be safe.
      await prisma.project.update({
        where: { id: template.id },
        data: { archivedAt: new Date() },
      });

      return NextResponse.json({ success: true, message: "Template deleted" });
    } catch (error) {
      console.error("Failed to delete template:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);
