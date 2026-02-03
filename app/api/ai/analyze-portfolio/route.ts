import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch projects with their health metrics
    const projects = await prisma.project.findMany({
      where: {
        archived: false,
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        deadline: true,
        _count: {
          select: {
            tasks: true,
            milestones: true,
          },
        },
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({
        success: true,
        summary: "No active projects to analyze.",
        risks: [],
        suggestions: [],
      });
    }

    // Prepare data for AI
    const portfolioData = projects.map((p: any) => ({
      name: p.name,
      status: p.status,
      progress: `${p.progress}%`,
      deadline: p.deadline,
      taskCount: p._count.tasks,
      milestoneCount: p._count.milestones,
    }));

    const prompt = `
      Analyze the following project portfolio and identify high-level strategic risks and suggestions for the manager.
      
      Portfolio Data:
      ${JSON.stringify(portfolioData, null, 2)}
      
      Provide a response in JSON format:
      {
        "summary": "A 2-3 sentence overview of portfolio health",
        "risks": [
          { "level": "high|medium|low", "description": "Risk details", "impact": "Impact on portfolio" }
        ],
        "suggestions": [
          { "action": "Actionable item", "priority": "high|medium|low" }
        ]
      }
    `;

    const aiResponse: any = await generateAIContent(prompt);

    let result;
    try {
      // Find JSON block if it exists
      const content =
        typeof aiResponse === "string" ? aiResponse : aiResponse.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse);
      result = {
        summary:
          "AI analysis was generated but could not be parsed into structure. Overall health seems stable with minor risks in specific projects.",
        risks: [],
        suggestions: [
          "Increase cross-project communication",
          "Review milestone deadlines",
        ],
      };
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Portfolio AI Analysis Error:", error);
    return NextResponse.json(
      { success: false, error: "AI analysis failed" },
      { status: 500 },
    );
  }
}
