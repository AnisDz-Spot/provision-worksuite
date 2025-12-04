import { sql } from "@vercel/postgres";

export type DbBlockerCategory = {
  id: string; // kebab-case id
  label: string;
  default_owner_group: string;
  sla_days: number;
  icon_emoji: string;
};

export async function getAllBlockerCategories(): Promise<DbBlockerCategory[]> {
  const res =
    await sql`SELECT id, label, default_owner_group, sla_days, icon_emoji FROM blocker_categories ORDER BY id ASC`;
  return res.rows as any;
}

export async function upsertBlockerCategories(
  categories: DbBlockerCategory[]
): Promise<void> {
  for (const c of categories) {
    await sql`
      INSERT INTO blocker_categories (id, label, default_owner_group, sla_days, icon_emoji)
      VALUES (${c.id}, ${c.label}, ${c.default_owner_group}, ${c.sla_days}, ${c.icon_emoji})
      ON CONFLICT (id) DO UPDATE SET 
        label = EXCLUDED.label,
        default_owner_group = EXCLUDED.default_owner_group,
        sla_days = EXCLUDED.sla_days,
        icon_emoji = EXCLUDED.icon_emoji
    `;
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

export async function getAllBlockers(projectId?: string): Promise<DbBlocker[]> {
  if (projectId) {
    const res =
      await sql`SELECT * FROM blockers WHERE project_id = ${projectId} ORDER BY created_at DESC`;
    return res.rows as any;
  }
  const res = await sql`SELECT * FROM blockers ORDER BY created_at DESC`;
  return res.rows as any;
}

export async function createBlocker(
  blocker: Omit<DbBlocker, "id" | "created_at" | "updated_at">
): Promise<DbBlocker> {
  const id = `b${Date.now()}`;
  const res = await sql`
    INSERT INTO blockers (id, title, description, level, status, impacted_tasks, assigned_to, reported_by, reported_date, category, project_id)
    VALUES (${id}, ${blocker.title}, ${blocker.description}, ${blocker.level}, ${blocker.status}, 
            ${JSON.stringify(blocker.impacted_tasks)}, ${blocker.assigned_to || null}, ${blocker.reported_by}, 
            ${blocker.reported_date}, ${blocker.category}, ${blocker.project_id || null})
    RETURNING *
  `;
  return res.rows[0] as any;
}

export async function updateBlocker(
  id: string,
  updates: Partial<DbBlocker>
): Promise<DbBlocker> {
  const res = await sql`
    UPDATE blockers
    SET
      title = COALESCE(${updates.title}, title),
      description = COALESCE(${updates.description}, description),
      level = COALESCE(${updates.level}, level),
      status = COALESCE(${updates.status}, status),
      impacted_tasks = COALESCE(${updates.impacted_tasks ? JSON.stringify(updates.impacted_tasks) : null}, impacted_tasks),
      assigned_to = COALESCE(${updates.assigned_to}, assigned_to),
      resolved_date = COALESCE(${updates.resolved_date}, resolved_date),
      resolution = COALESCE(${updates.resolution}, resolution),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return res.rows[0] as any;
}

export async function deleteBlocker(id: string): Promise<void> {
  await sql`DELETE FROM blockers WHERE id = ${id}`;
}
