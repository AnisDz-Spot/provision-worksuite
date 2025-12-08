import { sql } from "@vercel/postgres";
import { encrypt, decrypt } from "./encryption";
import { Pool } from "pg";

let pool: Pool | null = null;

// Helper to get a working DB connection
// Uses whatever is available in process.env currently (bootstrapping)
const getClient = () => {
  // Try Vercel Postgres first
  if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes("vercel")) {
    return sql;
  }
  // Also try sql if configured without 'vercel' string but we want to assume it works?
  // Actually, Vercel SDK requires specific env vars.
  // Ideally we default to sql if on Vercel, but for generic PostgreSQL fallback we use pg.
  // The user might restart the app.
  if (process.env.POSTGRES_URL) {
    // If we are in Vercel environment, sql should work.
    // But we can check if sql is available (it's imported).
    return sql;
  }

  // Fallback to generic pg pool for self-hosted or if POSTGRES_URL is missing but DATABASE_URL is set
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) return null;

    pool = new Pool({
      connectionString,
    });
  }
  return pool;
};

export async function saveSetting(
  key: string,
  value: string,
  isEncrypted: boolean = true
) {
  const finalValue = isEncrypted ? encrypt(value) : value;
  const client = getClient();

  if (!client) throw new Error("No bootstrap database connection available");

  if (client === sql) {
    // Vercel SDK
    await sql`
            INSERT INTO system_settings (setting_key, setting_value, is_encrypted, updated_at)
            VALUES (${key}, ${finalValue}, ${isEncrypted}, NOW())
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = ${finalValue}, is_encrypted = ${isEncrypted}, updated_at = NOW()
        `;
  } else {
    // PG Driver
    const query = `
            INSERT INTO system_settings (setting_key, setting_value, is_encrypted, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = $2, is_encrypted = $3, updated_at = NOW()
        `;
    await (client as Pool).query(query, [key, finalValue, isEncrypted]);
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    let rows: any[] = [];

    if (client === sql) {
      const result = await sql`
                SELECT setting_value, is_encrypted 
                FROM system_settings 
                WHERE setting_key = ${key}
            `;
      rows = result.rows;
    } else {
      const result = await (client as Pool).query(
        "SELECT setting_value, is_encrypted FROM system_settings WHERE setting_key = $1",
        [key]
      );
      rows = result.rows;
    }

    if (rows.length === 0) return null;

    const { setting_value, is_encrypted } = rows[0];
    return is_encrypted ? decrypt(setting_value) : setting_value;
  } catch (error) {
    // If table doesn't exist yet (first run), return null silently
    return null;
  }
}

export async function deleteSetting(key: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  if (client === sql) {
    await sql`DELETE FROM system_settings WHERE setting_key = ${key}`;
  } else {
    await (client as Pool).query(
      "DELETE FROM system_settings WHERE setting_key = $1",
      [key]
    );
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const client = getClient();
  if (!client) return {};

  try {
    let rows: any[] = [];
    if (client === sql) {
      const result =
        await sql`SELECT setting_key, setting_value, is_encrypted FROM system_settings`;
      rows = result.rows;
    } else {
      const result = await (client as Pool).query(
        "SELECT setting_key, setting_value, is_encrypted FROM system_settings"
      );
      rows = result.rows;
    }

    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.setting_key] = row.is_encrypted
        ? decrypt(row.setting_value)
        : row.setting_value;
    }
    return settings;
  } catch {
    return {};
  }
}

export async function checkTablesExist(): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    if (client === sql) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        ) as exists;
      `;
      // Vercel SDK returns rows with keys lowercased mostly, check structure
      return (result.rows[0] as any).exists;
    } else {
      // PG check
      const result = await (client as Pool).query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        ) as exists;
      `);
      return result.rows[0].exists;
    }
  } catch (error) {
    return false;
  }
}

export async function executeSql(sqlString: string): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("No database connection");

  if (client === sql) {
    // Vercel SDK doesn't support raw string execution easily without template literal
    // But we can just use the template literal with the string injected if we trust the source (which is our own schema file)
    // However, sql`${str}` escapes it. We need raw execution.
    // The Vercel SDK documentation says sql(strings, ...values).
    // To execute raw SQL string with Vercel SDK is tricky.
    // We might need to use the `query` method if exposed, but `sql` is a tagged template function.
    // Actually, Vercel SQL doesn't support executing arbitrary strings for security.
    // BUT, we can use the `pg` client inside if we are on Node.
    // Or we can try to use unsafe if available? No.

    // Workaround: Use the underlying PG pool if possible or strictly rely on the fact that if we use Vercel SDK, we might be stuck.
    // However, `schema.sql` is trusted.
    // We can loop over statements if they are simple?
    // Actually for Vercel, we can try `client.query` if `sql` object exposes it? calling `sql` as function?
    // No.

    // If we really need to support Vercel SDK for schema init, we might be in trouble if we can't run raw SQL.
    // Solution: Use `pg` driver even for Vercel if we detect we need raw SQL?
    // Or maybe just throw error if using Vercel SDK and ask user to use manual setup?
    // BUT user expects "Automatic".
    // Let's trying bypassing:
    // const { db } = require('@vercel/postgres');
    // db.connect().query(...) ?

    // Ideally we just assume `pool` fallback is okay? No, Vercel credentials might only work with SDK if special handling?
    // Actually Vercel SDK uses `neondatabase/serverless` under the hood.
    // Let's just create a temporary PG Pool for this operation using the connection string.
    const connectionString = process.env.POSTGRES_URL;
    if (connectionString) {
      const tempPool = new Pool({ connectionString });
      await tempPool.query(sqlString);
      await tempPool.end();
      return;
    }
    throw new Error("Cannot execute raw SQL without connection string");
  } else {
    await (client as Pool).query(sqlString);
  }
}
