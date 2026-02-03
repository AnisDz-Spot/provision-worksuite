import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAIContent } from "@/lib/ai";
import { getAuthenticatedUser } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch data for analysis
    const [projects, members] = await Promise.all([
      prisma.project.findMany({
        where: { status: { notIn: ["completed", "cancelled"] } },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          deadline: true,
          _count: {
            select: { tasks: { where: { status: { not: "completed" } } } },
          },
        },
      }),
      prisma.user.findMany({
        where: { role: { not: "admin" } },
        select: {
          id: true,
          name: true,
          tasks: {
            where: { status: { not: "completed" } },
            select: {
              id: true,
              title: true,
              priority: true,
              projectId: true,
              dueDate: true,
            },
          },
        },
      }),
    ]);

    // 2. Prepare context for AI
    const analysisContext = {
      projects: projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        activeTasks: p._count.tasks,
        progress: p.progress,
        deadline: p.deadline,
      })),
      resources: members.map((m: any) => ({
        id: m.id,
        name: m.name,
        taskCount: m.tasks.length,
        highPriorityTasks: m.tasks.filter((t: any) =>
          ["high", "urgent"].includes(t.priority),
        ).length,
        tasks: m.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          projectId: t.projectId,
        })),
      })),
    };

    const prompt = `
      You are a Strategic Portfolio Manager AI. Analyze the following data and generate a "Strategic Resource Reallocation Plan".
      
      CONTEXT:
      ${JSON.stringify(analysisContext, null, 2)}
      
      GOALS:
      1. Identify users who are "Overloaded" (too many tasks or too many high-priority tasks).
      2. Identify users who are "Under-utilized" (fewer tasks).
      3. Suggest specific task moves from Overloaded users to Under-utilized users.
      4. Ensure the moves make sense (e.g., don't break project focus if possible).
      
      RESPONSE FORMAT (JSON ONLY):
      {
        "analysis": "A brief 2-3 sentence overview of the current resource bottlenecks.",
        "bottlenecks": [ { "userName": "string", "reason": "string" } ],
        "suggestions": [
          {
            "taskId": "string",
            "taskTitle": "string",
            "fromUser": "string",
            "toUser": "string",
            "rationale": "Why this move is strategic (e.g., 'Relieves pressure on X while Y has capacity').",
            "impact": "Expected impact on project timeline."
          }
        ],
        "riskLevel": "high|medium|low"
      }
    `;

    const aiResponse: any = await generateAIContent(prompt);
    let result;
    try {
      const content =
        typeof aiResponse === "string" ? aiResponse : aiResponse.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error("Failed to parse Strategic Plan response:", aiResponse);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Strategic Plan Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
