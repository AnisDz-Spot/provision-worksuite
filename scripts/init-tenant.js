const { PrismaClient } = require("@prisma/client");
const { generateRandomKey, wrapKey } = require("./lib/encryption");

const prisma = new PrismaClient();

async function main() {
  const tenantName = process.argv[2] || "Default Tenant";

  console.log(`Initializing tenant: ${tenantName}...`);

  try {
    const desktopPath = require("path").join(
      require("os").homedir(),
      "Desktop"
    );
    const dek = require("crypto").randomBytes(32).toString("hex");
    const wrappedDek = wrapKey(dek);

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        wrappedDek: wrappedDek,
      },
    });

    console.log("✅ Tenant initialized successfully!");
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`Wrapped DEK: ${tenant.wrappedDek}`);
    console.log(
      `Note: The raw DEK is never stored in the database. It is wrapped by your MASTER_KEY.`
    );
  } catch (error) {
    if (error.code === "P2002") {
      console.error("❌ Error: A tenant with this name already exists.");
    } else {
      console.error("❌ Failed to initialize tenant:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
