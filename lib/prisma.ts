import { PrismaClient } from "@prisma/client";
import { getConfig } from "@/lib/config/auto-setup";

// Lazy-loaded Prisma client to avoid build-time instantiation issues
let _prisma: PrismaClient | null = null;

// Allow resetting client for config changes
export const resetPrismaClient = () => {
  if (_prisma) {
    _prisma.$disconnect();
    _prisma = null;
  }
};

const getPrismaClient = () => {
  if (!_prisma) {
    // Check for database URL at runtime
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    // In production, we might want to log if we are falling back
    if (
      !dbUrl &&
      process.env.NODE_ENV === "production" &&
      typeof window === "undefined"
    ) {
      console.error("CRITICAL: DATABASE_URL not found in env or settings.");
    }

    _prisma = new PrismaClient();
  }
  return _prisma;
};

// Top-level await to load config before app starts
// This sets process.env.DATABASE_URL if found in DB
try {
  // Only run in Node.js environment
  if (typeof window === "undefined") {
    // We use a self-executing async function if top-level await causes issues,
    // BUT we need it to block.
    // Next.js App Router usually supports top-level await in server modules.
    const config = await getConfig();
    if (config.postgresUrl) {
      process.env.DATABASE_URL = config.postgresUrl;
      process.env.POSTGRES_URL = config.postgresUrl;
    }
  }
} catch (e) {
  console.warn("Failed to load system config during prisma init:", e);
}

// Create a Proxy that lazily instantiates PrismaClient on first access
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  },
});

export default prisma;

if (process.env.NODE_ENV !== "production") {
  (globalThis as any).prisma = prisma;
}
