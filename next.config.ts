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
      // Allow any HTTPS image source to fix INVALID_IMAGE_OPTIMIZE_REQUEST
      // This is necessary if users can paste/upload images from various sources
      // or if using other external storages not listed.
      {
        protocol: "https",
        hostname: "**",
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
            value: "DENY",
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
            value: "camera=*, microphone=*, display-capture=*, geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Script src: Allow ZegoCloud and other necessary scripts
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.zegocloud.com https://*.zego.im https://*.coolbcloud.com https://*.coolzcloud.com https://*.coolfcloud.com",
              "style-src 'self' 'unsafe-inline'",
              // Img src: Allow blob: and data: and external https sources
              "img-src 'self' data: https: blob: https://*.zegocloud.com https://*.zego.im https://*.coolbcloud.com https://*.coolzcloud.com https://*.coolfcloud.com",
              "font-src 'self' data:",
              // Connect src: Allow ZegoCloud websockets and APIs
              "connect-src 'self' data: https://firebasestorage.googleapis.com https://*.googleapis.com https://*.zegocloud.com wss://*.zegocloud.com https://*.zego.im wss://*.zego.im https://*.coolbcloud.com wss://*.coolbcloud.com https://*.coolzcloud.com wss://*.coolzcloud.com https://*.coolfcloud.com wss://*.coolfcloud.com",
              // Frame src: Allow ZegoCloud framing
              "frame-src 'self' https://*.zegocloud.com https://*.zego.im https://*.coolbcloud.com https://*.coolzcloud.com https://*.coolfcloud.com",
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
