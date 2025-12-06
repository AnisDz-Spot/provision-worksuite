import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET =
  process.env.JWT_SECRET || "development_secret_do_not_use_in_production";
const COOKIE_NAME = "auth-token";

export type AuthUser = {
  uid: string;
  email: string;
  role: string;
};

export async function signToken(payload: AuthUser): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const alg = "HS256";

  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
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
