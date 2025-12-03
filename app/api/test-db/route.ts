import { NextResponse } from "next/server";
import { getAllProjects, createProject } from "@/lib/db/postgres";

export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      count: projects.length,
      projects,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Make sure your database is set up and environment variables are configured",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newProject = await createProject({
      name: body.name || "Test Project",
      description: body.description || "Created via API test",
      status: "active",
      owner: body.owner || "Test User",
      progress: 0,
      userId: "test-user-id",
    });

    return NextResponse.json({
      success: true,
      message: "Project created successfully!",
      project: newProject,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
