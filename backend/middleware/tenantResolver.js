/**
 * @fileoverview Tenant Resolution Middleware
 * 
 * Resolves the current organization (tenant) context for each request.
 * Ensures users can only access data within their organizations.
 * 
 * @module middleware/tenantResolver
 */

const Organization = require('../models/Organization');

/**
 * Resolve tenant from request context
 * 
 * Resolution order:
 * 1. X-Organization-Id header (explicit org switching)
 * 2. User's activeOrganizationId (default)
 * 3. User's first organization (fallback)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resolveTenant = async (req, res, next) => {
  try {
    // Skip for routes that don't need tenant context
    if (req._skipTenantResolution) {
      return next();
    }

    // Must have authenticated user
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource',
      });
    }

    // Note: We no longer auto-assign organizations in dev mode
    // Users without organizations should see the onboarding flow
    // This ensures the proper multi-tenant experience is tested

    // Get organization ID from header or user's active org
    let organizationId = req.headers['x-organization-id'] || 
                         req.user.activeOrganizationId;

    // Fallback to first organization
    if (!organizationId && req.user.organizations?.length > 0) {
      organizationId = req.user.organizations[0].organizationId;
    }

    // If still no organization, user needs to create or join one
    if (!organizationId) {
      return res.status(400).json({
        error: 'No organization',
        code: 'NO_ORGANIZATION',
        message: 'You are not a member of any organization. Please create or join one.',
      });
    }

    // Validate user has access to this organization
    const membership = req.user.organizations?.find(
      m => m.organizationId.toString() === organizationId.toString() && m.status === 'active'
    );

    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ORG_ACCESS_DENIED',
        message: 'You do not have access to this organization',
      });
    }

    // Fetch organization details
    const organization = await Organization.findById(organizationId);

    if (!organization || !organization.isActive || organization.isDeleted) {
      return res.status(404).json({
        error: 'Organization not found',
        code: 'ORG_NOT_FOUND',
        message: 'The organization does not exist or has been deactivated',
      });
    }

    // Attach organization context to request
    req.organization = organization;
    req.organizationId = organization._id;
    req.organizationRole = membership.role;
    req.organizationMembership = membership;

    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to resolve organization context',
    });
  }
};

/**
 * Middleware to require organization admin role
 */
const requireOrgAdmin = (req, res, next) => {
  if (!req.organizationRole || !['owner', 'admin'].includes(req.organizationRole)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Organization admin privileges required',
    });
  }
  next();
};

/**
 * Middleware to require organization owner role
 */
const requireOrgOwner = (req, res, next) => {
  if (req.organizationRole !== 'owner') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Organization owner privileges required',
    });
  }
  next();
};

/**
 * Middleware to require editor role or higher in organization
 */
const requireOrgEditor = (req, res, next) => {
  if (!req.organizationRole || !['owner', 'admin', 'editor'].includes(req.organizationRole)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Editor privileges required in this organization',
    });
  }
  next();
};

/**
 * Skip tenant resolution for specific routes
 * Use this for public routes or platform-level operations
 */
const skipTenant = (req, res, next) => {
  req._skipTenantResolution = true;
  next();
};

/**
 * Resolve tenant from webhook payload (for WhatsApp webhooks)
 * Routes based on WhatsApp phone_number_id
 * 
 * @param {string} phoneNumberId - WhatsApp phone number ID from webhook
 * @returns {Organization|null}
 */
const resolveWebhookTenant = async (phoneNumberId) => {
  if (!phoneNumberId) return null;
  
  return Organization.findByWhatsAppPhoneNumberId(phoneNumberId);
};

module.exports = {
  resolveTenant,
  requireOrgAdmin,
  requireOrgOwner,
  requireOrgEditor,
  skipTenant,
  resolveWebhookTenant,
};
