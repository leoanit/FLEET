import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const apiClient = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Request Interceptor: Attach dynamic authorization JWT headers
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Manage session expiries and standardized errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect authorization credentials expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Perform automated session purge
      useAuthStore.getState().logout();
      
      // Redirect to authentication layout
      window.location.href = '/login';
    }

    // Wrap common HTTP statuses in descriptive developer envelopes
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred',
      status: error.response?.status || 500,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      raw: error
    };

    return Promise.reject(customError);
  }
);

export default apiClient;
