import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY = 'user';

const clearStoredAuth = () => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // No-op if storage is unavailable.
  }
};

const notifySessionExpired = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

// Attach Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const detail = String(error?.response?.data?.detail || '');
    const requestUrl = String(error?.config?.url || '');

    const isAuthEndpoint =
      requestUrl.includes('/user/login/') ||
      requestUrl.includes('/admin-auth/admin_login/');

    const isAuthFailure =
      status === 401 ||
      (status === 403 &&
        /Authentication credentials were not provided\.|Invalid or expired token|Account not yet approved by admin\.|Account has been deactivated\./i.test(
          detail,
        ));

    if (isAuthFailure && !isAuthEndpoint) {
      clearStoredAuth();
      notifySessionExpired();
    }

    return Promise.reject(error);
  },
);