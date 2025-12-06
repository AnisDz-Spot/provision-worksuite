import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;

// Validate DATABASE_URL exists
// Validate DATABASE_URL exists (or use dummy for build)
const connectionString =
  process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️ DATABASE_URL is not defined. Using dummy connection for build/static generation."
  );
}

// Create adapter
const adapter = new PrismaNeon({ connectionString });

// Global singleton pattern to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
