import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const authUser = await getAuthenticatedUser();

  return NextResponse.json({
    message: "Debug Auth Info",
    cookies: allCookies,
    authUser: authUser,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET_CONFIGURED: !!process.env.JWT_SECRET,
    },
    timestamp: new Date().toISOString(),
  });
}
