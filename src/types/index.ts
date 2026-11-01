/**
 * MatrimonyOS Shared Type Definitions
 */

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SupportedCountry =
  | "Bangladesh"
  | "United Kingdom"
  | "United States"
  | "Canada"
  | "Europe"
  | "Middle East";
