import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      name: "Master Admin",
      description: "Full system access with capability to manage other admins",
      colorHex: "#FF0000",
      order: 1,
    },
    {
      name: "Administrator",
      description: "System administrator with access to most features",
      colorHex: "#FFA500",
      order: 2,
    },
    {
      name: "Project Manager",
      description: "Manages projects and teams",
      colorHex: "#0000FF",
      order: 3,
    },
    {
      name: "Member",
      description: "Standard user access",
      colorHex: "#008000",
      order: 4,
    },
    {
      name: "Viewer",
      description: "Read-only access",
      colorHex: "#808080",
      order: 5,
    },
  ];

  for (const role of roles) {
    const existing = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existing) {
      await prisma.role.create({
        data: role,
      });
      console.log(`Created role: ${role.name}`);
    } else {
      console.log(`Role already exists: ${role.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
