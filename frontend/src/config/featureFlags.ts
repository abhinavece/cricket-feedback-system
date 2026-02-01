/**
 * @fileoverview Frontend Feature Flags
 * 
 * Manages feature flags on the frontend.
 * Flags are fetched from backend or set via environment variables.
 */

export interface FeatureFlags {
  MULTI_TENANT: boolean;
  TEAM_DISCOVERY: boolean;
  WHATSAPP_BYOT: boolean;
}

// Default flags (all new features disabled by default)
const defaultFlags: FeatureFlags = {
  MULTI_TENANT: false,
  TEAM_DISCOVERY: false,
  WHATSAPP_BYOT: false,
};

// Check environment variables for overrides (useful for local dev)
const getEnvFlags = (): Partial<FeatureFlags> => {
  const flags: Partial<FeatureFlags> = {};
  
  if (process.env.REACT_APP_FF_MULTI_TENANT === 'true') {
    flags.MULTI_TENANT = true;
  }
  if (process.env.REACT_APP_FF_TEAM_DISCOVERY === 'true') {
    flags.TEAM_DISCOVERY = true;
  }
  if (process.env.REACT_APP_FF_WHATSAPP_BYOT === 'true') {
    flags.WHATSAPP_BYOT = true;
  }
  
  return flags;
};

// In-memory cache of feature flags
let cachedFlags: FeatureFlags = { ...defaultFlags, ...getEnvFlags() };
let flagsLoadedFromServer = false;

/**
 * Initialize feature flags from server response
 * Call this after user authentication
 */
export function initializeFeatureFlags(serverFlags: Partial<FeatureFlags>): void {
  cachedFlags = { ...defaultFlags, ...getEnvFlags(), ...serverFlags };
  flagsLoadedFromServer = true;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return cachedFlags[flag] ?? false;
}

/**
 * Get all feature flags
 */
export function getAllFlags(): FeatureFlags {
  return { ...cachedFlags };
}

/**
 * Check if flags have been loaded from server
 */
export function areFlagsLoaded(): boolean {
  return flagsLoadedFromServer;
}

/**
 * Reset flags (useful for testing or logout)
 */
export function resetFlags(): void {
  cachedFlags = { ...defaultFlags, ...getEnvFlags() };
  flagsLoadedFromServer = false;
}
