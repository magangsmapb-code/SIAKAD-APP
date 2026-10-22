/**
 * SIAKAD Centralized API Client
 * Enterprise-grade REST client with automatic JWT token management,
 * HttpOnly cookie support, 401 refresh token retry interceptor,
 * timeout handling, and typed backend contract responses.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  statusCode: number;
  errors?: string[];
  rawResponse?: any;

  constructor(message: string, statusCode: number, errors?: string[], rawResponse?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.rawResponse = rawResponse;
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
}

// In-memory token store (Never stored in localStorage to protect against XSS)
let memoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

export function setMemoryAccessToken(token: string | null) {
  memoryAccessToken = token;
}

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private baseUrl: string;
  private onUnauthorizedCallback?: () => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  /**
   * Main request method with timeout, abort, and refresh-retry
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeoutMs = 15000,
      skipAuthRefresh = false,
      headers: customHeaders,
      signal: customSignal,
      body,
      ...fetchOptions
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Merge external abort signal if provided
    if (customSignal) {
      customSignal.addEventListener('abort', () => controller.abort());
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((customHeaders as Record<string, string>) || {}),
    };

    // Serialize JSON body if applicable
    let serializedBody: BodyInit | undefined = undefined;
    if (body !== undefined && body !== null) {
      if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
        headers['Content-Type'] = 'application/json';
        serializedBody = JSON.stringify(body);
      } else {
        serializedBody = body as BodyInit;
      }
    }

    // Attach in-memory access token if available
    if (memoryAccessToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${memoryAccessToken}`;
      
    }

    const url = this.buildUrl(endpoint);
    const method = fetchOptions.method || 'GET';
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        body: serializedBody,
        credentials: 'include', // Automatically send and receive HttpOnly cookies
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        // Safe logging without leaking sensitive data
        console.debug(`[API] ${method} ${endpoint} -> ${response.status} (${duration}ms)`);
      }

      // Handle 401 Unauthorized with automatic token refresh
      if (response.status === 401 && !skipAuthRefresh && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        return this.handleUnauthorizedRetry<T>(endpoint, options);
      }

      // Parse JSON response
      let resultData: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        resultData = await response.json();
      } else {
        const text = await response.text();
        resultData = text ? { message: text } : {};
      }

      if (!response.ok) {
        const message = resultData?.message || `Request failed with status ${response.status}`;
        const errors = Array.isArray(resultData?.errors) ? resultData.errors : undefined;
        throw new ApiError(message, response.status, errors, resultData);
      }

      // Normalization of standard response
      if (resultData && typeof resultData === 'object' && 'success' in resultData) {
        return resultData as ApiResponse<T>;
      }

      return {
        success: true,
        message: resultData?.message || 'Operasi berhasil',
        data: resultData?.data !== undefined ? resultData.data : resultData,
        ...(resultData?.meta ? { meta: resultData.meta } : {}),
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new ApiError('Permintaan timeout atau dibatalkan oleh pengguna', 408);
      }

      if (err instanceof ApiError) {
        throw err;
      }

      // Network / Connection Error
      const networkMessage = err.message || 'Gagal terhubung ke server SIAKAD. Periksa koneksi jaringan Anda.';
      throw new ApiError(networkMessage, 0, undefined, err);
    }
  }

  /**
   * Handle 401 by attempting a refresh token handshake
   */
  private async handleUnauthorizedRetry<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<ApiResponse<T>> {
    if (isRefreshing) {
      // If already refreshing, wait for the ongoing refresh to finish
      return new Promise<ApiResponse<T>>((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            reject(new ApiError('Sesi login telah kedaluwarsa. Silakan login kembali.', 401));
            return;
          }
          this.request<T>(endpoint, {
            ...options,
            skipAuthRefresh: true,
          })
            .then(resolve)
            .catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      // Handshake refresh token endpoint
      const refreshRes = await fetch(this.buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({}),
        credentials: 'include',
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh token invalid or expired');
      }

      const refreshData = await refreshRes.json();
      const newAccessToken = refreshData?.data?.tokens?.accessToken || null;

      if (newAccessToken) {
        setMemoryAccessToken(newAccessToken);
      }

      isRefreshing = false;
      onRefreshed(newAccessToken);

      // Retry original request
      return this.request<T>(endpoint, {
        ...options,
        skipAuthRefresh: true,
      });
    } catch (refreshErr) {
      isRefreshing = false;
      setMemoryAccessToken(null);
      onRefreshed(null);

      if (this.onUnauthorizedCallback) {
        this.onUnauthorizedCallback();
      }

      throw new ApiError('Sesi telah kedaluwarsa. Silakan masuk kembali.', 401);
    }
  }

  // Convenience helper methods
  public get<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public patch<T = any>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public delete<T = any>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
