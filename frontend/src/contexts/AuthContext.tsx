import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'viewer' | 'editor' | 'admin';
  lastLogin?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  canEdit: () => boolean;
  isAdmin: () => boolean;
  isViewer: () => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if auth is disabled for local development
    if (process.env.REACT_APP_DISABLE_AUTH === 'true') {
      console.log('⚠️ Auth bypassed - REACT_APP_DISABLE_AUTH is enabled');
      const mockUser: User = {
        id: 'local-dev-user',
        email: 'dev@localhost',
        name: 'Local Dev Admin',
        role: 'admin',
      };
      setUser(mockUser);
      setToken('local-dev-token');
      setLoading(false);
      return;
    }

    // Check for existing token on mount
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    googleLogout();
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions = {
      viewer: ['submit_feedback', 'view_dashboard'],
      editor: ['submit_feedback', 'view_dashboard', 'edit_feedback'],
      admin: ['submit_feedback', 'view_dashboard', 'edit_feedback', 'manage_users', 'delete_feedback'],
    };

    return permissions[user.role]?.includes(permission) || false;
  };

  const canEdit = (): boolean => {
    return user?.role === 'admin' || user?.role === 'editor';
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isViewer = (): boolean => {
    return user?.role === 'viewer';
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    canEdit,
    isAdmin,
    isViewer,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
