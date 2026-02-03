import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import type { User } from '../types';

const isDev = import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost');

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credential: string) => Promise<void>;
  loginDev: (email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('tournament_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.verifyToken();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('tournament_token');
        }
      } catch {
        localStorage.removeItem('tournament_token');
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = useCallback(async (credential: string) => {
    setLoading(true);
    try {
      const response = await authApi.googleLogin(credential) as any;
      // Backend may return { token, user } or { success: true, data: { token, user } }
      const token = response.data?.token ?? response.token;
      const userData = response.data?.user ?? response.user;
      if (token && userData) {
        localStorage.setItem('tournament_token', token);
        setUser(userData);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Dev login - bypasses OAuth for local development
  const loginDev = useCallback(async (email: string) => {
    if (!isDev) {
      throw new Error('Dev login only available in development');
    }
    setLoading(true);
    try {
      const response = await authApi.devLogin(email);
      if (response.success && response.data) {
        localStorage.setItem('tournament_token', response.data.token);
        setUser(response.data.user);
      } else {
        throw new Error(response.error || 'Dev login failed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginDev,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
