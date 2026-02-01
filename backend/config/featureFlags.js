/**
 * @fileoverview Feature Flags Configuration
 * 
 * Simple feature flag system for gradual rollout of new features.
 * Supports:
 * - Global enable/disable via environment variable
 * - User allowlist for beta testing
 * - Organization-based flags
 * 
 * Usage:
 *   const { isFeatureEnabled } = require('./config/featureFlags');
 *   if (isFeatureEnabled('MULTI_TENANT', { user })) { ... }
 */

/**
 * Feature flag definitions
 * Each flag has:
 * - envVar: Environment variable name to check
 * - defaultEnabled: Default state if env var not set
 * - allowedUsers: Array of user emails who get the feature regardless of global state
 * - allowedOrgs: Array of organization IDs that get the feature
 */
const FEATURE_FLAGS = {
  // Multi-tenant system with team discovery, join requests, BYOT WhatsApp
  MULTI_TENANT: {
    envVar: 'FF_MULTI_TENANT',
    defaultEnabled: true,
    description: 'Multi-tenant system with team discovery and join requests',
    // Beta testers - add emails here
    allowedUsers: (process.env.FF_MULTI_TENANT_USERS || '').split(',').filter(Boolean),
    // Beta organizations - add org IDs here
    allowedOrgs: (process.env.FF_MULTI_TENANT_ORGS || '').split(',').filter(Boolean),
  },
  
  // Team discovery and join requests (subset of multi-tenant)
  TEAM_DISCOVERY: {
    envVar: 'FF_TEAM_DISCOVERY',
    defaultEnabled: true,
    description: 'Allow users to search and request to join teams',
    allowedUsers: (process.env.FF_TEAM_DISCOVERY_USERS || '').split(',').filter(Boolean),
    allowedOrgs: [],
  },
  
  // WhatsApp BYOT (Bring Your Own Token)
  WHATSAPP_BYOT: {
    envVar: 'FF_WHATSAPP_BYOT',
    defaultEnabled: true,
    description: 'Allow teams to configure their own WhatsApp Business number',
    allowedUsers: [],
    allowedOrgs: (process.env.FF_WHATSAPP_BYOT_ORGS || '').split(',').filter(Boolean),
  },
};

/**
 * Check if a feature is enabled for a given context
 * 
 * @param {string} featureName - Name of the feature flag
 * @param {Object} context - Context for evaluation
 * @param {Object} [context.user] - User object with email
 * @param {string} [context.orgId] - Organization ID
 * @returns {boolean} Whether the feature is enabled
 */
function isFeatureEnabled(featureName, context = {}) {
  const flag = FEATURE_FLAGS[featureName];
  
  if (!flag) {
    console.warn(`Unknown feature flag: ${featureName}`);
    return false;
  }
  
  // Check if globally enabled via environment variable
  const envValue = process.env[flag.envVar];
  const globallyEnabled = envValue !== undefined 
    ? envValue === 'true' || envValue === '1'
    : flag.defaultEnabled;
  
  // If globally enabled, return true
  if (globallyEnabled) {
    return true;
  }
  
  // Check user allowlist
  if (context.user?.email && flag.allowedUsers.length > 0) {
    const userEmail = context.user.email.toLowerCase();
    if (flag.allowedUsers.some(email => email.toLowerCase() === userEmail)) {
      return true;
    }
  }
  
  // Check organization allowlist
  if (context.orgId && flag.allowedOrgs.length > 0) {
    const orgIdStr = context.orgId.toString();
    if (flag.allowedOrgs.includes(orgIdStr)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all feature flags with their current state
 * Useful for debugging and admin dashboards
 * 
 * @param {Object} context - Context for evaluation
 * @returns {Object} Map of feature names to their enabled state
 */
function getAllFeatureFlags(context = {}) {
  const result = {};
  for (const [name, flag] of Object.entries(FEATURE_FLAGS)) {
    result[name] = {
      enabled: isFeatureEnabled(name, context),
      description: flag.description,
      globallyEnabled: process.env[flag.envVar] === 'true' || process.env[flag.envVar] === '1',
    };
  }
  return result;
}

/**
 * Middleware to attach feature flags to request
 * Usage: app.use(attachFeatureFlags);
 */
function attachFeatureFlags(req, res, next) {
  req.featureFlags = {
    isEnabled: (featureName) => isFeatureEnabled(featureName, {
      user: req.user,
      orgId: req.organization?._id || req.user?.activeOrganizationId,
    }),
  };
  next();
}

/**
 * Middleware to require a feature flag
 * Returns 404 if feature is not enabled (hides feature existence)
 * 
 * Usage: router.get('/new-feature', requireFeature('MULTI_TENANT'), handler);
 */
function requireFeature(featureName) {
  return (req, res, next) => {
    const enabled = isFeatureEnabled(featureName, {
      user: req.user,
      orgId: req.organization?._id || req.user?.activeOrganizationId,
    });
    
    if (!enabled) {
      // Return 404 to hide feature existence from non-enabled users
      return res.status(404).json({
        error: 'Not found',
        message: 'The requested resource does not exist',
      });
    }
    
    next();
  };
}

module.exports = {
  FEATURE_FLAGS,
  isFeatureEnabled,
  getAllFeatureFlags,
  attachFeatureFlags,
  requireFeature,
};
