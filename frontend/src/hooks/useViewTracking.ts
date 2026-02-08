import { useEffect } from 'react';
import api from '../services/api';

interface ViewTrackingOptions {
  type: 'homepage' | 'public-link';
  token?: string;
  organizationId?: string;
}

// Helper to check if a string is a valid MongoDB ObjectId format
const isValidObjectId = (id: string | undefined): boolean => {
  if (!id) return false;
  return /^[a-f\d]{24}$/i.test(id);
};

/**
 * Hook to track page views
 * Sends tracking data to backend analytics API
 */
export const useViewTracking = (options: ViewTrackingOptions) => {
  useEffect(() => {
    const trackView = async () => {
      try {
        // Skip tracking if no valid organizationId (e.g., 'default-org' is not valid)
        if (!isValidObjectId(options.organizationId)) {
          return;
        }
        
        // Only track in production or when explicitly enabled
        if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_VIEW_TRACKING === 'true') {
          await api.post('/analytics/track', {
            type: options.type,
            token: options.token || undefined,
            organizationId: options.organizationId
          });
        }
      } catch (error) {
        // Silently fail to not break user experience
        console.warn('Failed to track view:', error);
      }
    };

    // Track the view immediately when component mounts
    trackView();
  }, [options.type, options.token, options.organizationId]);
};

/**
 * Simple function to track views without hook
 * Useful for one-time tracking
 */
export const trackView = async (options: ViewTrackingOptions) => {
  try {
    // Skip tracking if no valid organizationId
    if (!isValidObjectId(options.organizationId)) {
      return;
    }
    
    // Only track in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_VIEW_TRACKING === 'true') {
      await api.post('/analytics/track', {
        type: options.type,
        token: options.token || undefined,
        organizationId: options.organizationId
      });
    }
  } catch (error) {
    // Silently fail to not break user experience
    console.warn('Failed to track view:', error);
  }
};
