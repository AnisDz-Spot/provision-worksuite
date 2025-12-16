/**
 * Batch Console Logging Replacement Script
 *
 * This script systematically replaces console.log/error/warn statements
 * with the logger utility across the codebase.
 *
 * Usage: node scripts/replace-console.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";
import path from "path";

const replacements = [
  // console.log patterns
  {
    pattern: /console\.log\((.*?)\);?$/gm,
    replacement: (match, content) => {
      // Try to parse if it's a simple string
      if (content.startsWith('"') || content.startsWith("'")) {
        return `log.info(${content});`;
      }
      // If it's multi-argument, convert to structured logging
      return `log.info(${content});`;
    },
  },
  // console.error patterns
  {
    pattern: /console\.error\((.*?)\);?$/gm,
    replacement: (match, content) => {
      return `log.error(${content});`;
    },
  },
  // console.warn patterns
  {
    pattern: /console\.warn\((.*?)\);?$/gm,
    replacement: (match, content) => {
      return `log.warn(${content});`;
    },
  },
];

async function replaceConsoleInFile(filePath) {
  try {
    let content = readFileSync(filePath, "utf8");
    const originalContent = content;

    // Check if file already has logger import
    const hasLoggerImport =
      content.includes('from "@/lib/logger"') ||
      content.includes("from '@/lib/logger'");

    // Check if file has any console statements
    const hasConsole = /console\.(log|error|warn|info)/.test(content);

    if (!hasConsole) {
      return {
        file: filePath,
        changed: false,
        reason: "no console statements",
      };
    }

    // Add logger import if needed
    if (!hasLoggerImport) {
      // Find the last import statement
      const importRegex = /^import .* from .*;$/gm;
      const imports = content.match(importRegex);
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        content = content.replace(
          lastImport,
          `${lastImport}\nimport { log } from "@/lib/logger";`
        );
      }
    }

    // Apply replacements
    replacements.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });

    if (content !== originalContent) {
      writeFileSync(filePath, content, "utf8");
      return { file: filePath, changed: true };
    }

    return { file: filePath, changed: false, reason: "no changes needed" };
  } catch (error) {
    return { file: filePath, changed: false, error: error.message };
  }
}

async function main() {
  console.log("🔍 Finding TypeScript files...");

  const files = await glob("**/*.{ts,tsx}", {
    ignore: [
      "**/node_modules/**",
      "**/.next/**",
      "**/app/generated/**",
      "**/dist/**",
      "**/build/**",
    ],
    cwd: process.cwd(),
  });

  console.log(`📝 Processing ${files.length} files...`);

  const results = await Promise.all(
    files.map((file) => replaceConsoleInFile(file))
  );

  const changed = results.filter((r) => r.changed);
  const errors = results.filter((r) => r.error);

  console.log("\n✅ Complete!");
  console.log(`   Changed: ${changed.length} files`);
  console.log(
    `   Skipped: ${results.length - changed.length - errors.length} files`
  );
  console.log(`   Errors: ${errors.length} files`);

  if (changed.length > 0) {
    console.log("\n📁 Changed files:");
    changed.forEach((r) => console.log(`   - ${r.file}`));
  }

  if (errors.length > 0) {
    console.log("\n❌ Error files:");
    errors.forEach((r) => console.log(`   - ${r.file}: ${r.error}`));
  }
}

main().catch(console.error);
