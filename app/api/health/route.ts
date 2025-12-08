import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

type HealthCheck = {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: HealthStatus;
      latencyMs?: number;
      error?: string;
    };
    memory: {
      status: HealthStatus;
      usedMb: number;
      totalMb: number;
      percentUsed: number;
    };
  };
};

const startTime = Date.now();

/**
 * Health check endpoint for monitoring and load balancers
 * GET /api/health
 *
 * Returns:
 * - 200: Healthy
 * - 503: Unhealthy or degraded
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  // Check database connectivity
  let dbStatus: HealthCheck["checks"]["database"];
  const dbStart = Date.now();

  try {
    // Simple query to test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = {
      status: "healthy",
      latencyMs: Date.now() - dbStart,
    };
  } catch (error: any) {
    dbStatus = {
      status: "unhealthy",
      latencyMs: Date.now() - dbStart,
      error:
        process.env.NODE_ENV === "production"
          ? "Database connection failed"
          : error.message,
    };
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const usedMb = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const totalMb = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const percentUsed = Math.round(
    (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
  );

  const memoryStatus: HealthCheck["checks"]["memory"] = {
    status: percentUsed > 90 ? "degraded" : "healthy",
    usedMb,
    totalMb,
    percentUsed,
  };

  // Determine overall status
  let overallStatus: HealthStatus = "healthy";
  if (dbStatus.status === "unhealthy") {
    overallStatus = "unhealthy";
  } else if (
    dbStatus.status === "degraded" ||
    memoryStatus.status === "degraded"
  ) {
    overallStatus = "degraded";
  }

  const health: HealthCheck = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || "0.1.0",
    uptime,
    checks: {
      database: dbStatus,
      memory: memoryStatus,
    },
  };

  // Return appropriate status code
  const statusCode = overallStatus === "healthy" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
