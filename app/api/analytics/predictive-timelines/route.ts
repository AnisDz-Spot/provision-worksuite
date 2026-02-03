import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAIContent } from "@/lib/ai";
import { getAuthenticatedUser } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch project data with task history and velocity indicators
    const projects = await prisma.project.findMany({
      where: {
        status: { notIn: ["completed", "cancelled"] },
      },
      select: {
        id: true,
        name: true,
        progress: true,
        deadline: true,
        createdAt: true,
        tasks: {
          select: {
            status: true,
            priority: true,
            createdAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. Prepare context for AI to estimate completion
    const context = projects.map((p: any) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter(
        (t: any) => t.status === "completed",
      ).length;
      const pendingTasks = totalTasks - completedTasks;

      // Calculate a rough velocity (completed tasks per day since project start)
      const startDate = new Date(p.createdAt);
      const today = new Date();
      const daysActive = Math.max(
        1,
        Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      const velocity = completedTasks / daysActive;

      return {
        id: p.id,
        name: p.name,
        targetDeadline: p.deadline,
        totalTasks,
        completedTasks,
        pendingTasks,
        velocity: velocity.toFixed(2), // tasks per day
        highPriorityPending: p.tasks.filter(
          (t: any) =>
            t.status !== "completed" &&
            (t.priority === "high" || t.priority === "urgent"),
        ).length,
        progress: p.progress,
      };
    });

    const prompt = `
      You are a Project Forecasting AI. Based on the following project data (velocity, pending tasks, and current progress), predict the "True Delivery Date" for each project.
      
      PORTFOLIO DATA:
      ${JSON.stringify(context, null, 2)}
      
      GOAL:
      For each project, estimate a realistic completion date. If the project is ahead of its target deadline, set the predicted date early. If it's lagging (low velocity vs. many tasks), set it significantly later.
      
      RESPONSE FORMAT (JSON ONLY):
      [
        {
          "projectId": "string",
          "projectName": "string",
          "targetDeadline": "string (ISO)",
          "predictedDeadline": "string (ISO)",
          "confidence": number (0-1),
          "risk": "high|medium|low",
          "reasoning": "Brief explanation of the prediction (e.g., 'Low velocity vs. high-priority tasks remaining')."
        }
      ]
    `;

    const aiResponse: any = await generateAIContent(prompt);
    let predictions;
    try {
      const content =
        typeof aiResponse === "string" ? aiResponse : aiResponse.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      predictions = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error(
        "Failed to parse Predictive Timeline response:",
        aiResponse,
      );
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: predictions });
  } catch (error) {
    console.error("Predictive Timeline Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
