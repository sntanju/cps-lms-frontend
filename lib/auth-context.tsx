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

export type Role = 'Admin' | 'Content Manager' | 'Instructor' | 'Student';

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
};

type MeResponse = {
  data: {
    id: number;
    fullName: string;
    email: string;
    role: { id: number; name: string } | null;
  };
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

async function fetchMe(): Promise<AuthUser | null> {
  const response = await apiFetch('/api/auth/me');

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readError(response, 'Could not load your account'));
  }

  const { data }: MeResponse = await response.json();

  if (!data.role) {
    throw new Error(
      'Your account has no role assigned. Contact an administrator.',
    );
  }

  return {
    id: data.id,
    fullName: data.fullName,
    email: data.email,
    role: data.role.name as Role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const signOutLocally = useCallback(() => {
    clearTokens();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

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

      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        const response = await apiFetch('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });

        const rotated = getRefreshToken();

        if (!response.ok && rotated && rotated !== refreshToken) {
          await apiFetch('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: rotated }),
          });
        }
      }
    } catch (error) {
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
