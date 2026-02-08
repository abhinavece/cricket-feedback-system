/**
 * @fileoverview View Tracking Middleware
 * 
 * Middleware to track views for homepage and public links.
 * Simple and efficient tracking with visitor fingerprinting.
 * 
 * @module middleware/viewTracker
 */

const ViewTracker = require('../models/ViewTracker');
const { resolveTenant } = require('./tenantResolver');

// Generate visitor fingerprint from IP and User-Agent
function generateVisitorFingerprint(req) {
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return require('crypto')
    .createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex');
}

// Extract basic metadata from request
function extractMetadata(req) {
  return {
    userAgent: req.headers['user-agent'],
    referrer: req.headers['referer'] || req.headers['referrer'],
    country: req.headers['x-country'] || null,
    city: req.headers['x-city'] || null
  };
}

// Middleware to track homepage views
const trackHomepageView = async (req, res, next) => {
  try {
    // Skip tracking for admin routes, API routes, and non-GET requests
    if (req.method !== 'GET' || 
        req.path.startsWith('/api/') || 
        req.path.startsWith('/admin') ||
        req.path.includes('.') || // Skip static files
        req.path === '/favicon.ico') {
      return next();
    }

    console.log('Tracking homepage view for path:', req.path);

    // For homepage views, we need to handle the case where there's no authenticated user
    // Let's use a default organization or skip if we can't determine one
    let organizationId = null;

    // Try to get organization from authenticated user first
    if (req.user && req.user.organizations && req.user.organizations.length > 0) {
      organizationId = req.user.organizations[0].organizationId;
      console.log('Using organization from authenticated user:', organizationId);
    } else {
      // For unauthenticated homepage visits, we'll need to determine the organization
      // This could be from domain, subdomain, or a default organization
      // For now, let's skip tracking for unauthenticated visits to avoid errors
      console.log('No authenticated user found, skipping homepage view tracking');
      return next();
    }

    // Find or create homepage tracker
    const tracker = await ViewTracker.findOrCreateTracker(
      organizationId,
      'homepage'
    );

    // Record the view
    const visitorFingerprint = generateVisitorFingerprint(req);
    const metadata = extractMetadata(req);
    
    await tracker.recordView(visitorFingerprint, metadata);
    console.log('Homepage view recorded successfully');

  } catch (error) {
    // Log error but don't break the request
    console.error('View tracking error:', error);
  }

  next();
};

// Middleware to track public link views (enhanced version)
const trackPublicLinkView = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return next();
    }

    console.log('Tracking public link view for token:', token);

    // Find the public link to get organization info
    const PublicLink = require('../models/PublicLink');
    const publicLink = await PublicLink.findOne({ token });

    if (!publicLink) {
      console.log('Public link not found for token:', token);
      return next();
    }

    console.log('Found public link:', publicLink.resourceType, 'for organization:', publicLink.organizationId);

    // Find or create view tracker for this public link
    const tracker = await ViewTracker.findOrCreateTracker(
      publicLink.organizationId,
      'public-link',
      {
        resourceId: publicLink.resourceId,
        resourceType: publicLink.resourceType,
        token: token
      }
    );

    // Record the view
    const visitorFingerprint = generateVisitorFingerprint(req);
    const metadata = extractMetadata(req);
    
    await tracker.recordView(visitorFingerprint, metadata);
    console.log('Public link view recorded successfully');

    // Also update the existing PublicLink access count for compatibility
    await publicLink.recordAccess();

  } catch (error) {
    console.error('Public link view tracking error:', error);
  }

  next();
};

// API endpoint to get view analytics
const getViewAnalytics = async (req, res) => {
  try {
    const organizationId = req.organization._id;
    
    const analytics = await ViewTracker.getOrganizationAnalytics(organizationId);
    
    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching view analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch view analytics'
    });
  }
};

module.exports = {
  trackHomepageView,
  trackPublicLinkView,
  getViewAnalytics
};
