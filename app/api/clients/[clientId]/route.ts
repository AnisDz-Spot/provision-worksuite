import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { clientId } = await params;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            deadline: true,
          },
        },
      },
    });

    if (!client) {
      return new NextResponse("Client not found", { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error("Failed to fetch client:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { clientId } = await params;
    const body = await request.json();

    // Prevent ID updates
    delete body.id;
    delete body.createdAt;
    delete body.updatedAt;

    const client = await prisma.client.update({
      where: { id: clientId },
      data: body,
    });

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error("Failed to update client:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { clientId } = await params;

    // Optional: Check if client has projects before deleting?
    // For now, we'll allow deletion (projects will have clientId set to null via SetNull)

    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete client:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
