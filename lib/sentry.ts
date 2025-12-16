/**
 * Sentry Error Tracking Integration
 *
 * Provides production error monitoring with environment-based configuration.
 * Respects the enableErrorTracking feature flag from appConfig.
 */

import * as Sentry from "@sentry/nextjs";
import { appConfig } from "@/lib/config/app-config";

let sentryInitialized = false;

/**
 * Initialize Sentry SDK
 * Should be called once at application startup (client-side)
 */
export function initSentry() {
  // Prevent double initialization
  if (sentryInitialized) {
    return;
  }

  // Check if error tracking is enabled via feature flag
  if (!appConfig.features.enableErrorTracking) {
    console.info("Sentry error tracking is disabled via feature flag");
    return;
  }

  // Get Sentry DSN from environment
  const sentryDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!sentryDSN) {
    console.warn(
      "Sentry DSN not configured. Set NEXT_PUBLIC_SENTRY_DSN to enable error tracking."
    );
    return;
  }

  // Initialize Sentry with configuration
  Sentry.init({
    dsn: sentryDSN,

    // Environment (development, staging, production)
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENV ||
      process.env.NODE_ENV ||
      "development",

    // Performance monitoring sample rate
    // 1.0 = 100% of transactions, 0.1 = 10%
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session replay (optional, for debugging user sessions)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter out noisy errors
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (
        process.env.NODE_ENV === "development" &&
        !process.env.NEXT_PUBLIC_SENTRY_DEV_MODE
      ) {
        return null;
      }

      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message);

        // Skip common browser extension errors
        if (
          message.includes("Extension context invalidated") ||
          message.includes("chrome-extension://")
        ) {
          return null;
        }

        // Skip network errors (these are usually user connectivity issues)
        if (
          message.includes("NetworkError") ||
          message.includes("Failed to fetch")
        ) {
          return null;
        }
      }

      return event;
    },

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true, // Mask text for privacy
        blockAllMedia: true, // Block media for privacy
      }),
    ],
  });

  sentryInitialized = true;
  console.info("Sentry error tracking initialized");
}

/**
 * Capture an exception to Sentry
 *
 * @param error - The error to capture
 * @param context - Additional context (tags, user info, etc.)
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureError(error, {
 *     tags: { component: 'UserProfile' },
 *     extra: { userId: user.id }
 *   });
 * }
 * ```
 */
export function captureError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: { id?: string; email?: string; username?: string };
    level?: Sentry.SeverityLevel;
  }
) {
  // Only capture if Sentry is enabled and initialized
  if (!appConfig.features.enableErrorTracking || !sentryInitialized) {
    return;
  }

  // Set context if provided
  if (context) {
    Sentry.withScope((scope) => {
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      if (context.extra) {
        scope.setExtras(context.extra);
      }

      if (context.user) {
        scope.setUser(context.user);
      }

      if (context.level) {
        scope.setLevel(context.level);
      }

      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture a custom message to Sentry
 * Useful for tracking non-error events
 *
 * @example
 * ```typescript
 * captureMessage('User completed onboarding', {
 *   level: 'info',
 *   tags: { feature: 'onboarding' }
 * });
 * ```
 */
export function captureMessage(
  message: string,
  context?: {
    level?: Sentry.SeverityLevel;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  if (!appConfig.features.enableErrorTracking || !sentryInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureMessage(message);
  });
}

/**
 * Set user context for all future error events
 * Call this after user login
 *
 * @example
 * ```typescript
 * setUser({
 *   id: user.uid,
 *   email: user.email,
 *   username: user.name
 * });
 * ```
 */
export function setUser(
  user: {
    id?: string;
    email?: string;
    username?: string;
  } | null
) {
  if (!sentryInitialized) {
    return;
  }

  Sentry.setUser(user);
}

/**
 * Clear user context
 * Call this after user logout
 */
export function clearUser() {
  if (!sentryInitialized) {
    return;
  }

  Sentry.setUser(null);
}
