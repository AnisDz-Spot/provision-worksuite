import { NextResponse } from "next/server";
import { getAllTasks } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tasks = await getAllTasks();
    return NextResponse.json({
      success: true,
      data: tasks,
      source: "database",
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tasks from database",
        data: [],
        source: "database",
      },
      { status: 500 }
    );
  }
}
