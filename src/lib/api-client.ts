import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { queryClient, queryKeys } from '@/lib/query-client';

// Use the Next.js proxy route for same-domain cookie handling
// Instead of calling backend directly, we proxy through /api/proxy
// This allows Set-Cookie headers from backend to be set on the Vercel domain
const API_URL = '/api/proxy/v1';

// Custom error class for approval-required responses
export class ApprovalRequiredError extends Error {
  approval: unknown;
  constructor(message: string, approval?: unknown) {
    super(message);
    this.name = 'ApprovalRequiredError';
    this.approval = approval;
  }
}

/**
 * Type guard to check if an error is an ApprovalRequiredError
 */
export function isApprovalRequired(error: unknown): error is ApprovalRequiredError {
  return error instanceof ApprovalRequiredError;
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add X-Company-Id header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Read currentCompanyId from localStorage
    if (typeof window !== 'undefined') {
      const currentCompanyId = localStorage.getItem('currentCompanyId');

      // If present, add X-Company-Id header
      if (currentCompanyId) {
        config.headers['X-Company-Id'] = currentCompanyId;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and approval detection
apiClient.interceptors.response.use(
  (response) => {
    // Detect approval-required responses (HTTP 202 or approval_required flag)
    const data = response.data;
    if (response.status === 202 || data?.approval_required === true) {
      // Show info toast
      toast.info(data?.message || 'Approval request submitted. Waiting for review.');

      // Invalidate approval queries to update pending count
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.lists() });

      // Throw custom error so mutation hooks know this was an approval, not a success
      throw new ApprovalRequiredError(
        data?.message || 'Approval required',
        data?.data
      );
    }

    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  approval_required?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Generic API functions
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  },

  getPaginated: async <T>(url: string, params?: PaginationParams): Promise<PaginatedResponse<T>> => {
    const response = await apiClient.get<PaginatedResponse<T>>(url, { params });
    return response.data;
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  },

  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  },

  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  },
};

export default api;
