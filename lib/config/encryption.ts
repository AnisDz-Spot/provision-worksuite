import crypto from "crypto";

// Use a consistent key for encryption - in production this should be a fixed env var
// For dev/fallback we generate one (which means restarts invalidates session config if not persisted)
// But for "System Settings" in DB, we MUST have a persistent key if we want to survive restarts.
// We will look for ENCRYPTION_KEY or fall back to a hardcoded specific key for this project
// (Warning: Hardcoded key in repo is not ideal for high security but necessary for "zero-config" self-hosting requirement)
const ALGORITHM = "aes-256-gcm";
// Default key for "zero config" setup - users should ideally override this in production envs
const DEFAULT_KEY = "provision-worksuite-secure-key-32-byte-exact!!";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || DEFAULT_KEY;

// Ensure key is 32 bytes
const getKeyBuffer = () => {
  const key = Buffer.from(ENCRYPTION_KEY);
  if (key.length === 32) return key;
  // Pad or truncate to 32 bytes
  const newKey = Buffer.alloc(32);
  key.copy(newKey);
  return newKey;
};

export function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKeyBuffer(), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText; // Pending/legacy plain text

    const [ivHex, authTagHex, encrypted] = parts;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKeyBuffer(), iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return ""; // Return empty or original text on failure
  }
}
