/* eslint-disable */
/**
 * Prisma Client - Multi-Database Support
 *
 * Automatically detects database type from connection string and uses appropriate adapter.
 * Supports: PostgreSQL (Neon, standard), MySQL, SQLite, MS SQL Server
 */

import { getConfig } from "@/lib/config/auto-setup";
import ws from "ws";

// Database type detection and adapter imports
type DatabaseType = "postgresql" | "mysql" | "sqlite" | "sqlserver" | "unknown";

interface DatabaseAdapter {
  type: DatabaseType;
  adapter: any;
}

/**
 * Detect database type from connection string
 */
function detectDatabaseType(connectionString: string): DatabaseType {
  const lower = connectionString.toLowerCase();

  if (lower.startsWith("postgres://") || lower.startsWith("postgresql://")) {
    return "postgresql";
  }
  if (lower.startsWith("mysql://")) {
    return "mysql";
  }
  if (
    lower.startsWith("file:") ||
    lower.endsWith(".db") ||
    lower.endsWith(".sqlite")
  ) {
    return "sqlite";
  }
  if (lower.startsWith("sqlserver://") || lower.startsWith("mssql://")) {
    return "sqlserver";
  }

  return "unknown";
}

/**
 * Create appropriate database adapter based on connection string
 */
async function createDatabaseAdapter(
  connectionString: string
): Promise<DatabaseAdapter | null> {
  const dbType = detectDatabaseType(connectionString);

  try {
    switch (dbType) {
      case "postgresql": {
        // Use Neon serverless adapter for PostgreSQL
        // Falls back to standard pg adapter if Neon-specific features aren't needed
        const isNeon =
          connectionString.includes("neon.tech") ||
          connectionString.includes("neon.") ||
          connectionString.includes("-pooler.");

        if (isNeon) {
          const { Pool: NeonPool, neonConfig } =
            await import("@neondatabase/serverless");
          const { PrismaNeon } = await import("@prisma/adapter-neon");

          // Optimize for serverless
          neonConfig.pipelineConnect = "password";

          // Configure Neon for Node.js environments
          if (typeof window === "undefined") {
            neonConfig.webSocketConstructor = ws;
          }

          const pool = new NeonPool({
            connectionString: connectionString.trim(),
            connectionTimeoutMillis: 10000,
            max: 1, // Minimize connections in serverless
          });

          pool.on("error", (err: Error) => {
            console.error("🚨 Neon Pool Error:", err.message);
          });

          const adapter = new PrismaNeon(pool as any);
          return { type: "postgresql", adapter };
        } else {
          // Standard PostgreSQL
          const { Pool } = await import("pg");
          const { PrismaPg } = await import("@prisma/adapter-pg");

          const pool = new Pool({
            connectionString: connectionString.trim(),
            connectionTimeoutMillis: 10000,
            max: 1,
          });

          pool.on("error", (err: Error) => {
            console.error("🚨 Postgres Pool Error:", err.message);
          });

          const adapter = new PrismaPg(pool);
          return { type: "postgresql", adapter };
        }
      }

      case "mysql": {
        // MySQL adapter (optional - install with: npm install mysql2 @prisma/adapter-mysql)
        try {
          // @ts-ignore - Optional dependency
          const mysql = await import("mysql2/promise");
          // @ts-ignore - Optional dependency
          const { PrismaMySql } = await import("@prisma/adapter-mysql");

          const pool = mysql.createPool({ uri: connectionString });
          const adapter = new PrismaMySql(pool);

          return { type: "mysql", adapter };
        } catch (error) {
          console.warn(
            "MySQL adapter not available. Install: npm install mysql2 @prisma/adapter-mysql"
          );
          return null;
        }
      }

      case "sqlite": {
        // SQLite adapter (optional - install with: npm install better-sqlite3 @prisma/adapter-sqlite)
        try {
          // @ts-ignore - Optional dependency
          const Database = await import("better-sqlite3");
          // @ts-ignore - Optional dependency
          const { PrismaSqlite } = await import("@prisma/adapter-sqlite");

          const db = new Database.default(
            connectionString.replace("file:", "")
          );
          const adapter = new PrismaSqlite(db);

          return { type: "sqlite", adapter };
        } catch (error) {
          console.warn(
            "SQLite adapter not available. Install: npm install better-sqlite3 @prisma/adapter-sqlite"
          );
          return null;
        }
      }

      case "sqlserver": {
        // MS SQL Server adapter (optional - install with: npm install mssql @prisma/adapter-mssql)
        try {
          // @ts-ignore - Optional dependency
          const sql = await import("mssql");
          // @ts-ignore - Optional dependency
          const { PrismaMsSql } = await import("@prisma/adapter-mssql");

          const pool = new sql.ConnectionPool(connectionString);
          await pool.connect();
          const adapter = new PrismaMsSql(pool);

          return { type: "sqlserver", adapter };
        } catch (error) {
          console.warn(
            "MS SQL Server adapter not available. Install: npm install mssql @prisma/adapter-mssql"
          );
          return null;
        }
      }

      default:
        console.warn(
          `Unknown database type for connection string: ${connectionString.substring(0, 20)}...`
        );
        return null;
    }
  } catch (error) {
    console.error("Failed to create database adapter:", error);
    return null;
  }
}

// Dynamic import to avoid build-time issues
const ClientState = {
  PrismaConstructor: null as any,
  client: null as any,
  currentDbType: null as DatabaseType | null,
};

const loadPrismaClient = async () => {
  if (!ClientState.PrismaConstructor) {
    const module = await import("@prisma/client");
    ClientState.PrismaConstructor = module.PrismaClient;
  }
  return ClientState.PrismaConstructor;
};

// Allow resetting client for config changes
export const resetPrismaClient = () => {
  if (ClientState.client) {
    ClientState.client.$disconnect();
    ClientState.client = null;
    ClientState.currentDbType = null;
  }
};

/**
 * Get or create Prisma Client instance
 * Automatically detects database type and uses appropriate adapter
 */
const getPrismaClient = async () => {
  if (!ClientState.client) {
    const PrismaClient = await loadPrismaClient();

    // Get database URL from environment or config
    let dbUrl =
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      process.env.MYSQL_URL;

    // Try to load from custom config if env var not found
    if (!dbUrl && typeof window === "undefined") {
      try {
        const config = await getConfig();
        if (config.postgresUrl) {
          dbUrl = config.postgresUrl;
          // Set env var for future use
          process.env.POSTGRES_URL = dbUrl;
          process.env.DATABASE_URL = dbUrl;
        }
      } catch (e) {
        console.warn("Failed to load database config:", e);
      }
    }

    // Log options based on environment
    const logOptions =
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"];

    if (dbUrl) {
      // Diagnostic logging (masked)
      try {
        const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");
        console.log(
          `📡 Initializing Prisma with URL: ${maskedUrl.substring(0, 40)}...`
        );
      } catch (e) {}

      // Detect database type and create appropriate adapter
      const dbAdapter = await createDatabaseAdapter(dbUrl);

      if (dbAdapter) {
        console.log(
          `✅ Using ${dbAdapter.type.toUpperCase()} database with ${dbAdapter.adapter ? "optimized adapter" : "standard driver"}`
        );
        ClientState.currentDbType = dbAdapter.type;

        ClientState.client = new PrismaClient({
          adapter: dbAdapter.adapter,
          log: logOptions as any,
        });
      } else {
        // Fallback to no adapter (Prisma will use default drivers)
        console.warn("⚠️ Using Prisma without adapter (default native engine)");
        ClientState.client = new PrismaClient({
          log: logOptions as any,
        });
      }
    } else {
      // No database URL - this is OK for Global Admin test mode
      console.warn(
        "⚠️ No database URL found. Operating in test mode (Global Admin only)."
      );
      ClientState.client = new PrismaClient({
        log: logOptions as any,
      });
    }
  }

  return ClientState.client;
};

/**
 * Proxy-based Prisma client for lazy loading
 * Automatically initializes on first access
 */
const prisma = new Proxy({} as any, {
  get(target, prop) {
    // Handle common properties synchronously if client exists
    if (ClientState.client && prop in ClientState.client) {
      return (ClientState.client as any)[prop];
    }

    // For model accessors, return a proxy that will await the client
    if (typeof prop === "string" && !prop.startsWith("$") && prop !== "then") {
      return new Proxy(
        {},
        {
          get(_, method) {
            return async (...args: any[]) => {
              const client = await getPrismaClient();
              return client[prop][method](...args);
            };
          },
        }
      );
    }

    // For $ methods, return async wrapper
    if (typeof prop === "string" && prop.startsWith("$")) {
      return async (...args: any[]) => {
        const client = await getPrismaClient();
        return client[prop](...args);
      };
    }

    return undefined;
  },
});

export default prisma;

// Global prisma instance for development (HMR support)
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).prisma = prisma;
}

// Export database type info for debugging
export const getCurrentDatabaseType = () => ClientState.currentDbType;
