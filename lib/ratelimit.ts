import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting configuration for API endpoints
 *
 * SETUP REQUIRED:
 * 1. Create an Upstash Redis database at https://console.upstash.com/
 * 2. Add environment variables:
 *    UPSTASH_REDIS_REST_URL=your_redis_url
 *    UPSTASH_REDIS_REST_TOKEN=your_redis_token
 *
 * ALTERNATIVE (In-Memory - for development/low traffic):
 * If you don't want to set up Upstash, you can use in-memory rate limiting
 * by setting USE_IN_MEMORY_RATELIMIT=true
 */

// Check if Upstash is configured
const upstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// In-memory rate limiting fallback
class MemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  async limit(identifier: string, maxRequests: number, windowMs: number) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Filter out old requests
    const recentRequests = requests.filter((time) => time > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: Math.min(...recentRequests) + windowMs,
      };
    }

    // Add new request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    // Cleanup old data periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - recentRequests.length,
      reset: now + windowMs,
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const recent = requests.filter((time) => time > now - 3600000); // Keep last hour
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
  }
}

// Initialize rate limiter
let ratelimit: any;

if (upstashConfigured && process.env.USE_IN_MEMORY_RATELIMIT !== "true") {
  console.log("✅ Using Upstash Redis for rate limiting");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
    analytics: true,
    prefix: "@pv/ratelimit",
  });
} else {
  console.warn(
    "⚠️ Using in-memory rate limiting (not suitable for production with multiple servers)"
  );
  const memoryLimiter = new MemoryRateLimiter();

  ratelimit = {
    limit: async (identifier: string) => {
      return await memoryLimiter.limit(identifier, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
    },
  };
}

/**
 * Rate limit login attempts
 * 5 attempts per 15 minutes per IP
 */
export async function rateLimitLogin(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(
    `login:${identifier}`
  );

  return { success, limit, remaining, reset };
}

/**
 * Rate limit signup attempts
 * 3 attempts per hour per IP
 */
export async function rateLimitSignup(identifier: string) {
  // For signup, we want even stricter limits
  if (upstashConfigured && process.env.USE_IN_MEMORY_RATELIMIT !== "true") {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const signupRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60 m"), // 3 requests per hour
      analytics: true,
      prefix: "@pv/signup",
    });

    const { success, limit, remaining, reset } = await signupRatelimit.limit(
      `signup:${identifier}`
    );
    return { success, limit, remaining, reset };
  } else {
    const memoryLimiter = new MemoryRateLimiter();
    return await memoryLimiter.limit(identifier, 3, 60 * 60 * 1000); // 3 per hour
  }
}

/**
 * Rate limit API requests
 * 100 requests per minute per user
 */
export async function rateLimitAPI(identifier: string) {
  if (upstashConfigured && process.env.USE_IN_MEMORY_RATELIMIT !== "true") {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const apiRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "@pv/api",
    });

    const { success, limit, remaining, reset } = await apiRatelimit.limit(
      `api:${identifier}`
    );
    return { success, limit, remaining, reset };
  } else {
    const memoryLimiter = new MemoryRateLimiter();
    return await memoryLimiter.limit(identifier, 100, 60 * 1000);
  }
}
