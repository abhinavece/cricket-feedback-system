/**
 * Domain detection utilities for multi-domain routing
 */

export type DomainType = 'homepage' | 'app' | 'localhost';

/**
 * Get the current domain type based on hostname
 */
export const getDomainType = (): DomainType => {
  const hostname = window.location.hostname.toLowerCase();
  
  // Homepage domains
  if (hostname === 'cricsmart.in' || hostname === 'www.cricsmart.in') {
    return 'homepage';
  }
  
  // App domain
  if (hostname === 'app.cricsmart.in') {
    return 'app';
  }
  
  // Legacy domain - treat as app for backward compatibility
  if (hostname === 'mavericks11.duckdns.org') {
    return 'app';
  }
  
  // Local development - allow all routes
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  
  // Default to app for any other domain
  return 'app';
};

/**
 * Check if current domain is the homepage domain
 */
export const isHomepageDomain = (): boolean => {
  return getDomainType() === 'homepage';
};

/**
 * Check if current domain is the app domain
 */
export const isAppDomain = (): boolean => {
  return getDomainType() === 'app';
};

/**
 * Check if we're in local development
 */
export const isLocalhost = (): boolean => {
  return getDomainType() === 'localhost';
};

/**
 * Get the appropriate redirect URL for the app
 * On app.cricsmart.in, dashboard is at root (no /app suffix)
 * On localhost, we still use /app for development
 */
export const getAppUrl = (): string => {
  if (isLocalhost()) {
    return window.location.origin + '/app';
  }
  // App domain serves dashboard at root
  return 'https://app.cricsmart.in';
};

/**
 * Get the homepage URL
 */
export const getHomepageUrl = (): string => {
  if (isLocalhost()) {
    return window.location.origin;
  }
  return 'https://cricsmart.in';
};
