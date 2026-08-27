// Talks to Strapi from the browser.
//
// The backend returns its tokens in the login response body rather than a cookie
// (config/plugins.ts sets sessions.httpOnly to false), because Vercel and Railway
// are different sites and a refresh cookie would be a third-party cookie that
// Safari blocks. So we store the tokens here and send the access token as a
// Bearer header.

const JWT_KEY = 'lms_jwt';
const REFRESH_KEY = 'lms_refresh_token';

function apiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_URL is not set');
  }

  return `${baseUrl}${path}`;
}

export function getToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(JWT_KEY);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(jwt: string, refreshToken: string) {
  window.localStorage.setItem(JWT_KEY, jwt);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  window.localStorage.removeItem(JWT_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

// Login and registration must not carry an Authorization header: a stale or
// expired token would be rejected by Strapi's auth layer before the request ever
// reaches the handler.
export function publicPost(path: string, body: unknown) {
  return fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function request(path: string, options: RequestInit, jwt: string | null) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (jwt) {
    headers.set('Authorization', `Bearer ${jwt}`);
  }

  return fetch(apiUrl(path), { ...options, headers });
}

// Shared by every 401 that arrives while a refresh is already in flight. Without
// this, three parallel requests would each rotate the refresh token, and the two
// that lost the race would be left holding a dead one — logging the user out
// despite a perfectly valid session.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await publicPost('/api/auth/refresh', { refreshToken });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = await response.json();

  // Refresh *rotates*: the token we just sent is now dead, so both values have to
  // be replaced. Storing only the new jwt would break the next refresh.
  setTokens(data.jwt, data.refreshToken);

  return data.jwt;
}

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// The access token only lives 10 minutes, so a 401 is expected during normal use
// and means "refresh and try again", not "logged out".
export async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await request(path, options, getToken());

  if (response.status !== 401 || !getRefreshToken()) {
    return response;
  }

  const jwt = await refreshOnce();

  if (!jwt) {
    return response;
  }

  return request(path, options, jwt);
}

// Strapi reports failures as { error: { message } }, both from the plugin and from
// our own /api/auth/register. The catch only covers a body that is not JSON; the
// caller still sees the failure either way.
export async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}
