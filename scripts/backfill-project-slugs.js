const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function backfillSlugs() {
  console.log("Starting slug backfill...");
  const projects = await prisma.project.findMany({
    where: { slug: null },
  });

  console.log(`Found ${projects.length} projects without slugs.`);

  for (const project of projects) {
    let slug = project.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Uniqueness check
    let uniqueSlug = slug;
    let count = 1;
    while (true) {
      const existing = await prisma.project.findUnique({
        where: { slug: uniqueSlug },
      });
      if (!existing) break;
      uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { slug: uniqueSlug },
    });
    console.log(`Updated project ${project.id}: ${uniqueSlug}`);
  }

  console.log("Backfill complete.");
}

backfillSlugs()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
