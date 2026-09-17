import http from 'k6/http';
import { check } from 'k6';

// Login via POST /api/auth/login (front/app/api/auth/login/route.ts:6)
// Returns auth_token string or null
// Note: front sets cookie auth_token (httpOnly), but k6's http.cookieJar captures it.
// We parse from res.cookies['auth_token'] if available.
export function login(baseUrl, email, password) {
  const payload = JSON.stringify({
    identity: email,
    password: password,
    rememberMe: false,
  });

  const res = http.post(`${baseUrl}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /api/auth/login' },
  });

  const ok = check(res, {
    'login status 200': (r) => r.status === 200,
    'login has success': (r) => {
      try {
        const j = r.json();
        return j.success === true || r.status === 200;
      } catch (_) {
        return r.status === 200;
      }
    },
  });

  if (!ok) {
    console.warn(`login failed: status=${res.status} body=${res.body?.substring(0, 200)}`);
    return null;
  }

  // k6 captures Set-Cookie into res.cookies when using http.post
  // front/app/api/auth/login/route.ts:90 -> response.cookies.set("auth_token", token)
  if (res.cookies && res.cookies['auth_token'] && res.cookies['auth_token'].length > 0) {
    return res.cookies['auth_token'][0].value;
  }

  // Fallback: try cookieJar (k6's jar is per-VU)
  try {
    const jar = http.cookieJar();
    const cookies = jar.cookiesForURL(baseUrl);
    if (cookies['auth_token']) return cookies['auth_token'];
  } catch (_) {}

  // Last resort: parse Set-Cookie header manually
  const setCookie = res.headers['Set-Cookie'] || res.headers['set-cookie'] || '';
  const match = String(setCookie).match(/auth_token=([^;]+)/);
  if (match) return match[1];

  console.warn('login: could not extract auth_token from cookies/headers');
  return null;
}

// Helper to build Cookie header for authenticated requests
export function authHeaders(token) {
  if (!token) return {};
  return { cookies: { auth_token: token } };
}
