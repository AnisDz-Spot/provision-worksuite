import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendInvoiceEmail } from "@/lib/email";

export const POST = withRateLimit(
  RATE_LIMITS.MUTATION,
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    try {
      const user = await getAuthenticatedUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { id } = await context.params;

      // 1. Fetch Invoice with Project and Client relations
      const invoice = await prisma.invoice.findUnique({
        where: { uid: id },
        include: {
          project: {
            include: {
              client: true,
            },
          },
        },
      });

      if (!invoice) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 }
        );
      }

      // Authorization Check
      const isGlobalAdmin = ["admin", "global-admin"].includes(user.role);
      if (!isGlobalAdmin) {
        const userId = Number(user.id);
        if (isNaN(userId)) {
          return NextResponse.json(
            { error: "Invalid User ID" },
            { status: 403 }
          );
        }

        const member = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: invoice.projectId,
              userId: userId,
            },
          },
        });

        if (!member || !["owner", "admin"].includes(member.role)) {
          return NextResponse.json(
            {
              error: "Forbidden: Only Project Admins/Owners can send invoices",
            },
            { status: 403 }
          );
        }
      }

      const client = invoice.project.client;

      if (!client) {
        return NextResponse.json(
          { error: "Client not found for this project" },
          { status: 400 }
        );
      }

      const recipientEmail = client.primaryEmail;

      if (!recipientEmail) {
        return NextResponse.json(
          { error: "Client has no email address configured" },
          { status: 400 }
        );
      }

      // 2. Prepare Data
      const invoiceData = {
        ...invoice,
        items: invoice.items as any,
        clientName: client.name || "Valued Client",
        total: invoice.total,
      };

      // 3. Send Email
      const emailResult = await sendInvoiceEmail(recipientEmail, invoiceData, {
        name: user.name || "Admin",
      });

      if (!emailResult.success) {
        return NextResponse.json(
          { error: "Failed to send email", details: emailResult.error },
          { status: 500 }
        );
      }

      // 4. Update Status if it was draft
      if (invoice.status === "draft") {
        await prisma.invoice.update({
          where: { uid: id },
          data: { status: "sent" },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Invoice sent successfully",
        previewUrl: emailResult.previewUrl,
      });
    } catch (error) {
      log.error({ err: error }, "Failed to send invoice email");
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);
