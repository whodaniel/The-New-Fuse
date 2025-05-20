interface User {
  uid: string;
  email?: string;
  username?: string;
  role?: string;
  profileImage?: string;
  settings?: {
    [key: string]: any;
  };
}

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
  requiresAuth?: boolean;
}

export function userFromStorage(): User | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export async function request(endpoint: string, config: RequestConfig = {}): Promise<any> {
  const {
    params = {},
    requiresAuth = true,
    headers: customHeaders = {},
    ...restConfig
  } = config;

  const queryString = new URLSearchParams(params).toString();
  const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (requiresAuth) {
    const user = userFromStorage();
    if (user?.uid) {
      headers['Authorization'] = `Bearer ${user.uid}`;
    }
  }

  try {
    const response = await fetch(url, {
      headers,
      ...restConfig,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

export async function uploadFile(
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };
    }

    return new Promise((resolve, reject) => {
      xhr.open('POST', endpoint);
      
      const user = userFromStorage();
      if (user?.uid) {
        xhr.setRequestHeader('Authorization', `Bearer ${user.uid}`);
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

export function get(url: string, options?: RequestConfig): any {
  return request(url, { ...options, method: 'GET' });
}

export function post(url: string, data: any, options?: RequestConfig): any {
  return request(url, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined });
}

export function put(url: string, data: any, options?: RequestConfig): any {
  return request(url, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined });
}

export function del(url: string, options?: RequestConfig): any {
  return request(url, { ...options, method: 'DELETE' });
}

export default {
  request,
  get,
  post,
  put,
  delete: del,
  uploadFile,
};
//# sourceMappingURL=request.js.map