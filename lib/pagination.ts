// lib/pagination.ts - API Pagination Utilities
import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Extract pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const searchParams = request.nextUrl.searchParams;

  let page = parseInt(searchParams.get("page") || "1", 10);
  let limit = parseInt(
    searchParams.get("limit") || String(DEFAULT_PAGE_SIZE),
    10
  );

  // Validate and sanitize
  if (page < 1) page = 1;
  if (limit < 1) limit = DEFAULT_PAGE_SIZE;
  if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get Prisma pagination params
 */
export function getPrismaPaginationParams(params: PaginationParams) {
  return {
    skip: params.offset,
    take: params.limit,
  };
}
