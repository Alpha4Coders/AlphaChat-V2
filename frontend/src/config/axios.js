import axios from 'axios';
import { API_URL } from './api';

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Don't set Content-Type for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect on 401 for auth check endpoints
        // This prevents infinite loops on login/welcome pages
        const isAuthCheck = error.config?.url?.includes('/api/auth/me') ||
            error.config?.url?.includes('/api/auth/check');

        if (error.response?.status === 401 && !isAuthCheck) {
            // Only redirect for protected routes, not auth checks
            const currentPath = window.location.pathname;
            if (currentPath !== '/' && currentPath !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

