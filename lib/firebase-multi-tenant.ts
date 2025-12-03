/**
 * Multi-Tenant Firebase Configuration
 *
 * Allows each client to use their own Firebase project.
 * Configuration is loaded dynamically based on tenant/subdomain.
 */

import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp,
  FirebaseOptions,
} from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Tenant-specific Firebase instances
const tenantApps = new Map<string, FirebaseApp>();
const tenantAuth = new Map<string, Auth>();
const tenantDb = new Map<string, Firestore>();
const tenantStorage = new Map<string, FirebaseStorage>();

/**
 * Get tenant ID from subdomain or path
 * Examples:
 * - acme.yourapp.com → "acme"
 * - yourapp.com/tenant/acme → "acme"
 * - localhost:3000?tenant=acme → "acme"
 */
export function getTenantId(): string {
  if (typeof window === "undefined") {
    return "default"; // Server-side
  }

  // Method 1: From subdomain (acme.yourapp.com)
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length > 2) {
    return parts[0]; // Returns "acme" from "acme.yourapp.com"
  }

  // Method 2: From URL path (/tenant/acme)
  const pathMatch = window.location.pathname.match(/^\/tenant\/([^\/]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  // Method 3: From query parameter (?tenant=acme)
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get("tenant");
  if (tenantParam) {
    return tenantParam;
  }

  // Method 4: From localStorage (persisted tenant)
  const stored = localStorage.getItem("pv:tenantId");
  if (stored) {
    return stored;
  }

  return "default";
}

/**
 * Save tenant ID to localStorage
 */
export function setTenantId(tenantId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("pv:tenantId", tenantId);
  }
}

/**
 * Fetch Firebase config for a specific tenant
 * Options:
 * 1. From your backend API
 * 2. From a config file
 * 3. From environment variables
 */
export async function getTenantConfig(
  tenantId: string
): Promise<FirebaseOptions | null> {
  // OPTION 1: Fetch from your backend API (RECOMMENDED for production)
  try {
    const response = await fetch(`/api/tenant/${tenantId}/config`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch tenant config from API:", error);
  }

  // OPTION 2: Static configuration file (for development/testing)
  const staticConfigs: Record<string, FirebaseOptions> = {
    default: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    // Add more tenant configs as needed
    demo: {
      apiKey: process.env.NEXT_PUBLIC_DEMO_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_DEMO_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_DEMO_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_DEMO_FIREBASE_STORAGE_BUCKET,
      messagingSenderId:
        process.env.NEXT_PUBLIC_DEMO_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_DEMO_FIREBASE_APP_ID,
    },
  };

  return staticConfigs[tenantId] || null;
}

/**
 * Initialize Firebase for a specific tenant
 */
export async function initializeTenantFirebase(tenantId: string): Promise<{
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
} | null> {
  // Check if already initialized
  if (tenantApps.has(tenantId)) {
    return {
      app: tenantApps.get(tenantId)!,
      auth: tenantAuth.get(tenantId)!,
      db: tenantDb.get(tenantId)!,
      storage: tenantStorage.get(tenantId)!,
    };
  }

  // Fetch tenant config
  const config = await getTenantConfig(tenantId);
  if (!config || !config.apiKey) {
    console.error(`No Firebase config found for tenant: ${tenantId}`);
    return null;
  }

  try {
    // Initialize Firebase app
    const app = initializeApp(config, tenantId);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // Cache instances
    tenantApps.set(tenantId, app);
    tenantAuth.set(tenantId, auth);
    tenantDb.set(tenantId, db);
    tenantStorage.set(tenantId, storage);

    console.log(`✅ Firebase initialized for tenant: ${tenantId}`);

    return { app, auth, db, storage };
  } catch (error) {
    console.error(
      `Failed to initialize Firebase for tenant ${tenantId}:`,
      error
    );
    return null;
  }
}

/**
 * Get current tenant's Firebase instances
 */
export async function getCurrentTenantFirebase() {
  const tenantId = getTenantId();
  return await initializeTenantFirebase(tenantId);
}

/**
 * Get Firebase Auth for current tenant
 */
export async function getTenantAuth(): Promise<Auth | null> {
  const firebase = await getCurrentTenantFirebase();
  return firebase?.auth || null;
}

/**
 * Get Firestore for current tenant
 */
export async function getTenantDb(): Promise<Firestore | null> {
  const firebase = await getCurrentTenantFirebase();
  return firebase?.db || null;
}

/**
 * Get Storage for current tenant
 */
export async function getTenantStorage(): Promise<FirebaseStorage | null> {
  const firebase = await getCurrentTenantFirebase();
  return firebase?.storage || null;
}

/**
 * Clear tenant Firebase instances (useful for switching tenants)
 */
export function clearTenantFirebase(tenantId?: string) {
  if (tenantId) {
    tenantApps.delete(tenantId);
    tenantAuth.delete(tenantId);
    tenantDb.delete(tenantId);
    tenantStorage.delete(tenantId);
  } else {
    // Clear all
    tenantApps.clear();
    tenantAuth.clear();
    tenantDb.clear();
    tenantStorage.clear();
  }
}

/**
 * Switch to a different tenant
 */
export async function switchTenant(newTenantId: string) {
  setTenantId(newTenantId);
  return await initializeTenantFirebase(newTenantId);
}
