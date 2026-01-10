import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  try {
    const markers = await prisma.burndownMarker.findMany({
      where: { projectId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ success: true, data: markers });
  } catch (error) {
    console.error("Failed to fetch burndown markers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  try {
    const body = await req.json();
    const { date, label, type } = body;

    const marker = await prisma.burndownMarker.create({
      data: {
        projectId,
        date: new Date(date),
        label,
        type: type || "scope-change",
      },
    });

    return NextResponse.json({ success: true, data: marker });
  } catch (error) {
    console.error("Failed to create burndown marker:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
