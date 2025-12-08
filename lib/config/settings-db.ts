import { sql } from "@vercel/postgres";
import { encrypt, decrypt } from "./encryption";

// We use direct SQL/pg client here to avoid circular dependency with Prisma
// (Prisma needs config to start, so config loader can't use Prisma)
import { Pool } from "pg";

let pool: Pool | null = null;

// Helper to get a working DB connection
// Uses whatever is available in process.env currently (bootstrapping)
const getClient = () => {
  // Try Vercel Postgres first
  if (process.env.POSTGRES_URL) {
    return sql;
  }

  // Fallback to generic pg pool for self-hosted
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
