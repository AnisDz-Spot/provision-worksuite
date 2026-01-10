import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "REGISTER"
  | "FAILED_LOGIN"
  | "PASSWORD_RESET"
  | "2FA_SETUP"
  | "2FA_VERIFY"
  | "UPDATE_PROFILE"
  | "UPDATE_SETTINGS"
  | "CREATE_PROJECT"
  | "DELETE_PROJECT"
  | "ARCHIVE_PROJECT"
  | "CREATE_USER"
  | "DELETE_USER"
  | "UPDATE_ROLE"
  | "API_KEY_GENERATED";

interface AuditLogParams {
  userId: number;
  action: AuditAction | string;
  resource?: string;
  details?: Record<string, any>;
}

/**
 * Log a security-relevant action to the database.
 * Automatically captures IP and User-Agent from headers if available.
 */
export async function logAudit({
  userId,
  action,
  resource,
  details = {},
}: AuditLogParams) {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        ipAddress: ip,
        userAgent,
        details,
      },
    });

    // Also log to standard logger for redundancy
    log.info(
      { userId, action, resource, ip },
      `Audit: User ${userId} performed ${action}`
    );
  } catch (error) {
    // Audit logging should essentially be non-blocking, but we must log the failure
    log.error({ err: error, userId, action }, "Failed to create audit log");
  }
}
