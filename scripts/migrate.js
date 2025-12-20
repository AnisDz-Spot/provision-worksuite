#!/usr/bin/env node
/**
 * Database Migration Script
 *
 * Runs prisma db push during build for serverless platforms (Vercel, Netlify, etc.)
 * This is the build-time equivalent of the Docker entrypoint.
 *
 * Usage: node scripts/migrate.js
 *
 * Requirements:
 * - DATABASE_URL or POSTGRES_URL must be set
 * - Only runs if SKIP_DB_MIGRATE is not set
 */

import { execSync } from "child_process";

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const skipMigrate = process.env.SKIP_DB_MIGRATE === "true";

console.log("🔄 ProVision WorkSuite - Database Migration");
console.log("==========================================");

// Skip if explicitly disabled
if (skipMigrate) {
  console.log("⏭️  SKIP_DB_MIGRATE=true, skipping migration");
  process.exit(0);
}

// Skip if no database URL (demo mode)
if (!dbUrl) {
  console.log("ℹ️  No DATABASE_URL configured - running in demo mode");
  console.log("   Database migration will run on first Docker startup");
  process.exit(0);
}

console.log("📦 Database URL detected, syncing schema...");

try {
  // Run prisma db push
  execSync("npx prisma db push", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
    },
  });

  console.log("✅ Database schema synchronized!");
} catch (error) {
  // Don't fail the build if migration fails - might be network issue
  // or first-time setup where DB doesn't exist yet
  console.error("⚠️  Migration warning:", error.message);
  console.log("   The app will retry migration on startup");

  // Exit with 0 to not fail the build
  // Docker entrypoint will handle it at runtime if needed
  process.exit(0);
}
