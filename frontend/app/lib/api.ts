/**
 * API client with fetch wrapper and error handling
 */

import { ApiError, ApiResponse, ApiClientConfig, JudgeRequest, JudgeResponse, UserProfile, RunSummary, UploadResponse } from './types';
import { API_BASE_URL, API_TIMEOUT_MS, API_RETRY_COUNT, API_ENDPOINTS } from './constants';

/**
 * API Client class for making requests to the backend
 */
class ApiClient {
  private config: ApiClientConfig;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || API_BASE_URL,
      timeout: config?.timeout || API_TIMEOUT_MS,
      retries: config?.retries || API_RETRY_COUNT,
    };
  }

  /**
   * Perform a GET request
   */
  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  /**
   * Perform a POST request
   */
  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  /**
   * Perform a PUT request
   */
  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * Perform a DELETE request
   */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /**
   * Core request method with retry logic and error handling
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    attempt = 0
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`,
          errorData
        );
      }

      const data: T = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        if (attempt < this.config.retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
          return this.request<T>(method, path, body, attempt + 1);
        }
      }

      throw new ApiError(
        0,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Utility function to delay execution for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Health check helper function
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get<ApiResponse<{ status: string }>>('/health');
    return response.success;
  } catch {
    return false;
  }
}

export async function judgeContent(content: string, userUuid?: string): Promise<JudgeResponse> {
  const body: JudgeRequest & { user_uuid?: string } = { content };
  if (userUuid) body.user_uuid = userUuid;
  return apiClient.post<JudgeResponse>(API_ENDPOINTS.judge, body);
}

export async function signup(username: string): Promise<UserProfile> {
  return apiClient.post<UserProfile>('/auth/signup', { username });
}

export async function getHistory(userUuid: string): Promise<RunSummary[]> {
  return apiClient.get<RunSummary[]>(`/judge/history?user_uuid=${encodeURIComponent(userUuid)}`);
}

export async function uploadFile(videoFile: File, subtitleFile?: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('video_file', videoFile);
  if (subtitleFile) {
    formData.append('subtitle_file', subtitleFile);
  }
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.upload}`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new ApiError(response.status, error.detail || 'Upload failed');
  }
  return response.json();
}
