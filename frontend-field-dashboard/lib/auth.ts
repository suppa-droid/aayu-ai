import { apiClient } from './api-client';

export async function login(username: string, password: string = 'password123') {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;
    localStorage.setItem('vayosetu_token', data.access_token);
    localStorage.setItem('vayosetu_user', JSON.stringify({
      role: data.user.role,
      name: data.user.full_name,
      username: data.user.username
    }));
    window.location.href = '/';
    return true;
  } catch (error) {
    console.error('Login failed', error);
    return false;
  }
}

export function logout() {
  localStorage.removeItem('vayosetu_user');
  localStorage.removeItem('vayosetu_token');
  window.location.href = '/login';
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('vayosetu_user');
  return user ? JSON.parse(user) : null;
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vayosetu_token');
}
