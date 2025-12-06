import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json({
      success: true,
      data: projects,
      source: "database",
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects from database",
        data: [],
        source: "database",
      },
      { status: 500 }
    );
  }
}
