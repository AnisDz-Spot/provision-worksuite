import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/breakdown-milestone
 * Generates a list of suggested tasks for a given milestone.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Milestone title is required to generate tasks" },
        { status: 400 }
      );
    }

    // 1. Construct the System Prompt for structured task generation
    const systemPrompt = `You are ProVision AI, a Technical Project Architect. 
Your task is to break down a high-level milestone into specific, granular, and actionable tasks.
Each task should be clear enough for a junior developer to understand.

CRITICAL: You MUST respond ONLY with a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.
Each object in the array must follow this structure:
{
  "title": "Clear task title",
  "description": "Detailed explanation of what needs to be done",
  "priority": "low" | "medium" | "high" | "urgent",
  "estimateHours": number (realistic hours),
  "type": "feature" | "bug" | "task" | "documentation" | "design"
}`;

    // 2. Construct the User Prompt
    const prompt = `Break down the following milestone into a list of tasks (3-7 items):
Milestone: ${title}
Description: ${description || "No further details provided."}

Focus on logical ordering and technical completeness.`;

    // 3. Call AI Provider
    const aiResponse = await generateAIContent(prompt, systemPrompt);

    // 4. Parse and Return Tasks
    try {
      let cleanedContent = aiResponse.content.trim();
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/^```json\n?/, "")
          .replace(/\n?```$/, "");
      }

      const tasks = JSON.parse(cleanedContent);

      if (!Array.isArray(tasks)) {
        throw new Error("AI response is not an array");
      }

      return NextResponse.json({ success: true, tasks });
    } catch (parseError) {
      console.error("AI Task Generation Parsing Failed:", aiResponse.content);
      return NextResponse.json(
        {
          error: "The AI generated a malformed response. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Milestone Breakdown Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate tasks" },
      { status: 500 }
    );
  }
}
