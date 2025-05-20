import axios from 'axios';

// Define the base URL for your API. Adjust if needed.
const API_BASE_URL = process.env.VITE_API_BASE_URL || '/api'; // Example: http://localhost:8080/api

const fetcher = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers needed, e.g., for authentication
    // 'Authorization': `Bearer ${getToken()}`
  },
});

// Optional: Add interceptors for request/response handling (e.g., auth tokens, error handling)
fetcher.interceptors.request.use(
  (config) => {
    // Example: Add auth token to headers if it exists
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

fetcher.interceptors.response.use(
  (response) => {
    // Handle successful responses
    return response;
  },
  (error) => {
    // Handle API errors globally
    console.error('API Error:', error.response?.data || error.message);
    // Example: Redirect to login on 401 Unauthorized
    // if (error.response?.status === 401) {
    //   window.location.href = '/login';
    // }
    return Promise.reject(error);
  }
);

export default fetcher;
