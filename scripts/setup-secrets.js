#!/usr/bin/env node
/**
 * Automated Secret Generation for On-Premise Installations
 *
 * This script ensures that every installation of ProVision WorkSuite is cryptographically
 * unique and secure by default. It generates missing environment secrets if they
 * are not provided.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");

const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

const setupSecrets = () => {
  console.log("🔐 ProVision WorkSuite - Security Setup");
  console.log("==========================================");

  // 1. Create .env if it doesn't exist
  if (!fs.existsSync(envPath)) {
    console.log("📝 .env file missing. Creating from .env.example...");
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
    } else {
      fs.writeFileSync(envPath, "");
    }
  }

  let envContent = fs.readFileSync(envPath, "utf8");
  let updated = false;

  // 2. Define required secrets
  const requiredSecrets = [
    { key: "JWT_SECRET", label: "App JWT Secret" },
    { key: "AUTH_SECRET", label: "NextAuth Secret" },
    { key: "ENCRYPTION_KEY", label: "Database Encryption Key", length: 32 }, // 32 bytes = 64 hex chars
    { key: "CRON_SECRET", label: "Cron Job Secret" },
    { key: "WEBHOOK_SECRET", label: "Webhook Secret" },
  ];

  requiredSecrets.forEach(({ key, label, length }) => {
    // Check if key exists and has a value
    const regex = new RegExp(`^${key}=\\s*(.*)$`, "m");
    const match = envContent.match(regex);

    if (
      !match ||
      !match[1] ||
      match[1].trim() === "" ||
      match[1].includes("your-") ||
      match[1].includes("placeholder")
    ) {
      const newSecret = generateSecret(length);
      console.log(`✨ Generating new ${label} [${key}]`);

      if (match) {
        // Replace existing placeholder
        envContent = envContent.replace(regex, `${key}=${newSecret}`);
      } else {
        // Append as new line
        envContent += `\n${key}=${newSecret}`;
      }
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(envPath, envContent.trim() + "\n");
    console.log("✅ .env updated with unique security secrets.");
  } else {
    console.log("✅ Security secrets are already configured.");
  }
};

try {
  setupSecrets();
} catch (error) {
  console.error("❌ Failed to setup security secrets:", error.message);
  // Continue anyway; we don't want to block the build if there's a file system lock
}
