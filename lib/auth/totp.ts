/**
 * Two-Factor Authentication (2FA) Utilities
 *
 * TOTP-based (Time-based One-Time Password) authentication using industry-standard
 * authenticator apps like Google Authenticator, Authy, Microsoft Authenticator, etc.
 */

import { authenticator } from "@otplib/preset-default";
import QRCode from "qrcode";
import crypto from "crypto";

// Configure TOTP settings
authenticator.options = {
  step: 30, // 30-second time step
  window: 1, // Allow 1 step tolerance (30s before/after)
};

/**
 * Generate a new TOTP secret for a user
 * @returns Base32-encoded secret string
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code as Data URL for user to scan with authenticator app
 *
 * @param email - User's email address
 * @param secret - TOTP secret (base32 encoded)
 * @param issuer - Application name (defaults to "ProVision WorkSuite")
 * @returns Promise<string> - QR code as data URL (image/png)
 *
 * @example
 * ```typescript
 * const secret = generateSecret();
 * const qrCode = await generateQRCode(user.email, secret);
 * // Display qrCode as <img src={qrCode} />
 * ```
 */
export async function generateQRCode(
  email: string,
  secret: string,
  issuer: string = "ProVision WorkSuite"
): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, issuer, secret);

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 2,
    });

    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`);
  }
}

/**
 * Verify a TOTP token against a secret
 *
 * @param secret - User's TOTP secret (base32 encoded)
 * @param token - 6-digit code from authenticator app
 * @returns boolean - true if token is valid
 *
 * @example
 * ```typescript
 * const isValid = verifyToken(user.twoFactorSecret, "123456");
 * if (isValid) {
 *   // Grant access
 * }
 * ```
 */
export function verifyToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({
      token: token.replace(/\s/g, ""), // Remove any spaces
      secret,
    });
  } catch (error) {
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 *
 * @param count - Number of backup codes to generate (default: 10)
 * @returns string[] - Array of backup codes in format "XXXX-XXXX"
 *
 * @example
 * ```typescript
 * const codes = generateBackupCodes(10);
 * // codes = ["ABCD-1234", "EFGH-5678", ...]
 * // Hash these before storing in database
 * ```
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8 random alphanumeric characters
    const code = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()
      .match(/.{1,4}/g)!
      .join("-");

    codes.push(code);
  }

  return codes;
}

/**
 * Hash a backup code for secure storage
 * Uses SHA-256 for one-way hashing
 *
 * @param code - Plain text backup code
 * @returns string - Hashed code (hex string)
 */
export function hashBackupCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code.replace("-", "")) // Remove hyphen before hashing
    .digest("hex");
}

/**
 * Verify a backup code against a hashed version
 *
 * @param code - Plain text code to verify
 * @param hashedCode - Stored hashed code
 * @returns boolean - true if codes match
 */
export function verifyBackupCode(code: string, hashedCode: string): boolean {
  const hash = hashBackupCode(code);
  return hash === hashedCode;
}

/**
 * Encrypt TOTP secret for database storage
 * Uses AES-256-GCM encryption with the app's encryption key
 *
 * @param secret - Plain text TOTP secret
 * @param encryptionKey - 32-byte encryption key (from env ENCRYPTION_KEY)
 * @returns string - Encrypted secret in format "iv:encryptedData:authTag"
 */
export function encryptSecret(secret: string, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return format: iv:encryptedData:authTag
  return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}

/**
 * Decrypt TOTP secret from database
 *
 * @param encryptedSecret - Encrypted secret from database
 * @param encryptionKey - 32-byte encryption key (from env ENCRYPTION_KEY)
 * @returns string - Plain text TOTP secret
 */
export function decryptSecret(
  encryptedSecret: string,
  encryptionKey: string
): string {
  const [ivHex, encryptedHex, authTagHex] = encryptedSecret.split(":");

  const key = Buffer.from(encryptionKey, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt TOTP secret using tenant-specific DEK (Data Encryption Key)
 * Falls back to global key for non-tenant users (e.g., Global Admin)
 *
 * @param secret - Plain text TOTP secret
 * @param tenantId - Tenant ID (null for non-tenant users)
 * @returns Promise<string> - Encrypted secret
 */
export async function encryptSecretForTenant(
  secret: string,
  tenantId: string | null
): Promise<string> {
  // Fall back to global key for non-tenant users
  if (!tenantId) {
    const key = getEncryptionKey();
    return encryptSecret(secret, key);
  }

  // Use tenant's unique DEK via AES-256-CBC (from lib/encryption.ts)
  // This format is compatible with the existing tenant encryption system
  try {
    const { encryptWithKey, unwrapKey } = await import("@/lib/encryption");
    const prisma = (await import("@/lib/prisma")).default;

    // Get tenant's wrapped DEK
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { wrappedDek: true },
    });

    if (!tenant) {
      console.warn(
        `[TOTP] Tenant ${tenantId} not found, falling back to global key`
      );
      const key = getEncryptionKey();
      return encryptSecret(secret, key);
    }

    // Unwrap the DEK and encrypt the secret
    const dek = unwrapKey(tenant.wrappedDek);
    return encryptWithKey(secret, dek);
  } catch (error) {
    console.error(
      `[TOTP] Failed to encrypt with tenant key for ${tenantId}:`,
      error
    );
    // Fall back to global key on error
    const key = getEncryptionKey();
    return encryptSecret(secret, key);
  }
}

/**
 * Decrypt TOTP secret using tenant-specific DEK
 * Falls back to global key for non-tenant users
 *
 * @param encryptedSecret - Encrypted secret from database
 * @param tenantId - Tenant ID (null for non-tenant users)
 * @returns Promise<string> - Plain text TOTP secret
 */
export async function decryptSecretForTenant(
  encryptedSecret: string,
  tenantId: string | null
): Promise<string> {
  // Fall back to global key for non-tenant users
  if (!tenantId) {
    const key = getEncryptionKey();
    return decryptSecret(encryptedSecret, key);
  }

  // Use tenant's unique DEK
  try {
    const { decryptWithKey, unwrapKey } = await import("@/lib/encryption");
    const prisma = (await import("@/lib/prisma")).default;

    // Get tenant's wrapped DEK
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { wrappedDek: true },
    });

    if (!tenant) {
      console.warn(
        `[TOTP] Tenant ${tenantId} not found, attempting to decrypt with global key`
      );
      const key = getEncryptionKey();
      return decryptSecret(encryptedSecret, key);
    }

    // Unwrap the DEK and decrypt the secret
    const dek = unwrapKey(tenant.wrappedDek);
    return decryptWithKey(encryptedSecret, dek);
  } catch (error) {
    console.error(
      `[TOTP] Failed to decrypt with tenant key for ${tenantId}:`,
      error
    );
    // Try falling back to global key (for migration/backward compatibility)
    try {
      const key = getEncryptionKey();
      return decryptSecret(encryptedSecret, key);
    } catch (fallbackError) {
      console.error("[TOTP] Global key decryption also failed:", fallbackError);
      throw new Error("Unable to decrypt TOTP secret");
    }
  }
}

/**
 * Get encryption key from environment
 * Provides a zero-config fallback key for ease of deployment
 *
 * SECURITY NOTE: For production deployments, it's recommended to set a unique
 * ENCRYPTION_KEY environment variable for enhanced security. Generate one with:
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;

  // Zero-config fallback: Provide a default key if not set
  // This allows tenants to use the app immediately without configuration
  if (!key) {
    const defaultKey =
      "provision-worksuite-2fa-encryption-key-change-for-production-use";

    // Warn in production environments to encourage setting a unique key
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️  WARNING: Using default ENCRYPTION_KEY. For enhanced security, set a unique ENCRYPTION_KEY environment variable."
      );
    } else {
      console.warn("ENCRYPTION_KEY is missing. Using default fallback key.");
    }

    // Ensure the default key is exactly 64 hex characters (32 bytes)
    // If the default string is not exactly 64 chars, hash it to get a valid key
    if (defaultKey.length === 64 && /^[0-9a-f]+$/i.test(defaultKey)) {
      return defaultKey;
    }

    // Hash the default key to ensure it's always 64 hex characters
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(defaultKey).digest("hex");
  }

  // Validate user-provided key format
  if (key.length !== 64) {
    console.error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes), but got ${key.length} characters. Generate a valid key with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
    // Use the fallback instead of throwing to maintain zero-config
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  return key;
}
