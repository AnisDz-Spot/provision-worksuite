import * as crypto from "node:crypto";

const MASTER_KEY =
  process.env.ENCRYPTION_KEY || "provision-default-key-change-in-production";
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypts a string using AES-256-CBC and a provided key
 */
export function encryptWithKey(text: string, rawKey: string): string {
  try {
    const key = crypto.scryptSync(rawKey, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("[Encryption] Failed with specific key:", error);
    return text;
  }
}

/**
 * Decrypts a string using AES-256-CBC and a provided key
 */
export function decryptWithKey(
  text: string | null | undefined,
  rawKey: string
): string {
  if (!text) return "";
  try {
    const key = crypto.scryptSync(rawKey, "salt", 32);
    const parts = text.split(":");
    if (parts.length !== 2) return text;
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("[Decryption] Failed with specific key:", error);
    return text;
  }
}

/**
 * Encrypts a string using AES-256-CBC (Legacy/Master utility)
 */
export function encrypt(text: string): string {
  return encryptWithKey(text, MASTER_KEY);
}

/**
 * Decrypts a string using AES-256-CBC (Legacy/Master utility)
 */
export function decrypt(text: string | null | undefined): string {
  return decryptWithKey(text, MASTER_KEY);
}

/**
 * Wraps a Data Encryption Key (DEK) with the Master Key
 */
export function wrapKey(dek: string): string {
  return encrypt(dek);
}

/**
 * Unwraps a Data Encryption Key (DEK) using the Master Key
 */
export function unwrapKey(wrappedDek: string): string {
  return decrypt(wrappedDek);
}

/**
 * Generates a new random 32-byte key
 */
export function generateRandomKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
