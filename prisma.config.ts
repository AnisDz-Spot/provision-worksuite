import "dotenv/config";
import { defineConfig } from "prisma/config";

// Detect database URL from environment (supports multiple DB types)
const getDatabaseUrl = () => {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.SQLITE_URL ||
    process.env.SQLSERVER_URL ||
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
