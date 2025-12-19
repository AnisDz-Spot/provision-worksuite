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

// PERFORMANCE FIX: Create singleton Redis client to avoid connection leaks
let redis: Redis | null = null;
const getRedis = (): Redis | null => {
  if (
    !redis &&
    upstashConfigured &&
    process.env.USE_IN_MEMORY_RATELIMIT !== "true"
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
};

// PERFORMANCE FIX: Pre-create rate limiters with singleton Redis client
let loginRatelimit: Ratelimit | null = null;
let signupRatelimit: Ratelimit | null = null;
let apiRatelimit: Ratelimit | null = null;
const memoryLimiter = new MemoryRateLimiter();

const getLoginRatelimit = (): Ratelimit | null => {
  const redisClient = getRedis();
  if (!loginRatelimit && redisClient) {
    loginRatelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
      analytics: true,
      prefix: "@pv/ratelimit",
    });
  }
  return loginRatelimit;
};

const getSignupRatelimit = (): Ratelimit | null => {
  const redisClient = getRedis();
  if (!signupRatelimit && redisClient) {
    signupRatelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(3, "60 m"), // 3 requests per hour
      analytics: true,
      prefix: "@pv/signup",
    });
  }
  return signupRatelimit;
};

const getApiRatelimit = (): Ratelimit | null => {
  const redisClient = getRedis();
  if (!apiRatelimit && redisClient) {
    apiRatelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
      analytics: true,
      prefix: "@pv/api",
    });
  }
  return apiRatelimit;
};

// Log once at startup (Server-side only)
if (typeof window === "undefined") {
  if (upstashConfigured && process.env.USE_IN_MEMORY_RATELIMIT !== "true") {
    console.log("✅ Using Upstash Redis for rate limiting");
  } else {
    console.warn(
      "⚠️ Using in-memory rate limiting (not suitable for production with multiple servers)"
    );
  }
}

/**
 * Rate limit login attempts
 * 5 attempts per 15 minutes per IP
 */
export async function rateLimitLogin(identifier: string) {
  const ratelimit = getLoginRatelimit();
  if (ratelimit) {
    const { success, limit, remaining, reset } = await ratelimit.limit(
      `login:${identifier}`
    );
    return { success, limit, remaining, reset };
  }
  return await memoryLimiter.limit(identifier, 5, 15 * 60 * 1000);
}

/**
 * Rate limit signup attempts
 * 3 attempts per hour per IP
 */
export async function rateLimitSignup(identifier: string) {
  const ratelimit = getSignupRatelimit();
  if (ratelimit) {
    const { success, limit, remaining, reset } = await ratelimit.limit(
      `signup:${identifier}`
    );
    return { success, limit, remaining, reset };
  }
  return await memoryLimiter.limit(identifier, 3, 60 * 60 * 1000);
}

/**
 * Rate limit API requests
 * 100 requests per minute per user
 */
export async function rateLimitAPI(identifier: string) {
  const ratelimit = getApiRatelimit();
  if (ratelimit) {
    const { success, limit, remaining, reset } = await ratelimit.limit(
      `api:${identifier}`
    );
    return { success, limit, remaining, reset };
  }
  return await memoryLimiter.limit(identifier, 100, 60 * 1000);
}
