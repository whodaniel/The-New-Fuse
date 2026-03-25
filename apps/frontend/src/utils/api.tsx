export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new ApiError(response.status, error.message);
  }

  // Return null for 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export function createQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

export async function apiRequest<T = any>(url: string, options: ApiRequestOptions = {}): Promise<{ data: T }> {
  const { method = 'GET', data, headers = {}, params } = options;
  
  // Build URL with query parameters
  let finalUrl = url;
  if (params && Object.keys(params).length > 0) {
    const queryString = createQueryString(params);
    finalUrl += `?${queryString}`;
  }
  
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  if (data && method !== 'GET') {
    requestInit.body = JSON.stringify(data);
  }
  
  const response = await fetch(finalUrl, requestInit);
  const responseData = await handleApiResponse<T>(response);
  
  return { data: responseData };
}

// Backward-compatible axios-like helper used by older services.
export const api = {
  get: <T = any>(url: string, options: Omit<ApiRequestOptions, 'method' | 'data'> = {}) =>
    apiRequest<T>(url, { ...options, method: 'GET' }),
  post: <T = any>(url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'data'> = {}) =>
    apiRequest<T>(url, { ...options, method: 'POST', data }),
  put: <T = any>(url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'data'> = {}) =>
    apiRequest<T>(url, { ...options, method: 'PUT', data }),
  patch: <T = any>(url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'data'> = {}) =>
    apiRequest<T>(url, { ...options, method: 'PATCH', data }),
  delete: <T = any>(url: string, options: Omit<ApiRequestOptions, 'method' | 'data'> = {}) =>
    apiRequest<T>(url, { ...options, method: 'DELETE' }),
};
