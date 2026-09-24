import { adminApi } from './admin-api';

const ADMIN_ROLES = ['DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'LEVEL_2_DISTRICT_ADMIN', 'LEVEL_3_SYSTEM_ADMIN'];

export async function login(username: string, password: string = 'password123'): Promise<true | string> {
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
    if (!ADMIN_ROLES.includes(data.user?.role)) {
      return 'This account is a field worker. Use the field kiosk instead.';
    }
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
    return 'Invalid username or password.';
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
