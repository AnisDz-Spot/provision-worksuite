import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
  },
  compress: true,
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(self), display-capture=(self), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Script src: Restricted scripts
              "script-src 'self' 'unsafe-inline' https://*.zegocloud.com https://*.zego.im",
              "style-src 'self' 'unsafe-inline'",
              // Img src: STRICTLY 'self' and trusted uploads only
              "img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://api.dicebear.com https://*.zegocloud.com https://*.zego.im",
              "font-src 'self' data:",
              // Connect src: Allow ZegoCloud websockets and APIs
              "connect-src 'self' data: https://*.zegocloud.com wss://*.zegocloud.com https://*.zego.im wss://*.zego.im https://firebasestorage.googleapis.com https://*.googleapis.com",
              // Frame src: Allow internal framing and ZegoCloud
              "frame-src 'self' data: blob: https://*.zegocloud.com https://*.zego.im",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // API routes CORS headers
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // SECURITY: Use specific origins, not wildcard
            // In production, set ALLOWED_ORIGINS to your domain
            value: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-CSRF-Token",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "mssql",
    "@prisma/adapter-mssql",
    "better-sqlite3",
    "@prisma/adapter-sqlite",
    "mysql2",
    "@prisma/adapter-mysql",
    "pg",
    "@prisma/adapter-pg",
  ],
};

export default nextConfig;
