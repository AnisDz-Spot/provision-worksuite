// lib/firebase.ts
// Firebase configuration with Firestore and Storage
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Required environment variables
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate all required env vars are present
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `FATAL: Missing required Firebase environment variable: NEXT_PUBLIC_FIREBASE_${key
          .replace(/([A-Z])/g, "_$1")
          .toUpperCase()}. ` +
          `Application cannot start in production without proper Firebase configuration.`
      );
    } else {
      console.warn(
        `⚠️ Missing required Firebase environment variable: NEXT_PUBLIC_FIREBASE_${key
          .replace(/([A-Z])/g, "_$1")
          .toUpperCase()}. Using dummy value for build.`
      );
      // @ts-ignore
      requiredEnvVars[key] = "dummy-value-for-build";
    }
  }
});

const firebaseConfig = requiredEnvVars;

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
