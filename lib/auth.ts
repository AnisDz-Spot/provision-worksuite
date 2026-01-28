import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  AuthUser,
  GLOBAL_ADMIN_UID,
  GLOBAL_ADMIN_EMAIL,
  isGlobalAdmin as isGlobalAdminShared,
  isAdmin as isAdminShared,
  isProjectManager as isProjectManagerShared,
  canEditProject as canEditProjectShared,
} from "./auth-utils";

const COOKIE_NAME = "auth-token";

// Global Admin credentials for testing (no database required)
// sensitive parts kept here, merged with shared constants
const GLOBAL_ADMIN = {
  uid: GLOBAL_ADMIN_UID,
  email: GLOBAL_ADMIN_EMAIL,
  password: "password123578951",
  role: "Administrator",
  name: "Global Admin",
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY ERROR: JWT_SECRET is missing. " +
          "For On-Premise installations, please run 'node scripts/setup-secrets.js' or set the JWT_SECRET environment variable.",
      );
    }
    console.warn(
      "⚠️ WARNING: JWT_SECRET is missing. Using fallback secret for Dummy Mode (Dev only).",
    );
    return "dummy-jwt-secret-dev-only";
  }
  return secret;
};

export type { AuthUser };

export async function signToken(payload: AuthUser): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret());
  const alg = "HS256";

  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthUser;
  } catch (error: any) {
    console.error("[Auth] Token verification failed:", error?.message || error);
    return null;
  }
}

/**
 * Check if user is Global Admin (test mode, no database required)
 */
export const isGlobalAdmin = isGlobalAdminShared;

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    console.log("[Auth] No token found in cookies");
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    console.log("[Auth] Token verification failed (invalid payload)");
    return null;
  }

  // If Global Admin, skip database check (test mode)
  if (isGlobalAdmin(payload)) {
    console.log("[Auth] Global Admin detected - skipping database validation");
    return payload;
  }

  // Verify session in DB for regular users (Database mode)
  try {
    const mod = await import("@/lib/prisma");
    const prisma = mod.default;

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { token },
      select: { id: true, isValid: true, expiresAt: true },
    });

    if (session) {
      if (!session.isValid || new Date() > session.expiresAt) {
        console.log("[Auth] Session invalid or expired", {
          isValid: session.isValid,
          expiresAt: session.expiresAt,
        });
        return null; // Session revoked or expired
      }
      // Heartbeat: Update session activity (throttled)
      // We import dynamically to avoid circular dependencies if any (though session.ts is clean)
      // or we can just use the Prisma calls from here. Better to keep logic in session.ts
      const { updateSessionActivity } = await import("@/lib/auth/session");
      // Fire and forget - don't await to not slow down every request
      updateSessionActivity(session.id);

      console.log("[Auth] Session valid in DB");
    }
  } catch (error) {
    // DB likely unavailable or table doesn't exist yet
    // Fallback to stateless JWT verification for non-admin users
    console.log("[Auth] DB session check skipped/failed", error);
  }

  return payload;
}

// Role-based permission helpers
export const isAdmin = isAdminShared;
export const isProjectManager = isProjectManagerShared;
export const canEditProject = canEditProjectShared;

// Export Global Admin data for testing/setup purposes
export const getGlobalAdminData = () => ({ ...GLOBAL_ADMIN });
