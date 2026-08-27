'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  apiFetch,
  clearTokens,
  getRefreshToken,
  getToken,
  publicPost,
  readError,
  setTokens,
} from '@/lib/api';

// Matched by exact name, the same strings the backend seeds in src/index.ts and
// checks in src/api/auth/services/auth.ts. Renaming a role in the Strapi admin
// panel breaks both sides.
export type Role = 'Admin' | 'Content Manager' | 'Instructor' | 'Student';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: Role;
};

type Status = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: AuthUser | null;
  status: Status;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// GET /api/auth/me rather than Strapi's /api/users/me: the stock endpoint answers
// 200 but silently drops the role, because the content API sanitizer strips it
// out of `populate` and no permission exists that could authorize it.
async function fetchMe(): Promise<AuthUser | null> {
  const response = await apiFetch('/api/auth/me');

  // The token is missing, expired beyond refresh, or revoked — not an error,
  // just nobody signed in.
  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readError(response, 'Could not load your account'));
  }

  const body = await response.json();

  return body.data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const signOutLocally = useCallback(() => {
    clearTokens();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Restores the session after a page reload: the tokens outlive the React tree,
  // so a stored jwt means we can ask the backend who this is. An expired access
  // token is handled transparently by apiFetch.
  useEffect(() => {
    async function restoreSession() {
      if (!getToken()) {
        setStatus('unauthenticated');
        return;
      }

      try {
        const me = await fetchMe();

        if (!me) {
          signOutLocally();
          return;
        }

        setUser(me);
        setStatus('authenticated');
      } catch (error) {
        // The backend is unreachable or broke. Surface it rather than swallow it,
        // but still land in a defined state instead of spinning forever.
        console.error(error);
        signOutLocally();
      }
    }

    restoreSession();
  }, [signOutLocally]);

  const login = useCallback(async (identifier: string, password: string) => {
    const response = await publicPost('/api/auth/local', {
      identifier,
      password,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many attempts. Please wait a minute and try again.');
      }

      throw new Error('Invalid email or password');
    }

    const data = await response.json();

    setTokens(data.jwt, data.refreshToken);

    // Login does not tell us the role: Strapi looks the user up without
    // populating it, so the role needs this second request.
    const me = await fetchMe();

    if (!me) {
      throw new Error('Could not load your account after signing in');
    }

    setUser(me);
    setStatus('authenticated');
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await publicPost('/api/auth/register', {
        name,
        email,
        password,
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Registration failed'));
      }

      // The role is never sent from here. The backend hardcodes Student, because
      // assigning roles is an Admin-only action in the permission matrix.
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      // Revoking the session server-side is best effort. Whatever happens, the
      // user must end up logged out of this browser.
      console.error(error);
    } finally {
      signOutLocally();
    }
  }, [signOutLocally]);

  return (
    <AuthContext.Provider
      value={{ user, status, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
