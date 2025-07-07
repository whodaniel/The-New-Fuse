import axios from 'axios';
import { auth } from '@/lib/firebase';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response && response.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access. Please log in again.');
      // You could trigger a logout or redirect to login here
    }
    
    if (response && response.status === 500) {
      console.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common API operations
export const apiService = {
  get: async <T>(url: string, params?: any) => {
    const response = await api.get<T>(url, { params });
    return response.data;
  },
  
  post: async <T>(url: string, data: any) => {
    const response = await api.post<T>(url, data);
    return response.data;
  },
  
  put: async <T>(url: string, data: any) => {
    const response = await api.put<T>(url, data);
    return response.data;
  },
  
  delete: async <T>(url: string) => {
    const response = await api.delete<T>(url);
    return response.data;
  },
};