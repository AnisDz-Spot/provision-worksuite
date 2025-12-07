import prisma from "@/lib/prisma";

export type DbBlockerCategory = {
  id: string; // kebab-case id
  label: string;
  default_owner_group: string;
  sla_days: number;
  icon_emoji: string;
};

// Mapper
function mapCategory(c: any): DbBlockerCategory {
  return {
    id: c.id,
    label: c.label,
    default_owner_group: c.defaultOwnerGroup,
    sla_days: c.slaDays,
    icon_emoji: c.iconEmoji,
  };
}

export async function getAllBlockerCategories(): Promise<DbBlockerCategory[]> {
  const categories = await prisma.blockerCategory.findMany({
    orderBy: { id: "asc" },
  });
  return categories.map(mapCategory);
}

export async function upsertBlockerCategories(
  categories: DbBlockerCategory[]
): Promise<void> {
  // Prisma doesn't have a bulk upsert that is easy / standard for all DBs,
  // but we can iterate since categories are few.
  for (const c of categories) {
    await prisma.blockerCategory.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        label: c.label,
        defaultOwnerGroup: c.default_owner_group,
        slaDays: c.sla_days,
        iconEmoji: c.icon_emoji,
      },
      update: {
        label: c.label,
        defaultOwnerGroup: c.default_owner_group,
        slaDays: c.sla_days,
        iconEmoji: c.icon_emoji,
      },
    });
  }
}

// Blocker records
export type DbBlocker = {
  id: string;
  title: string;
  description: string;
  level: string;
  status: string;
  impacted_tasks: string[];
  assigned_to?: string;
  reported_by: string;
  reported_date: string;
  resolved_date?: string;
  resolution?: string;
  category: string;
  project_id?: string;
  created_at?: Date;
  updated_at?: Date;
};

function mapBlocker(b: any): DbBlocker {
  return {
    id: b.id,
    title: b.title,
    description: b.description || "",
    level: b.level,
    status: b.status,
    impacted_tasks: b.impactedTasks ? JSON.parse(b.impactedTasks) : [],
    assigned_to: b.assignedTo,
    reported_by: b.reportedBy,
    reported_date: b.reportedDate.toISOString().split("T")[0], // Simplified date handling
    resolved_date: b.resolvedDate
      ? b.resolvedDate.toISOString().split("T")[0]
      : undefined,
    resolution: b.resolution,
    category: b.category,
    project_id: b.projectId,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  };
}

export async function getAllBlockers(projectId?: string): Promise<DbBlocker[]> {
  if (projectId) {
    const res = await prisma.blocker.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return res.map(mapBlocker);
  }
  const res = await prisma.blocker.findMany({
    orderBy: { createdAt: "desc" },
  });
  return res.map(mapBlocker);
}

export async function createBlocker(
  blocker: Omit<DbBlocker, "id" | "created_at" | "updated_at">
): Promise<DbBlocker> {
  const id = `b${Date.now()}`;

  // Convert tasks array to string for JSON storage if that's how it's defined in Prisma schema
  // Schema says: impactedTasks String? @map("impacted_tasks") -> So it's a string there too.
  const impactedTasksStr = JSON.stringify(blocker.impacted_tasks);

  const newBlocker = await prisma.blocker.create({
    data: {
      id,
      title: blocker.title,
      description: blocker.description,
      level: blocker.level,
      status: blocker.status,
      impactedTasks: impactedTasksStr,
      assignedTo: blocker.assigned_to,
      reportedBy: blocker.reported_by,
      reportedDate: new Date(blocker.reported_date),
      category: blocker.category,
      projectId: blocker.project_id,
      // resolvedDate and resolution are null by default for new
    },
  });

  return mapBlocker(newBlocker);
}

export async function updateBlocker(
  id: string,
  updates: Partial<DbBlocker>
): Promise<DbBlocker> {
  const data: any = {};

  if (updates.title) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.level) data.level = updates.level;
  if (updates.status) data.status = updates.status;
  if (updates.impacted_tasks)
    data.impactedTasks = JSON.stringify(updates.impacted_tasks);
  if (updates.assigned_to !== undefined) data.assignedTo = updates.assigned_to;
  if (updates.resolved_date !== undefined)
    data.resolvedDate = updates.resolved_date
      ? new Date(updates.resolved_date)
      : null;
  if (updates.resolution !== undefined) data.resolution = updates.resolution;

  const updated = await prisma.blocker.update({
    where: { id },
    data,
  });
  return mapBlocker(updated);
}

export async function deleteBlocker(id: string): Promise<void> {
  await prisma.blocker.delete({
    where: { id },
  });
}
