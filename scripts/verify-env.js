import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env.local first, then .env
const envLocalPath = path.join(process.cwd(), ".env.local");
const envPath = path.join(process.cwd(), ".env");

if (fs.existsSync(envLocalPath)) {
  console.log("Loading .env.local...");
  dotenv.config({ path: envLocalPath });
} else {
  console.log(".env.local not found");
}

if (fs.existsSync(envPath)) {
  console.log("Loading .env...");
  dotenv.config({ path: envPath });
}

console.log("\n--- Environment Variable Check ---");
console.log(
  "JWT_SECRET:",
  process.env.JWT_SECRET ? "✅ Present" : "❌ MISSING"
);
console.log(
  "AUTH_SECRET:",
  process.env.AUTH_SECRET
    ? "✅ Present"
    : "❌ MISSING (Required for NextAuth v5)"
);
console.log(
  "NEXT_PUBLIC_APP_URL:",
  process.env.NEXT_PUBLIC_APP_URL ? "✅ Present" : "❌ MISSING"
);

if (!process.env.AUTH_SECRET) {
  console.log("\n⚠️ ACTION REQUIRED:");
  console.log("NextAuth v5 (which this project uses) requires AUTH_SECRET.");
  console.log(
    "It is different from JWT_SECRET (though you can use the same value)."
  );
  console.log('Please add "AUTH_SECRET=..." to your .env.local file.');
} else {
  console.log("\n✅ Secrets appear to be configured.");
}
console.log("----------------------------------\n");
