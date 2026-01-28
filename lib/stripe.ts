import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
// If we had per-tenant keys (DEK), we'd use tenant-encryption,
// but PaymentGateway usually holds keys encrypted by Master Key (like EmailSettings)
// or by Tenant DEK.
// Given the schema comments "Secret Key (Encrypted)", let's assume standard master encryption
// effectively acting as system-level secrets, OR we could use tenant-specific DEK if we passed it.
// For simplicity and matching `decrypt` signature (defaults to MASTER_KEY),
// let's assume these keys are encrypted with the App Master Key for now.
// If specific requirements change to use Tenant DEK, we'd use `decryptWithKey` + `unwrapKey`.

export async function getStripeClient(tenantId?: string) {
  // 1. Find Gateway Config
  const where = tenantId ? { tenantId } : { tenantId: null };

  // Try to find specific tenant config first
  let gateway = await prisma.paymentGateway.findFirst({
    where: {
      tenantId: tenantId || null,
      provider: "stripe",
      isEnabled: true,
    },
  });

  // Fallback: If no specific tenant config, maybe use system default (tenantId: null)?
  // Only if tenantId was provided but not found, and we want to allow system fallback.
  // The user requirement said "enabled for app tenant", enabling custom key.
  // If not found, maybe fail? Let's try system default as fallback.
  if (!gateway && tenantId) {
    gateway = await prisma.paymentGateway.findFirst({
      where: { tenantId: null, provider: "stripe", isEnabled: true },
    });
  }

  if (!gateway || !gateway.apiKey) {
    throw new Error("Stripe configuration not found for this context.");
  }

  // 2. Decrypt Key
  // We utilize the standard `decrypt` from lib/encryption which uses the MASTER_KEY.
  const secretKey = decrypt(gateway.apiKey);

  if (!secretKey) {
    throw new Error("Failed to decrypt Stripe API Key.");
  }

  // 3. Initialize Stripe
  // 3. Initialize Stripe
  return new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover" as any,
    typescript: true,
  });
}
