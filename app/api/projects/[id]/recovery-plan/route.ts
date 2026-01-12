import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai";
import { calculateProjectHealth } from "@/lib/project-health";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Resolve project (Slug -> UID -> ID)
    let project = await prisma.project.findFirst({
      where: { OR: [{ slug: id }, { uid: id }] },
      include: {
        department: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      const idAsInt = parseInt(id);
      if (!isNaN(idAsInt)) {
        project = await prisma.project.findUnique({
          where: { id: idAsInt },
          include: {
            department: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
            },
            tasks: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      }
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch blockers for accurate context
    const blockers = await prisma.blocker.findMany({
      where: { projectId: project.uid, status: "open" },
      include: { category: true },
    });

    // Calculate project health distribution
    const taskStats = {
      total: project.tasks.length,
      completed: project.tasks.filter((t: any) => t.status === "done").length,
      blocked: project.tasks.filter((t: any) => t.status === "blocked").length,
      inProgress: project.tasks.filter((t: any) => t.status === "in_progress")
        .length,
      percent:
        project.tasks.length > 0
          ? (project.tasks.filter((t: any) => t.status === "done").length /
              project.tasks.length) *
            100
          : 0,
    };

    const health = calculateProjectHealth({
      progress: taskStats.percent,
      deadline: project.deadline?.toISOString() || "",
      status: project.status,
    });

    // Construct the context for AI
    const projectContext = {
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      deadline: project.deadline,
      budget: project.budget,
      spent: project.spent,
      progress: project.progress || taskStats.percent,
      healthScore: health.score,
      healthLevel: health.level,
      tasks: project.tasks.map((t: any) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee?.name || "Unassigned",
        due: t.due,
      })),
      blockers: blockers.map((b: any) => ({
        title: b.title,
        level: b.level,
        category: b.category?.label || "Uncategorized",
      })),
      memberCount: project.members.length,
    };

    const systemPrompt = `
      You are an expert Project Auditor and Recovery Specialist. 
      Your goal is to provide a structured, actionable recovery plan for a project based on its current data.
      Be realistic, concise, and professional. 
      Focus on identifying root causes (e.g., specific user blocking tasks, unrealistic deadlines, budget overruns) and suggest immediate wins.
    `;

    const prompt = `
      Current Project Context:
      ${JSON.stringify(projectContext, null, 2)}

      Please generate a comprehensive Recovery Plan with the following sections:
      1. Executive Summary: What is the primary issue?
      2. Immediate Actions: What must be done in the next 48 hours?
      3. Resource Adjustments: Are team members overloaded? Who needs support?
      4. Timeline & Budget: Is the deadline realistic? What's the new forecasted date?
      5. Risk Mitigation: How to prevent these issues from recurring?

      Format the response in clean Markdown.
    `;

    const aiResponse = await generateAIContent(prompt, systemPrompt);

    return NextResponse.json({
      success: true,
      plan: aiResponse.content,
    });
  } catch (error: any) {
    console.error("Recovery plan error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
