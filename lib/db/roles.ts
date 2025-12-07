import prisma from "@/lib/prisma";

export type DbRole = {
  id: string; // kebab-case id
  name: string;
  description?: string;
  color_hex?: string; // Mapped to colorHex in schema?
  order: number;
  created_at?: Date;
  updated_at?: Date;
};

// Prisma result mapper to match legacy snake_case interface if needed
function mapRole(role: any): DbRole {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    color_hex: role.colorHex,
    order: role.order || 0,
    created_at: role.createdAt,
    updated_at: role.updatedAt,
  };
}

export async function getAllRoles(): Promise<DbRole[]> {
  const roles = await prisma.role.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return roles.map(mapRole);
}

export async function upsertRole(role: DbRole): Promise<DbRole> {
  const data = {
    name: role.name,
    description: role.description,
    colorHex: role.color_hex,
    order: role.order,
  };

  const upserted = await prisma.role.upsert({
    where: { id: role.id },
    create: { id: role.id, ...data },
    update: data,
  });

  return mapRole(upserted);
}

export async function deleteRole(id: string): Promise<void> {
  await prisma.role.delete({
    where: { id },
  });
}
