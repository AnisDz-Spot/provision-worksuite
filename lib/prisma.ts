import { PrismaClient } from "@prisma/client";

// Lazy-loaded Prisma client to avoid build-time instantiation issues
let _prisma: PrismaClient | null = null;

const getPrismaClient = () => {
  if (!_prisma) {
    // Check for database URL at runtime
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) {
      // During build, we allow no URL (Prisma generates client without connecting)
      // At runtime in production, this would be a critical error
      if (
        process.env.NODE_ENV === "production" &&
        typeof window === "undefined"
      ) {
        console.error(
          "CRITICAL: DATABASE_URL or POSTGRES_URL must be set in production"
        );
      }
    }
    _prisma = new PrismaClient();
  }
  return _prisma;
};

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
