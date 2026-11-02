import axios from 'axios';
import { clearSessionCookie } from './session';

const LOCAL_API = 'http://localhost:8000/api/v1';
const CLOUD_API = 'https://aayu-ai-backendsamo.onrender.com/api/v1';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_API : CLOUD_API);

export const IS_LOCAL_API = /localhost|127\.0\.0\.1/.test(API_BASE_URL);

export const LOGIN_TIMEOUT_MS = IS_LOCAL_API ? 20_000 : 90_000;

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Hits the API origin so a sleeping Render instance can wake before login. */
export function wakeApiServer() {
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return axios.get(origin, { timeout: LOGIN_TIMEOUT_MS }).catch(() => null);
}

adminApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('vayosetu_admin_token') || '';
    token = token.trim().replace(/^"|"$/g, '');
    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.slice(7).trim();
    }
    const isLogin = (config.url || '').includes('/auth/login');
    if (token && !isLogin) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const headers = config.headers as { delete?: (name: string) => void } | undefined;
    if (headers && typeof headers.delete === 'function') {
      headers.delete('Content-Type');
    }
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    if (status === 401 && typeof window !== 'undefined' && !url.includes('/auth/login')) {
      localStorage.removeItem('vayosetu_admin_token');
      localStorage.removeItem('vayosetu_admin_user');
      clearSessionCookie();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

