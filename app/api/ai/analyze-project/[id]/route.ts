import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateAIContent } from "@/lib/ai";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/analyze-project/[id]
 * Generates an AI-powered health and risk analysis for a specific project.
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid Project ID" },
        { status: 400 }
      );
    }

    // 1. Fetch comprehensive project data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          take: 30, // Limit context size
          orderBy: { updatedAt: "desc" },
          select: {
            title: true,
            status: true,
            priority: true,
            due: true,
            estimateHours: true,
            loggedHours: true,
          },
        },
        milestones: {
          select: {
            name: true,
            status: true,
            dueDate: true,
            amount: true,
            paymentStatus: true,
          },
        },
        _count: {
          select: {
            members: true,
            comments: true,
            files: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Prepare context for AI
    const analysisContext = {
      project: {
        name: project.name,
        description: project.description,
        status: project.status,
        deadline: project.deadline,
        budget: project.budget,
        tags: project.tags,
        priority: project.priority,
      },
      stats: {
        memberCount: project._count.members,
        commentCount: project._count.comments,
        fileCount: project._count.files,
        totalTasks: project.tasks.length,
        totalMilestones: project.milestones.length,
      },
      tasks: project.tasks,
      milestones: project.milestones,
    };

    // 3. Construct Prompts
    const systemPrompt = `You are ProVision AI, an expert Project Risk Analyst. 
Analyze the provided project data to assess health, identify risks, and recommend improvements.
CRITICAL: You MUST respond ONLY with a valid JSON object. Do not include markdown formatting like \`\`\`json.
The JSON must follow this structure:
{
  "healthScore": number (0-100),
  "riskLevel": "low" | "medium" | "high" | "critical",
  "summary": "Brief 2-3 sentence overview",
  "topRisks": ["Risk 1", "Risk 2"],
  "recommendations": ["Action 1", "Action 2"],
  "sentiment": "positive" | "neutral" | "concerning"
}`;

    const prompt = `Please analyze this project data and provide a health report:
${JSON.stringify(analysisContext, null, 2)}`;

    // 4. Call AI Provider
    const aiResponse = await generateAIContent(prompt, systemPrompt);

    // 5. Parse and Return Analysis
    try {
      // Clean potential markdown if the AI ignored instructions
      let cleanedContent = aiResponse.content.trim();
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/^```json\n?/, "")
          .replace(/\n?```$/, "");
      }

      const analysis = JSON.parse(cleanedContent);
      return NextResponse.json({ success: true, analysis });
    } catch (parseError) {
      console.error("AI Response Parsing Failed:", aiResponse.content);
      // Fallback for non-JSON or malformed responses
      return NextResponse.json({
        success: true,
        analysis: {
          healthScore: 50,
          riskLevel: "medium",
          summary: aiResponse.content.substring(0, 300),
          topRisks: ["Unable to parse structured risks"],
          recommendations: ["Review project data manually"],
          sentiment: "neutral",
        },
      });
    }
  } catch (error: any) {
    console.error("Project Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze project" },
      { status: 500 }
    );
  }
}
