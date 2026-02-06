/**
 * @fileoverview Organization Context
 * 
 * Manages the current organization (tenant) context for multi-tenant support.
 * Provides organization data, switching, and role-based access within organizations.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Organization interface
export interface Organization {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  limits: {
    maxPlayers: number;
    maxMatches: number;
    maxAdmins: number;
    maxEditors: number;
  };
  settings: {
    defaultTimeSlot: string;
    defaultGround?: string;
    feedbackEnabled: boolean;
    paymentTrackingEnabled: boolean;
    availabilityTrackingEnabled: boolean;
    timezone: string;
  };
  stats: {
    playerCount: number;
    matchCount: number;
    memberCount: number;
  };
  whatsapp: {
    enabled: boolean;
    connectionStatus: 'pending' | 'connected' | 'disconnected' | 'error';
    displayPhoneNumber?: string;
  };
  createdAt: string;
  userRole?: 'owner' | 'admin' | 'editor' | 'viewer';
}

// Organization membership in user's list
export interface OrganizationMembership {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  plan: string;
  stats: {
    playerCount: number;
    matchCount: number;
    memberCount: number;
  };
  userRole: 'owner' | 'admin' | 'editor' | 'viewer';
  isActive: boolean;
}

interface OrganizationContextType {
  // Current organization
  currentOrg: Organization | null;
  // List of user's organizations
  userOrgs: OrganizationMembership[];
  // Loading state
  loading: boolean;
  // Error state
  error: string | null;
  // Switch to another organization
  switchOrganization: (orgId: string) => Promise<void>;
  // Refresh organization data
  refreshOrganization: () => Promise<void>;
  // Create a new organization
  createOrganization: (name: string, description?: string) => Promise<Organization>;
  // Role checks for current organization
  isOrgOwner: boolean;
  isOrgAdmin: boolean;
  canEditInOrg: boolean;
  // Check if user has any organization
  hasOrganization: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [userOrgs, setUserOrgs] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API helper with auth header
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `API error: ${response.status}`);
      (error as any).code = errorData.code;
      throw error;
    }

    return response.json();
  }, [token]);

  // Fetch user's organizations
  const fetchOrganizations = useCallback(async () => {
    try {
      const data = await apiCall('/organizations');
      const orgs = data.organizations || [];
      setUserOrgs(orgs);
      console.log(`[OrganizationContext] Fetched ${orgs.length} organizations`);
      return orgs;
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      // On error, set empty array to allow onboarding flow
      setUserOrgs([]);
      return [];
    }
  }, [apiCall]);

  // Fetch current organization details
  const fetchCurrentOrganization = useCallback(async () => {
    try {
      const data = await apiCall('/organizations/current');
      if (data.organization) {
        setCurrentOrg({
          ...data.organization,
          userRole: data.userRole,
        });
      } else {
        setCurrentOrg(null);
      }
      return data.organization;
    } catch (err: any) {
      // NO_ORGANIZATION error is expected for new users
      // Check for error code or various error message formats
      const errorCode = err.code;
      const errorMsg = err.message?.toLowerCase() || '';
      const isNoOrgError = 
        errorCode === 'NO_ORGANIZATION' ||
        errorMsg.includes('no organization') ||
        errorMsg.includes('no_organization') ||
        errorMsg.includes('not a member of any organization') ||
        errorMsg.includes('no active organization');
      
      if (isNoOrgError) {
        console.log('[OrganizationContext] User has no organization - onboarding needed');
        setCurrentOrg(null);
        setError(null); // Clear any previous errors
        return null;
      }
      
      // For other errors, log but don't block the UI
      console.error('Error fetching current organization:', err);
      setCurrentOrg(null); // Ensure we don't get stuck
      setError(err.message);
      return null;
    }
  }, [apiCall]);

  // Initial load
  useEffect(() => {
    const loadOrganizationData = async () => {
      if (!isAuthenticated) {
        console.log('[OrganizationContext] User not authenticated, clearing data');
        setCurrentOrg(null);
        setUserOrgs([]);
        setLoading(false);
        return;
      }

      console.log('[OrganizationContext] Loading organization data...');
      setLoading(true);
      setError(null);

      try {
        // Fetch both in parallel
        const [orgs, currentOrg] = await Promise.all([
          fetchOrganizations(),
          fetchCurrentOrganization(),
        ]);
        console.log('[OrganizationContext] Load complete:', { 
          orgsCount: orgs?.length || 0, 
          hasCurrentOrg: !!currentOrg 
        });
      } catch (err: any) {
        console.error('[OrganizationContext] Error loading organization data:', err);
        // Don't set error state here - let individual fetch functions handle it
        // This prevents blocking the UI on network errors
      } finally {
        setLoading(false);
        console.log('[OrganizationContext] Loading complete');
      }
    };

    loadOrganizationData();
  }, [isAuthenticated, fetchOrganizations, fetchCurrentOrganization]);

  // Switch organization
  const switchOrganization = async (orgId: string) => {
    try {
      setLoading(true);
      const data = await apiCall('/organizations/switch', {
        method: 'POST',
        body: JSON.stringify({ organizationId: orgId }),
      });

      // Refresh current org data
      await fetchCurrentOrganization();
      
      // Update active status in user orgs list
      setUserOrgs(prev => prev.map(org => ({
        ...org,
        isActive: org._id === orgId,
      })));

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh organization data
  const refreshOrganization = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrganizations(),
        fetchCurrentOrganization(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Create a new organization
  const createOrganization = async (name: string, description?: string): Promise<Organization> => {
    try {
      setLoading(true);
      const data = await apiCall('/organizations', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });

      // Refresh organization data
      await refreshOrganization();

      return data.organization;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Role checks
  const userRole = currentOrg?.userRole;
  const isOrgOwner = userRole === 'owner';
  const isOrgAdmin = userRole === 'owner' || userRole === 'admin';
  const canEditInOrg = userRole === 'owner' || userRole === 'admin' || userRole === 'editor';
  const hasOrganization = userOrgs.length > 0 || currentOrg !== null;

  const value: OrganizationContextType = {
    currentOrg,
    userOrgs,
    loading,
    error,
    switchOrganization,
    refreshOrganization,
    createOrganization,
    isOrgOwner,
    isOrgAdmin,
    canEditInOrg,
    hasOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export default OrganizationContext;
