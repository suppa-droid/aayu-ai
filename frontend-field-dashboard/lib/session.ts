export const SESSION_COOKIE = 'vayosetu_field_auth';

export function setSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=1; Path=/; SameSite=Lax`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function hasSessionCookie() {
  return document.cookie.split('; ').includes(`${SESSION_COOKIE}=1`);
}
