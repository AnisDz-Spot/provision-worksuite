/**
 * Client-side CSRF helper
 * Use this to include CSRF token in fetch requests
 */

/**
 * Get CSRF token from cookie
 */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch wrapper that automatically includes CSRF token
 * Use this for all state-changing requests (POST, PUT, DELETE)
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCsrfToken();

  const headers = new Headers(options.headers);

  if (csrfToken) {
    headers.set("x-csrf-token", csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Ensure cookies are sent
  });
}

/**
 * Create headers object with CSRF token included
 * Use when you need more control over the fetch call
 */
export function createCsrfHeaders(
  additionalHeaders?: HeadersInit
): HeadersInit {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};

  if (additionalHeaders) {
    if (additionalHeaders instanceof Headers) {
      additionalHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(additionalHeaders)) {
      additionalHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, additionalHeaders);
    }
  }

  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  return headers;
}
