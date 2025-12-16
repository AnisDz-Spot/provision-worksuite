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
 * Get encryption key from environment
 * Throws error if ENCRYPTION_KEY is not set
 */
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable not set. Generate one with: openssl rand -hex 32"
    );
  }

  if (key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32"
    );
  }

  return key;
}
