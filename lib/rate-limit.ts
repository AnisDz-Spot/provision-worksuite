import { NextResponse } from "next/server";

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per interval
}

interface RequestLog {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const requestStore = new Map<string, RequestLog>();

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, log] of requestStore.entries()) {
      if (now > log.resetTime) {
        requestStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Rate limiter function
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  success: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const log = requestStore.get(identifier);

  // First request or expired window
  if (!log || now > log.resetTime) {
    const resetTime = now + config.interval;
    requestStore.set(identifier, {
      count: 1,
      resetTime,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Within rate limit
  if (log.count < config.maxRequests) {
    log.count++;
    requestStore.set(identifier, log);
    return {
      success: true,
      remaining: config.maxRequests - log.count,
      resetTime: log.resetTime,
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    resetTime: log.resetTime,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier
  return "unknown";
}

/**
 * Middleware helper to apply rate limiting to API routes
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: Request, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: Request, ...args: any[]): Promise<NextResponse> => {
    const identifier = getClientIdentifier(req);
    const result = rateLimit(identifier, config);

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(req, ...args);
    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(result.resetTime).toISOString()
    );

    return response;
  };
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Authentication endpoints - strict
  AUTH: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // Registration - very strict
  REGISTER: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 3,
  },
  // Mutations - moderate
  MUTATION: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  // Time logging - lenient
  TIME_LOG: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // Queries - very lenient
  QUERY: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
} as const;
