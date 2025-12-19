import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "auth-token";

// Global Admin credentials for testing (no database required)
const GLOBAL_ADMIN = {
  uid: "admin-global",
  email: "admin@provision.com",
  password: "password123578951",
  role: "Administrator",
  name: "Global Admin",
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // SECURITY: Always throw error if JWT_SECRET is missing
    // Never use fallback secrets, even in development
    throw new Error(
      "CRITICAL: JWT_SECRET environment variable is required. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return secret;
};

export type AuthUser = {
  uid: string;
  email: string;
  role: string;
  name?: string;
};

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
export function isGlobalAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.uid === GLOBAL_ADMIN.uid || user.email === GLOBAL_ADMIN.email;
}

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
      select: { isValid: true, expiresAt: true },
    });

    if (session) {
      if (!session.isValid || new Date() > session.expiresAt) {
        console.log("[Auth] Session invalid or expired", {
          isValid: session.isValid,
          expiresAt: session.expiresAt,
        });
        return null; // Session revoked or expired
      }
      console.log("[Auth] Session valid in DB");
    }
  } catch (error) {
    // DB likely unavailable or table doesn't exist yet
    // Fallback to stateless JWT verification for non-admin users
    console.log("[Auth] DB session check skipped/failed", error);
  }

  return payload;
}

// Export Global Admin data for testing/setup purposes
export const getGlobalAdminData = () => ({ ...GLOBAL_ADMIN });
