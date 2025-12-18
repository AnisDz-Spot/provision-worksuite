import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function generateSecret() {
  return crypto.randomBytes(32).toString("hex");
}

console.log("\n🔐 --- Provision Worksuite Secret Generator --- 🔐\n");

const authSecret = generateSecret();
const jwtSecret = generateSecret();

console.log(
  "Your secrets have been generated! Please add these to your Vercel Environment Variables or .env file:\n"
);

console.log(`AUTH_SECRET="${authSecret}"`);
console.log(`JWT_SECRET="${jwtSecret}"`);

console.log(
  "\n⚠️  IMPORTANT: After adding these to Vercel, you NEED to redeploy or restart the functions for them to take effect.\n"
);

// ES module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  console.log(`Checking ${envPath}...`);
  let content = fs.readFileSync(envPath, "utf8");
  let updated = false;

  if (!content.includes("AUTH_SECRET")) {
    content += `\nAUTH_SECRET="${authSecret}"`;
    updated = true;
  }

  if (!content.includes("JWT_SECRET")) {
    content += `\nJWT_SECRET="${jwtSecret}"`;
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(envPath, content);
    console.log("✅ Updated your local .env file with new secrets.");
  } else {
    console.log(
      "ℹ️  Local .env already has secrets. Make sure to copy them to Vercel if you haven't already."
    );
  }
}
