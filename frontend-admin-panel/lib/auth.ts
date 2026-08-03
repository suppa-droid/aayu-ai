import { adminApi } from './admin-api';

export async function login(username: string, password: string = 'password123') {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await adminApi.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;
    localStorage.setItem('vayosetu_admin_token', data.access_token);
    localStorage.setItem('vayosetu_admin_user', JSON.stringify({
      role: data.user.role,
      name: data.user.full_name,
      username: data.user.username
    }));
    window.location.href = '/dashboard';
    return true;
  } catch (error) {
    console.error('Login failed', error);
    return false;
  }
}

export function logout() {
  localStorage.removeItem('vayosetu_admin_user');
  localStorage.removeItem('vayosetu_admin_token');
  window.location.href = '/login';
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('vayosetu_admin_user');
  return user ? JSON.parse(user) : null;
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vayosetu_admin_token');
}
