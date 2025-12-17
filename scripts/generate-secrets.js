import crypto from "crypto";

const secret1 = crypto.randomBytes(32).toString("hex");
const secret2 = crypto.randomBytes(32).toString("hex");

console.log("\nGenerated Secrets for .env:\n");
console.log(`AUTH_SECRET="${secret1}"`);
console.log(`JWT_SECRET="${secret2}"`);
console.log("\nCopy these checking into your .env or .env.local file.\n");
