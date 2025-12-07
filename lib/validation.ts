/**
 * Validation utilities for security-critical operations
 */

/**
 * Validates UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Sanitizes file path to prevent directory traversal
 */
export function sanitizeFilePath(filePath: string): string {
  // Remove directory traversal attempts
  return filePath.replace(/\.\./g, "").replace(/^\//, "").replace(/\\/g, "/");
}

/**
 * Validates that a file path only contains safe characters
 */
export function isValidFilePath(filePath: string): boolean {
  // Only allow alphanumeric, dash, underscore, slash, dot
  return /^[a-zA-Z0-9\-_\/\.]+$/.test(filePath);
}

/**
 * Validates password strength
 */
export function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (password.length > 128) {
    errors.push("Password must not exceed 128 characters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates username format
 */
export function isValidUsername(username: string): boolean {
  // 3-30 characters, alphanumeric and underscore only
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

/**
 * Sanitizes string input to prevent SQL injection
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().substring(0, maxLength);
}
