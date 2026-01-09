const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const auth = async (req, res, next) => {
  try {
    // Bypass auth for local development if DISABLE_AUTH is set
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('⚠️ Auth bypassed - DISABLE_AUTH is enabled');
      const mongoose = require('mongoose');
      // Create a mock admin user for local testing with valid ObjectId
      req.user = {
        _id: new mongoose.Types.ObjectId(),
        id: new mongoose.Types.ObjectId().toString(),
        email: 'dev@localhost',
        name: 'Local Dev Admin',
        role: 'admin',
        isActive: true
      };
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

module.exports = auth;
