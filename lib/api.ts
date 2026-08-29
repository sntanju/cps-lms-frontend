
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

export async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}
