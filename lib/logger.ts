import pino from "pino";

/**
 * Production-ready logger using Pino
 * Fast, structured JSON logging with automatic serialization
 */

// Create logger based on environment
const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),

  // Pretty print in development
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "HH:MM:ss Z",
          },
        }
      : undefined,

  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "apiKey",
      "secret",
      "authorization",
      "*.password",
      "*.token",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    remove: true,
  },

  // Base context
  base: {
    env: process.env.NODE_ENV,
    app: "provision-worksuite",
  },

  // Serializers for request/response/error objects
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Logger methods with type safety
export const log = {
  /**
   * Debug level - verbose details for troubleshooting
   */
  debug: (obj: object | string, msg?: string) => {
    if (typeof obj === "string") {
      logger.debug(obj);
    } else {
      logger.debug(obj, msg);
    }
  },

  /**
   * Info level - general informational messages
   */
  info: (obj: object | string, msg?: string) => {
    if (typeof obj === "string") {
      logger.info(obj);
    } else {
      logger.info(obj, msg);
    }
  },

  /**
   * Warn level - warning messages
   */
  warn: (obj: object | string, msg?: string) => {
    if (typeof obj === "string") {
      logger.warn(obj);
    } else {
      logger.warn(obj, msg);
    }
  },

  /**
   * Error level - error messages
   */
  error: (obj: object | string, msg?: string) => {
    if (typeof obj === "string") {
      logger.error(obj);
    } else {
      logger.error(obj, msg);
    }
  },

  /**
   * Fatal level - critical errors that cause app termination
   */
  fatal: (obj: object | string, msg?: string) => {
    if (typeof obj === "string") {
      logger.fatal(obj);
    } else {
      logger.fatal(obj, msg);
    }
  },
};

// Export raw logger for advanced usage
export { logger };

// Child logger creation helper
export function createChildLogger(context: object) {
  return logger.child(context);
}

/**
 * Usage examples:
 *
 * ```typescript
 * import { log } from '@/lib/logger';
 *
 * // Simple message
 * log.info('User logged in');
 *
 * // With context
 * log.info({ userId: '123', ip: '1.2.3.4' }, 'User logged in');
 *
 * // Error logging
 * try {
 *   // ...
 * } catch (error) {
 *   log.error({ err: error, userId }, 'Login failed');
 * }
 *
 * // Create child logger with persistent context
 * const requestLogger = createChildLogger({ requestId: '123' });
 * requestLogger.info('Processing request');
 * ```
 */
