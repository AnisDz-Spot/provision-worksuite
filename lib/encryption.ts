import crypto from "crypto";

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "provision-default-key-change-in-production";
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypts a string using AES-256-CBC
 */
export function encrypt(text: string): string {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption failed:", error);
    return text;
  }
}

/**
 * Decrypts a string using AES-256-CBC
 */
export function decrypt(text: string | null | undefined): string {
  if (!text) return "";
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const parts = text.split(":");
    if (parts.length !== 2) return text; // Return as-is if not in encrypted format
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return text; // Return original on failure
  }
}
