import { sql } from "@vercel/postgres";

export type DbRole = {
  id: string; // kebab-case id
  name: string;
  description?: string;
  color_hex?: string;
  order: number;
  created_at?: Date;
  updated_at?: Date;
};

export async function getAllRoles(): Promise<DbRole[]> {
  const res =
    await sql`SELECT id, name, description, color_hex, order, created_at, updated_at FROM roles ORDER BY order ASC, name ASC`;
  return res.rows as any;
}

export async function upsertRole(role: DbRole): Promise<DbRole> {
  const res = await sql`
    INSERT INTO roles (id, name, description, color_hex, order)
    VALUES (${role.id}, ${role.name}, ${role.description || null}, ${role.color_hex || null}, ${role.order})
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      color_hex = EXCLUDED.color_hex,
      order = EXCLUDED.order,
      updated_at = NOW()
    RETURNING id, name, description, color_hex, order, created_at, updated_at
  `;
  return res.rows[0] as any;
}

export async function deleteRole(id: string): Promise<void> {
  await sql`DELETE FROM roles WHERE id = ${id}`;
}
