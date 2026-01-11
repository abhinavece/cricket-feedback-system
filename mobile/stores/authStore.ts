import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const PERMISSIONS: Record<string, string[]> = {
  viewer: ['submit_feedback'],
  editor: ['submit_feedback', 'view_dashboard', 'edit_feedback'],
  admin: ['submit_feedback', 'view_dashboard', 'edit_feedback', 'manage_users', 'delete_feedback'],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (token: string, user: User) => {
    try {
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('authUser', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Error saving auth:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('authUser');
      set({ token: null, user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userStr = await SecureStore.getItemAsync('authUser');
      
      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      set({ isLoading: false });
    }
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    return PERMISSIONS[user.role]?.includes(permission) || false;
  },
}));
