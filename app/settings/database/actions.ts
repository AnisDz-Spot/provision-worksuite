"use server";

import {
  saveCustomCredentials,
  getConfigStatus,
  resetToEnvironmentConfig,
} from "@/lib/config/auto-setup";
import { revalidatePath } from "next/cache";
// import { auth } from '@/lib/firebase-admin'; // User mentioned firebase-admin, check if it exists or use verifySession

export async function saveDatabaseConfig(formData: FormData) {
  // TODO: Authenticate user properly
  //   const session = await verifySession(); // example
  //   if (!session) return { success: false, message: 'Unauthorized' };

  const userId = "admin-user"; // Placeholder until proper auth context is piped in here (or we trust the middleware)

  const postgresUrl = formData.get("postgresUrl") as string;
  const blobToken = formData.get("blobToken") as string;

  if (!postgresUrl || !blobToken) {
    return { success: false, message: "All fields are required" };
  }

  const result = await saveCustomCredentials(postgresUrl, blobToken, userId);
  revalidatePath("/settings");
  return result;
}

export async function getDatabaseStatus() {
  return await getConfigStatus();
}

export async function resetConfiguration() {
  await resetToEnvironmentConfig();
  revalidatePath("/settings");
  return {
    success: true,
    message: "Configuration reset to environment variables",
  };
}
