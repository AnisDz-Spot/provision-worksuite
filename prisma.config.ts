import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Detect database URL from environment (supports multiple DB types)
const getDatabaseUrl = () => {
  return (
    env("POSTGRES_URL") ||
    env("DATABASE_URL") ||
    env("MYSQL_URL") ||
    env("SQLITE_URL") ||
    env("SQLSERVER_URL") ||
    ""
  );
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});
