/**
 * @fileoverview Feature Flags Hook
 * 
 * React hook for checking feature flags in components.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  FeatureFlags,
  isFeatureEnabled as checkFlag,
  initializeFeatureFlags,
  areFlagsLoaded,
} from '../config/featureFlags';
import api from '../services/api';

interface UseFeatureFlagsReturn {
  isEnabled: (flag: keyof FeatureFlags) => boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to check feature flags
 * Automatically fetches flags from server when user is authenticated
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(!areFlagsLoaded());
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch feature flags from server
      const response = await api.get('/auth/feature-flags');
      
      if (response.data.success) {
        initializeFeatureFlags(response.data.flags);
      }
    } catch (err: any) {
      console.error('Failed to fetch feature flags:', err);
      setError(err.message || 'Failed to load feature flags');
      // Continue with default/env flags
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !areFlagsLoaded()) {
      fetchFlags();
    }
  }, [isAuthenticated, fetchFlags]);

  const isEnabled = useCallback((flag: keyof FeatureFlags): boolean => {
    return checkFlag(flag);
  }, []);

  return {
    isEnabled,
    isLoading,
    error,
    refresh: fetchFlags,
  };
}

export default useFeatureFlags;
