import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';

interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'viewer' | 'editor' | 'admin';
  lastLogin?: string;
  createdAt?: string;
  hasOrganizations?: boolean;
  activeOrganizationId?: string;
  needsOnboarding?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, needsOnboarding?: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  canEdit: () => boolean;
  isAdmin: () => boolean;
  isViewer: () => boolean;
  loading: boolean;
  needsOnboarding: boolean;
  setNeedsOnboarding: (value: boolean) => void;
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
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // Check if auth is disabled for local development
    if (process.env.REACT_APP_DISABLE_AUTH === 'true') {
      console.log('⚠️ Auth bypassed - REACT_APP_DISABLE_AUTH is enabled');
      const mockUser: User = {
        id: 'local-dev-user',
        email: 'dev@localhost',
        name: 'Local Dev Admin',
        role: 'admin',
        hasOrganizations: true,
        needsOnboarding: false,
      };
      setUser(mockUser);
      setToken('local-dev-token');
      setNeedsOnboarding(false);
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
        // Set needsOnboarding based on stored user data
        setNeedsOnboarding(parsedUser.needsOnboarding ?? !parsedUser.hasOrganizations);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, onboarding?: boolean) => {
    setToken(newToken);
    setUser(newUser);
    // Use explicit needsOnboarding flag, or fallback to hasOrganizations check
    const needsOnboard = onboarding ?? newUser.needsOnboarding ?? !newUser.hasOrganizations;
    setNeedsOnboarding(needsOnboard);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify({ ...newUser, needsOnboarding: needsOnboard }));
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
    needsOnboarding,
    setNeedsOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
