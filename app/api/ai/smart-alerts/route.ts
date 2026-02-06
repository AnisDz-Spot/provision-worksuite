import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAIContent } from "@/lib/ai";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch relevant portfolio data
    const projects = await prisma.project.findMany({
      where: {
        archivedAt: null,
        status: { notIn: ["completed", "cancelled"] },
      },
      select: {
        id: true,
        name: true,
        deadline: true,
        progress: true,
        budget: true,
        expenses: {
          select: { amount: true },
        },
        _count: {
          select: { tasks: true, milestones: true },
        },
        tasks: {
          where: { status: { not: "completed" } },
          select: { priority: true, status: true },
        },
      },
      take: 20, // Limit to active/recent for performance
    });

    if (projects.length === 0) {
      return NextResponse.json({ success: true, alerts: [] });
    }

    // 2. Prepare context
    const context = projects.map((p: any) => {
      const spent = p.expenses.reduce(
        (sum: number, e: any) => sum + Number(e.amount),
        0,
      );
      const budgetUtilization =
        p.budget && p.budget > 0 ? (spent / Number(p.budget)) * 100 : 0;

      const urgentTasks = p.tasks.filter(
        (t: any) => t.priority === "urgent" || t.priority === "high",
      ).length;

      return {
        id: p.id,
        name: p.name,
        deadline: p.deadline,
        progress: p.progress,
        budgetUtilization: budgetUtilization.toFixed(1),
        urgentOpenTasks: urgentTasks,
        totalOpenTasks: p.tasks.length,
      };
    });

    console.log("Smart Alerts Context:", JSON.stringify(context, null, 2));

    // 3. AI Analysis
    const prompt = `
      You are a Smart Project Alert System. Analyze the following project data for "Urgent Anomalies" that require immediate attention.

      PROJECT DATA:
      ${JSON.stringify(context, null, 2)}

      RULES:
      - Alert if Deadline is soon (< 14 days) but Progress is low (< 70%).
      - Alert if Budget Utilization > 80%.
      - Alert if "Urgent Open Tasks" > 3.
      - If no urgent issues, generate at least one "Optimization Opportunity" (e.g., "Budget is healthy, consider allocating more resources to speed up Project X").
      - Generate a specific "Action" for each alert.

      RESPONSE FORMAT (JSON ONLY, Array of objects):
      [
        {
          "projectId": "id",
          "title": "Short title (e.g., 'Budget Critical')",
          "severity": "high|medium|low",
          "message": "Concise explanation.",
          "suggestedAction": {
            "label": "Button Label (e.g., 'Request Approval')",
            "type": "notify_team|request_budget|reschedule_tasks" 
          }
        }
      ]
    `;

    const aiResponse: any = await generateAIContent(prompt);
    let alerts;
    try {
      const content =
        typeof aiResponse === "string" ? aiResponse : aiResponse.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      alerts = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error("Failed to parse Smart Alerts:", aiResponse);
      return NextResponse.json(
        { error: "Failed to generate alerts" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    console.error("Smart Alerts Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
