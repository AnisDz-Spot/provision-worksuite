#!/usr/bin/env node

// Usage: node scripts/prisma-push.js <DATABASE_URL>
// Example: node scripts/prisma-push.js postgres://user:pass@host/db

const { execSync } = require('child_process');

const dbUrl = process.argv[2];
if (!dbUrl) {
  console.error('Usage: node scripts/prisma-push.js <DATABASE_URL>');
  process.exit(1);
}

try {
  console.log('Running prisma db push...');
  execSync(`npx prisma db push --force-reset`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
  console.log('Prisma schema pushed successfully!');
} catch (err) {
  console.error('Failed to push Prisma schema:', err.message);
  process.exit(1);
}
