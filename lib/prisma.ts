import { PrismaClient } from "@prisma/client";

// Lazy-loaded Prisma client to avoid build-time instantiation issues
let _prisma: PrismaClient | null = null;

const getPrismaClient = () => {
  if (!_prisma) {
    // Ensure DATABASE_URL is set (fallback for build environment)
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      process.env.DATABASE_URL = "postgresql://localhost:5432/placeholder";
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
