/**
 * License Validation System
 * Offline checksum-based validation for ThemeForest
 */

// License format: XXXXX-XXXXX-XXXXX-XXXXX
const LICENSE_REGEX = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

/**
 * Validate license key format and checksum
 */
export function validateLicense(licenseKey: string): {
  valid: boolean;
  error?: string;
} {
  // Clean input
  const cleanKey = licenseKey.trim().toUpperCase();

  // Check format
  if (!LICENSE_REGEX.test(cleanKey)) {
    return {
      valid: false,
      error: "Invalid license format. Expected: XXXXX-XXXXX-XXXXX-XXXXX",
    };
  }

  // Remove dashes for checksum validation
  const parts = cleanKey.split("-");
  const data = parts.slice(0, 3).join(""); // First 3 segments
  const checksum = parts[3]; // Last segment is checksum

  // Calculate expected checksum
  const expectedChecksum = calculateChecksum(data);

  if (checksum !== expectedChecksum) {
    return {
      valid: false,
      error: "Invalid license key. Please check and try again.",
    };
  }

  return { valid: true };
}

/**
 * Calculate checksum for license data
 * Simple algorithm: sum of character codes mod 36^5
 */
function calculateChecksum(data: string): string {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data.charCodeAt(i) * (i + 1);
  }

  // Convert to base-36 and pad to 5 characters
  const checksum = (sum % 36 ** 5).toString(36).toUpperCase().padStart(5, "0");
  return checksum;
}

/**
 * Generate a license key (for development/testing)
 * In production, this would be done by your license server
 */
export function generateLicense(): string {
  // Generate 3 random segments
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let segment = "";
    for (let j = 0; j < 5; j++) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }

  const data = segments.join("");
  const checksum = calculateChecksum(data);

  return `${segments[0]}-${segments[1]}-${segments[2]}-${checksum}`;
}

/**
 * Store validated license in localStorage
 */
export function storeLicense(licenseKey: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:license", licenseKey.trim().toUpperCase());
    localStorage.setItem("pv:licenseValidatedAt", new Date().toISOString());
  } catch (e) {
    console.error("Failed to store license:", e);
  }
}

/**
 * Get stored license from localStorage
 */
export function getStoredLicense(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("pv:license");
  } catch {
    return null;
  }
}

/**
 * Check if a valid license exists
 */
export function hasValidLicense(): boolean {
  const storedLicense = getStoredLicense();
  if (!storedLicense) return false;

  const validation = validateLicense(storedLicense);
  return validation.valid;
}

/**
 * Clear stored license
 */
export function clearLicense(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("pv:license");
    localStorage.removeItem("pv:licenseValidatedAt");
  } catch (e) {
    console.error("Failed to clear license:", e);
  }
}

// Development license keys (for testing)
export const DEV_LICENSES = {
  // These are valid test licenses for development
  demo: generateLicense(),
  test: generateLicense(),
};

// Log dev licenses in development mode
if (process.env.NODE_ENV === "development") {
  console.log("🔑 Development License Keys:");
  Object.entries(DEV_LICENSES).forEach(([name, key]) => {
    console.log(`  ${name}: ${key}`);
  });
}
