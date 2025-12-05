import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use((config) => {
  // Skip auth token for public forgot PIN endpoints
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-pin', '/auth/verify-otp', '/auth/reset-pin'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));

  if (!isPublicEndpoint) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (invalid/expired token)
    if (error.response && error.response.status === 401) {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if not already on login/register page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        // Show user-friendly message
        alert('Your session has expired. Please log in again.');
        // Redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;