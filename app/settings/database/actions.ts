"use server";

import {
  saveCustomCredentials,
  getConfigStatus,
  resetToEnvironmentConfig,
  initializeDatabaseSchema,
} from "@/lib/config/auto-setup";
import { revalidatePath } from "next/cache";

export async function saveDatabaseConfig(formData: FormData) {
  const userId = "admin-user"; // Placeholder until proper auth context is piped in here

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

export async function initializeSchema() {
  const result = await initializeDatabaseSchema();
  revalidatePath("/settings");
  return result;
}
