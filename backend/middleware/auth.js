const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const auth = async (req, res, next) => {
  try {
    // Bypass auth for local development if DISABLE_AUTH is set
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('⚠️ Auth bypassed - DISABLE_AUTH is enabled');
      const mongoose = require('mongoose');
      const mockRole = process.env.MOCK_USER_ROLE || 'admin';
      // Create a mock user for local testing with valid ObjectId
      req.user = {
        _id: new mongoose.Types.ObjectId(),
        id: new mongoose.Types.ObjectId().toString(),
        email: 'dev@localhost',
        name: 'Local Dev User',
        role: mockRole,
        isActive: true
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
