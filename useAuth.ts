'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { TOKEN_KEY } from '@/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/** Shape of the JWT payload issued by the backend. */
interface JwtPayload {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string;
  exp: number;
  iat: number;
}

const INITIAL_STATE: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

const LOGGED_OUT_STATE: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
};

export const useAuth = () => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setState(LOGGED_OUT_STATE);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;

      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        setState(LOGGED_OUT_STATE);
        return;
      }

      const user: User = {
        _id: payload.id,
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        createdAt: '',
        updatedAt: '',
      };

      setState({ user, isLoading: false, isAuthenticated: true });
    } catch {
      setState(LOGGED_OUT_STATE);
    }
  }, []);

  const login = useCallback(
    (token: string, user: User): void => {
      localStorage.setItem(TOKEN_KEY, token);
      setState({ user, isLoading: false, isAuthenticated: true });
      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    setState(LOGGED_OUT_STATE);
    router.push('/login');
  }, [router]);

  return { ...state, login, logout };
};
