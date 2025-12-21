import { NextResponse } from "next/server";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";

export async function GET() {
  const response = NextResponse.json({ success: true });
  const token = generateCsrfToken();
  setCsrfCookie(response, token);
  return response;
}
