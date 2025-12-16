/**
 * Centralized Application Configuration
 *
 * This file contains all application-wide configuration settings.
 * Environment variables are loaded with sensible defaults.
 */

export const appConfig = {
  /**
   * Support and Contact Information
   */
  support: {
    email: process.env.SUPPORT_EMAIL || "anisdzed@gmail.com",
    name: process.env.SUPPORT_NAME || "ProVision Support Team",
  },

  /**
   * Application Metadata
   */
  app: {
    name: "ProVision WorkSuite",
    version: "1.0.0",
    description: "Enterprise Project Management Platform",
  },

  /**
   * Feature Flags
   */
  features: {
    enableErrorTracking: process.env.ENABLE_SENTRY === "true",
    enableAnalytics: process.env.ENABLE_ANALYTICS === "true",
  },

  /**
   * Security Settings
   */
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || "",
    allowedOrigins: process.env.ALLOWED_ORIGINS || "https://localhost:3000",
  },

  /**
   * Email Configuration
   */
  email: {
    provider: process.env.EMAIL_PROVIDER || "smtp",
    from: process.env.EMAIL_FROM_ADDRESS || "noreply@provision.com",
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || "",
    },
  },
} as const;

/**
 * Validation helper to check if required config is set
 */
export function validateConfig() {
  const errors: string[] = [];

  if (
    !appConfig.security.encryptionKey &&
    process.env.NODE_ENV === "production"
  ) {
    errors.push("ENCRYPTION_KEY is required in production");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
  }

  return true;
}
