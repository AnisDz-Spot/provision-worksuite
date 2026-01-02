/**
 * License Validation System
 * Offline checksum-based validation for ThemeForest
 */

// License format: XXXXX-XXXXX-XXXXX-XXXXX
const LICENSE_REGEX = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

const KNOWN_LICENSES = [
  "K7M9P-2N4R6-8T1W3-5YH02",
  "Q3B5D-7F9J1-2L4N6-8PR04",
  "X1Z3C-5V7B9-1M3K5-7QS06",
  "A4E6G-8I2K4-6M8O0-2TU08",
  "W9Y1D-3F5H7-9J1L3-5VX0A",
  "P2R4T-6V8X0-2Z4B6-8DM0C",
  "L5N7Q-9S1U3-5W7Y9-1FH0E",
  "H8J0M-2P4R6-8T0V2-4XZ0G",
  "C1E3G-5I7K9-1M3O5-7QS0I",
  "Y4A6C-8E0F2-4H6J8-0LN0K",
  "D5E7V-1T3S6-8K2Y4-0AB0M",
  "T9E2S-4T6I7-0N1G3-5CD0O",
];

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

  // Check known licenses first
  if (KNOWN_LICENSES.includes(cleanKey)) {
    return { valid: true };
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
 * Check if a valid license exists in localStorage
 */
export function hasValidLicense(): boolean {
  const storedLicense = getStoredLicense();
  if (!storedLicense) return false;

  const validation = validateLicense(storedLicense);
  return validation.valid;
}

/**
 * Check if license exists in server-side licenses.json file
 * This is an async function that calls the API
 */
export async function checkLicenseFile(licenseKey?: string): Promise<boolean> {
  try {
    const keyToCheck = licenseKey || getStoredLicense();
    if (!keyToCheck) return false;

    const response = await fetch("/api/check-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serial: keyToCheck }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Error checking license file:", error);
    return false;
  }
}

/**
 * Comprehensive license check - checks both localStorage and file
 * Returns true if license is valid in either location
 */
export async function hasValidLicenseComprehensive(): Promise<boolean> {
  // First check localStorage (fast)
  const localValid = hasValidLicense();
  if (localValid) return true;

  // Then check file (slower, but authoritative)
  const fileValid = await checkLicenseFile();
  return fileValid;
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
