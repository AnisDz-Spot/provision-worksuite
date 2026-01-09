import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData, shouldReturnMockData } from "@/lib/auth-utils";

const MOCK_DECISIONS = [
  {
    id: "decision-1",
    title: "Use PostgreSQL",
    status: "approved",
    tags: ["tech", "database"],
  },
];

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      return NextResponse.json(MOCK_DECISIONS);
    }

    const decisions = await prisma.decision.findMany({
      orderBy: { decidedAt: "desc" },
    });

    return NextResponse.json(decisions);
  } catch (error) {
    console.error("Failed to fetch decisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch decisions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only Master Admin, Admin, and Project Manager can save decisions
    const { isAdmin, isProjectManager } = await import("@/lib/auth-utils");
    if (!isAdmin(user) && !isProjectManager(user)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to save decisions" },
        { status: 403 }
      );
    }

    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    const data = await req.json();

    // If update (id provided)
    if (data.id && !data.id.startsWith("decision-")) {
      const updated = await prisma.decision.update({
        where: { id: data.id },
        data: {
          title: data.title,
          context: data.context,
          decision: data.decision,
          rationale: data.rationale,
          status: data.status,
          tags: data.tags,
          alternatives: data.alternatives,
          consequences: data.consequences,
          projectId: data.projectId,
          decidedBy: data.decidedBy,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    // Create
    const created = await prisma.decision.create({
      data: {
        title: data.title,
        context: data.context,
        decision: data.decision,
        rationale: data.rationale,
        status: data.status || "pending",
        tags: data.tags || [],
        alternatives: data.alternatives || [],
        consequences: data.consequences || [],
        projectId: data.projectId,
        decidedBy: data.decidedBy || [user.uid],
        decidedAt: new Date(),
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Failed to save decision:", error);
    return NextResponse.json(
      { error: "Failed to save decision" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only Master Admin, Admin, and Project Manager can delete decisions
    const { isAdmin, isProjectManager } = await import("@/lib/auth-utils");
    if (!isAdmin(user) && !isProjectManager(user)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete decisions" },
        { status: 403 }
      );
    }

    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      return NextResponse.json({ success: true });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.decision.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete decision:", error);
    return NextResponse.json(
      { error: "Failed to delete decision" },
      { status: 500 }
    );
  }
}
