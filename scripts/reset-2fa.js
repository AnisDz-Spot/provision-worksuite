/**
 * 2FA Reset Utility
 *
 * Usage: node scripts/reset-2fa.js [user-email]
 *
 * This script clears the twoFactorSecret and disables 2FA for the specified user.
 * Use this to recover from an ENCRYPTION_KEY mismatch lockout.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function reset2FA() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node scripts/reset-2fa.js [user-email]");
    process.exit(1);
  }

  try {
    console.log(`🔍 Searching for user: ${email}...`);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, uid: true, twoFactorEnabled: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${email} (UID: ${user.uid})`);

    if (!user.twoFactorEnabled) {
      console.log("ℹ️  2FA is already disabled for this user.");
    }

    console.log("🛠️  Resetting 2FA settings...");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorVerifiedAt: null,
      },
    });

    console.log(
      `🚀 SUCCESS: 2FA has been disabled for ${email}. They can now login with password only.`,
    );
  } catch (error) {
    console.error("❌ Error resetting 2FA:", error);
  } finally {
    await prisma.$disconnect();
  }
}

reset2FA();
