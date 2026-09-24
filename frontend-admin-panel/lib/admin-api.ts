import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://aayu-ai-backendsamo.onrender.com/api/v1';


export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

