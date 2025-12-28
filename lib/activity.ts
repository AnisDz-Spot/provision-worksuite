import prisma from "./prisma";

export type EntityType =
  | "project"
  | "task"
  | "comment"
  | "file"
  | "client"
  | "milestone"
  | "expense"
  | "invoice";

/**
 * Record a system activity for auditing and timeline display
 */
export async function recordActivity(
  userId: number,
  entityType: EntityType,
  entityId: string,
  action:
    | "created"
    | "updated"
    | "deleted"
    | "assigned"
    | "commented"
    | "status_changed"
    | "archived",
  metadata: any = {}
) {
  try {
    // Ensure entityId is string as per schema
    const activity = await prisma.activity.create({
      data: {
        userId,
        entityType,
        entityId: String(entityId),
        action,
        metadata: metadata || {},
      },
    });
    return activity;
  } catch (error) {
    console.error("Failed to record activity:", error);
    return null;
  }
}
