import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "auth-token";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: JWT_SECRET env var must be set in production");
    }
    return "dev-secret-do-not-use-in-prod";
  }
  return secret;
};

export type AuthUser = {
  uid: string;
  email: string;
  role: string;
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
  } catch (error) {
    return null;
  }
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return verifyToken(token);
}
