import { PrismaClient } from "@prisma/client";
import { getConfig } from "@/lib/config/auto-setup";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

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

    // Log options
    const logOptions =
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"];

    if (dbUrl) {
      // Use adapter for Prisma 7 compatibility issues with specific engine types
      // or simply because it's the recommended way for modern deployments
      const pool = new Pool({ connectionString: dbUrl });
      const adapter = new PrismaPg(pool);

      _prisma = new PrismaClient({
        adapter,
        log: logOptions as any,
      });
    } else {
      // Fallback if no URL is present - usually implies setup not done
      // PrismaClient might throw if used without connection, which is expected
      _prisma = new PrismaClient({
        log: logOptions as any,
      });
    }
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
