import { apiClient } from './api-client';

const FIELD_ROLES = ['FIELD_WORKER', 'LEVEL_1_FIELD_WORKER'];

export async function login(username: string, password: string = 'password123'): Promise<true | string> {
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
    if (!FIELD_ROLES.includes(data.user?.role)) {
      return 'This account belongs to the admin portal, not the field kiosk.';
    }
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
    return 'Invalid username or password.';
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
