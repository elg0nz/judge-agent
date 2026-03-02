/**
 * Shared TypeScript types for the Judge Agent frontend
 */

/**
 * API Response wrapper for all API endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  timestamp: string;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/**
 * Health check response from backend
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

/**
 * Request error with additional context
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Judge API types — v0.0.2 full schema
 */
export interface JudgeRequest {
  content: string;
}

export interface OriginOutput {
  prediction: 'AI-generated' | 'human-generated';
  confidence: number;
  signals: string[];
}

export interface ViralityOutput {
  score: number;
  drivers: string[];
}

export interface DistributionSegment {
  segment: string;
  platforms: string[];
  reaction: 'share' | 'save' | 'comment' | 'ignore';
}

export interface JudgeResponse {
  origin: OriginOutput;
  virality: ViralityOutput;
  distribution: DistributionSegment[];
  explanation: string;
}
