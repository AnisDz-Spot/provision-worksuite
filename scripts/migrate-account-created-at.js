#!/usr/bin/env node
/**
 * Database Migration Script
 * Adds created_at column to accounts table
 *
 * Usage: node scripts/migrate-account-created-at.js
 */

import { Client } from "pg";
import "dotenv/config";

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error(
    "❌ Error: DATABASE_URL or POSTGRES_URL not found in environment"
  );
  console.error("Please set one of these variables in your .env file");
  process.exit(1);
}

async function migrate() {
  const client = new Client({ connectionString: dbUrl });

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected!\n");

    console.log("📝 Running migration: Add created_at to accounts table");
    await client.query(`
      ALTER TABLE accounts 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);
    console.log("✅ Migration successful!\n");

    console.log("🔍 Verifying migration...");
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'accounts'
      ORDER BY ordinal_position;
    `);

    console.log("\n📊 Accounts table structure:");
    console.table(result.rows);

    console.log(
      "\n✅ All done! The /api/auth/linked-accounts endpoint should now work."
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

migrate();
