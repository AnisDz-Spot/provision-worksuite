import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// NextAuth v5 configuration
// NextAuth v5 configuration
const isDev = process.env.NODE_ENV === "development";
const shouldUseDummySecret = !process.env.AUTH_SECRET;

if (shouldUseDummySecret) {
  console.warn(
    "⚠️ WARNING: AUTH_SECRET is missing. Using fallback secret for Dummy Mode."
  );
}

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || "dummy-secret-dev-only", // Fallback for demo/dummy mode
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/onboarding",
  },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
};

// NextAuth v5 exports handlers object with GET and POST
const { handlers } = NextAuth(authConfig);

export const GET = handlers.GET;
export const POST = handlers.POST;
