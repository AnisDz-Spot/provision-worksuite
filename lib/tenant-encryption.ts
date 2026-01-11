import prisma from "./prisma";
import {
  generateRandomKey,
  wrapKey,
  unwrapKey,
  encryptWithKey,
  decryptWithKey,
} from "./encryption";

/**
 * Retrieves the unwrapped Data Encryption Key (DEK) for a tenant.
 * Returns null if tenant not found or key is invalid.
 */
export async function getTenantKey(tenantId: string): Promise<string | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { wrappedDek: true },
    });

    if (!tenant) return null;

    return unwrapKey(tenant.wrappedDek);
  } catch (error) {
    console.error(
      `[TenantEncryption] Failed to get key for ${tenantId}:`,
      error
    );
    return null;
  }
}

/**
 * Initializes a new tenant with a unique DEK.
 */
export async function initializeTenant(
  name: string
): Promise<{ id: string; dek: string } | null> {
  try {
    const dek = generateRandomKey();
    const wrappedDek = wrapKey(dek);

    const tenant = await prisma.tenant.create({
      data: {
        name,
        wrappedDek,
      },
    });

    return { id: tenant.id, dek };
  } catch (error) {
    console.error(
      `[TenantEncryption] Failed to initialize tenant ${name}:`,
      error
    );
    return null;
  }
}

/**
 * Encrypts data for a specific tenant using their unique DEK.
 */
export async function encryptTenantData(
  tenantId: string,
  text: string
): Promise<string> {
  const dek = await getTenantKey(tenantId);
  if (!dek) {
    console.warn(
      `[TenantEncryption] No DEK for ${tenantId}, falling back to master key`
    );
    return text;
  }
  return encryptWithKey(text, dek);
}

/**
 * Decrypts data for a specific tenant using their unique DEK.
 */
export async function decryptTenantData(
  tenantId: string,
  encryptedText: string
): Promise<string> {
  const dek = await getTenantKey(tenantId);
  if (!dek) {
    console.warn(
      `[TenantEncryption] No DEK for ${tenantId}, decryption may fail`
    );
    return encryptedText;
  }
  return decryptWithKey(encryptedText, dek);
}
