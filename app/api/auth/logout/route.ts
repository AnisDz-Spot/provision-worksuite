import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Clear the auth-token cookie
  cookieStore.delete({
    name: "auth-token",
    path: "/",
  });

  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function GET() {
  const cookieStore = await cookies();

  // Clear the auth-token cookie
  cookieStore.delete({
    name: "auth-token",
    path: "/",
  });

  // Redirect to login page
  const url = new URL(
    "/auth/login",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );
  return NextResponse.redirect(url);
}
