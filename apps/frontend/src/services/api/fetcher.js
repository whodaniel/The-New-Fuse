import axios from 'axios';
// Define the base URL for your API. Adjust if needed.
var API_BASE_URL = process.env.VITE_API_BASE_URL || '/api'; // Example: http://localhost:8080/api
var fetcher = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
        // Add any other default headers needed, e.g., for authentication
        // 'Authorization': `Bearer ${getToken()}`
    },
});
// Optional: Add interceptors for request/response handling (e.g., auth tokens, error handling)
fetcher.interceptors.request.use(function (config) {
    // Example: Add auth token to headers if it exists
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
}, function (error) {
    return Promise.reject(error);
});
fetcher.interceptors.response.use(function (response) {
    // Handle successful responses
    return response;
}, function (error) {
    var _a;
    // Handle API errors globally
    console.error('API Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
    // Example: Redirect to login on 401 Unauthorized
    // if (error.response?.status === 401) {
    //   window.location.href = '/login';
    // }
    return Promise.reject(error);
});
export default fetcher;
