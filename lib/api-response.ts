import { NextResponse } from "next/server";

/**
 * Standardized API Response Types and Utilities
 *
 * Use these utilities to ensure consistent API responses across all routes.
 */

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    source?: "database" | "cache" | "mock";
  };
};

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: ApiResponse["meta"]
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  });
}

/**
 * Create a paginated successful API response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  source: "database" | "cache" | "mock" = "database"
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      source,
    },
  });
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: number = 500
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => errorResponse("Unauthorized", 401),
  forbidden: (message = "Forbidden") => errorResponse(message, 403),
  notFound: (resource = "Resource") =>
    errorResponse(`${resource} not found`, 404),
  badRequest: (message: string) => errorResponse(message, 400),
  conflict: (message: string) => errorResponse(message, 409),
  tooManyRequests: (message = "Too many requests. Please try again later.") =>
    errorResponse(message, 429),
  internal: (message = "Internal server error") => errorResponse(message, 500),
  serviceUnavailable: (message = "Service temporarily unavailable") =>
    errorResponse(message, 503),
};

/**
 * Wrap an async handler with standardized error handling
 */
export async function withErrorHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T | unknown>>> {
  try {
    return await handler();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("API Error:", error);
    return ApiErrors.internal(
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : errorMessage
    ) as NextResponse<ApiResponse<T | unknown>>;
  }
}
