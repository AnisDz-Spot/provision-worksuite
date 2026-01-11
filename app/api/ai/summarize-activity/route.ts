import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateAIContent } from "@/lib/ai";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/summarize-activity
 * Analyzes recent audit logs to generate a "Weekly AI Pulse" executive summary.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden - Administrator access required" },
        { status: 403 }
      );
    }

    // 1. Fetch system activity from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 150, // Analyze a substantial slice of history
    });

    if (logs.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          title: "Weekly Activity Pulse",
          highlights: ["Quiet week, no significant changes detected."],
          stats: { projectsCreated: 0, tasksCompleted: 0 },
          narrative:
            "The system has recorded minimal activity over the last seven days. All indicators suggest a steady state with no major deviations from baseline operation.",
          riskRating: "low",
        },
      });
    }

    // 2. Aggregate logs for AI context
    const context = logs.map((l: any) => ({
      action: l.action,
      entity: l.entity,
      details: l.details,
      timestamp: l.createdAt,
    }));

    // 3. Construct Prompts
    const systemPrompt = `You are ProVision Executive AI. 
Review the provided system audit logs and generate a professional 'Weekly Pulse' report.
Focus on identifying trends, major project shifts, and potential operational bottlenecks.

CRITICAL: You MUST respond ONLY with a valid JSON object. Do not include markdown formatting.
The JSON must follow this structure:
{
  "title": "Weekly System Pulse",
  "highlights": ["Achievement/Event 1", "Achievement/Event 2"],
  "stats": {
    "projectsAnalyzed": number,
    "actionsPerformed": number,
    "topEntity": "Entity Type with most activity"
  },
  "narrative": "A 2-paragraph professional executive summary.",
  "riskRating": "low" | "medium" | "high"
}`;

    const prompt = `System Log Context (Last 7 Days):
${JSON.stringify(context, null, 2)}

Please synthesize this into an executive summary.`;

    // 4. Call AI Provider
    const aiResponse = await generateAIContent(prompt, systemPrompt);

    // 5. Parse and Return Summary
    try {
      let cleanedContent = aiResponse.content.trim();
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/^```json\n?/, "")
          .replace(/\n?```$/, "");
      }

      const summary = JSON.parse(cleanedContent);
      return NextResponse.json({ success: true, summary });
    } catch (parseError) {
      console.error("AI Summary Parsing Failed:", aiResponse.content);
      return NextResponse.json({
        success: true,
        summary: {
          title: "Weekly Summary (Alpha)",
          highlights: ["Analysis completed but structure was inconsistent."],
          stats: {
            projectsAnalyzed: 0,
            actionsPerformed: logs.length,
            topEntity: "N/A",
          },
          narrative: aiResponse.content.substring(0, 500),
          riskRating: "low",
        },
      });
    }
  } catch (error: any) {
    console.error("Activity Summary Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}
