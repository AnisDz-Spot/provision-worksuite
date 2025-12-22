import { randomUUID } from "crypto";

/**
 * Generate a cryptographically secure room ID
 * @returns A UUID v4 string
 */
export function generateSecureRoomId(): string {
  return randomUUID();
}

/**
 * Generate a URL-safe room name from a title
 * @param title - The meeting title
 * @returns A sanitized room name with a secure suffix
 */
export function generateRoomName(title: string): string {
  // Sanitize and create URL-safe room name
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50); // Limit length

  // Add secure random suffix
  const suffix = generateSecureRoomId().slice(0, 8);

  return `${sanitized}-${suffix}`;
}
