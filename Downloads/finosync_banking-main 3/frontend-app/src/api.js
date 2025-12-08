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
// ===============================
//  ⭐ INVESTMENTS API (YONO STYLE)
// ===============================

/**
 * Get all investments for the logged-in user
 */
export function fetchMyInvestments() {
  return api.get('/investments').then((res) => res.data.data);
}

/**
 * Get recommended mutual funds (YONO UI list)
 */
export function fetchMutualFundRecommendations(filters = {}) {
  return api
    .get('/investments/mutual-funds', { params: filters })
    .then((res) => res.data.data);
}

/**
 * Create a new investment for the logged-in user
 */
export function createInvestment(payload) {
  return api.post('/investments', payload).then((res) => res.data.data);
}
