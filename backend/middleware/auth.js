/**
 * @fileoverview Authentication Middleware
 * 
 * Handles JWT token verification and user authentication.
 * Supports development mode bypass for local testing.
 * 
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @description
 * - Checks for JWT token in Authorization header (Bearer token)
 * - Verifies token signature and expiration
 * - Fetches user from database
 * - Attaches user object to req.user
 * - Supports DISABLE_AUTH=true for local development
 */
const auth = async (req, res, next) => {
  try {
    // Bypass auth for local development if DISABLE_AUTH is set
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('⚠️ Auth bypassed - DISABLE_AUTH is enabled');
      
      // Check for DEV_USER_EMAIL env var or try to find first admin user
      const devUserEmail = process.env.DEV_USER_EMAIL;
      let devUser = null;
      
      if (devUserEmail) {
        // Use specific user by email
        devUser = await User.findOne({ email: devUserEmail, isActive: true });
        if (devUser) {
          console.log(`⚠️ Dev mode: Using user "${devUser.name}" (${devUser.email})`);
        }
      }
      
      if (!devUser) {
        // Fallback: Try to find first admin user with organizations
        devUser = await User.findOne({ 
          role: 'admin', 
          isActive: true,
          'organizations.0': { $exists: true }
        }).sort({ createdAt: 1 });
        
        if (devUser) {
          console.log(`⚠️ Dev mode: Using first admin user "${devUser.name}" (${devUser.email})`);
        }
      }
      
      if (devUser) {
        // Use real user from database - this maintains their organizations
        req.user = devUser;
        return next();
      }
      
      // No existing user found - create mock user for testing onboarding
      console.log('⚠️ Dev mode: No existing user found, using mock user (will trigger onboarding)');
      const mongoose = require('mongoose');
      const mockRole = process.env.MOCK_USER_ROLE || 'admin';
      const mockUserId = new mongoose.Types.ObjectId();
      
      req.user = {
        _id: mockUserId,
        id: mockUserId.toString(),
        email: 'dev@localhost',
        name: 'Local Dev User',
        role: mockRole,
        isActive: true,
        organizations: [],
        activeOrganizationId: null,
        platformRole: 'platform_admin',
        isMemberOf: () => true,
        getRoleInOrganization: () => mockRole,
        isAdminOf: () => mockRole === 'admin',
        canEditIn: () => ['admin', 'editor'].includes(mockRole),
        isPlatformAdmin: () => true,
      };
      console.log('Mock user role:', mockRole);
      return next();
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid authentication',
        message: 'User not found or inactive'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware: Require Admin Role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

/**
 * Middleware: Require Editor or Admin Role (blocks viewers)
 */
const requireEditor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Editor privileges required' });
  }
  next();
};

module.exports = { auth, requireAdmin, requireEditor };
