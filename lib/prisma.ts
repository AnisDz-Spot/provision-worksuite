/* eslint-disable */
/**
 * Prisma Client - Multi-Database Support
 *
 * Automatically detects database type from connection string and uses appropriate adapter.
 * Supports: PostgreSQL (Neon, standard), MySQL, SQLite, MS SQL Server
 */

import { getConfig } from "@/lib/config/auto-setup";

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
        const url = connectionString.trim();
        const lowerUrl = url.toLowerCase();

        // Define runtime environment
        const runtime = process.env.NEXT_RUNTIME;

        // Generic SSL Detection for PostgreSQL
        const hasSslParam = lowerUrl.includes("sslmode=");
        const isNeon =
          lowerUrl.includes("neon.tech") || lowerUrl.includes("-pooler.");

        const needsSsl =
          isNeon ||
          lowerUrl.includes("supabase.co") ||
          lowerUrl.includes("amazonaws.com") ||
          lowerUrl.includes("aivencloud.com") ||
          lowerUrl.includes("digitalocean.com");

        let finalConnectionString = url;
        if (!hasSslParam && needsSsl) {
          const separator = url.includes("?") ? "&" : "?";
          finalConnectionString = `${url}${separator}sslmode=require`;
        }

        if (runtime === "edge") {
          // Edge Runtime: Use Neon Serverless (WebSockets)
          try {
            const { Pool: NeonPool, neonConfig } = await import(
              /* webpackIgnore: true */ "@neondatabase/serverless"
            );
            const { PrismaNeon } = await import(
              /* webpackIgnore: true */ "@prisma/adapter-neon"
            );

            // Configure Neon to not use pipeline connect if needed, but defaults are usually improved in newer versions
            // neonConfig.pipelineConnect = false;

            const pool = new NeonPool({
              connectionString: finalConnectionString,
            });

            const adapter = new PrismaNeon(pool as any);
            return { type: "postgresql", adapter };
          } catch (e) {
            console.warn("Neon adapter load failed in edge, falling back:", e);
            return null; // Fallback to engine
          }
        } else {
          // Node.js Runtime: Use standard 'pg' with @prisma/adapter-pg
          try {
            const { Pool } = await import("pg");
            const { PrismaPg } = await import("@prisma/adapter-pg");

            const pool = new Pool({
              connectionString: finalConnectionString,
              connectionTimeoutMillis: 30000,
              max: 10, // Increased from 1 to 10 for better concurrency in Node
              ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
            });

            // Handle pool errors
            pool.on("error", (err: Error) => {
              // Silent or low-level log to avoid spam
              console.error("PG Pool Error:", err.message);
            });

            const adapter = new PrismaPg(pool as any);
            return { type: "postgresql", adapter };
          } catch (e) {
            console.error("Failed to initialize pg adapter:", e);
            return null; // Fallback to native engine
          }
        }
      }

      case "mysql": {
        // MySQL adapter (optional - install with: npm install mysql2 @prisma/adapter-mysql)
        try {
          // @ts-ignore - Optional dependency
          const mysql = await import(
            /* webpackIgnore: true */ "mysql2/promise" as any
          );
          // @ts-ignore - Optional dependency
          const { PrismaMySql } = await import(
            /* webpackIgnore: true */ "@prisma/adapter-mysql" as any
          );

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
          const Database = await import(
            /* webpackIgnore: true */ "better-sqlite3" as any
          );
          // @ts-ignore - Optional dependency
          const { PrismaSqlite } = await import(
            /* webpackIgnore: true */ "@prisma/adapter-sqlite" as any
          );

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
          const mssql = await import(/* webpackIgnore: true */ "mssql" as any);
          // @ts-ignore - Optional dependency
          const { PrismaMsSql } = await import(
            /* webpackIgnore: true */ "@prisma/adapter-mssql" as any
          );

          const pool = new mssql.ConnectionPool(connectionString);
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
        // Disabled for debugging
        console.log(
          `✅ Using ${dbAdapter.type.toUpperCase()} database with ${dbAdapter.adapter ? "optimized adapter" : "standard driver"}`
        );
        ClientState.currentDbType = dbAdapter.type;

        try {
          ClientState.client = new PrismaClient({
            adapter: dbAdapter.adapter,
            log: logOptions as any,
          });
          // Test connection immediately to catch errors early in some environments
          if (process.env.NODE_ENV === "production") {
            // 🚀 STABILITY: Retry logic for initial connection
            const connectWithRetry = async (retries = 3, delay = 2000) => {
              for (let i = 0; i < retries; i++) {
                try {
                  await ClientState.client.$connect();
                  console.log("✅ Database connected successfully");
                  return;
                } catch (e: any) {
                  if (i === retries - 1) throw e;
                  console.warn(
                    `⚠️ Connection attempt ${i + 1} failed, retrying in ${delay / 1000}s...`
                  );
                  await new Promise((resolve) => setTimeout(resolve, delay));
                }
              }
            };

            connectWithRetry().catch((e: any) => {
              console.error("🚨 Initial Prisma Connect Failed:", e.message);
            });
          }
        } catch (initErr: any) {
          console.error(
            "🚨 Prisma Client initialization failed:",
            initErr.message
          );
          throw initErr;
        }
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
