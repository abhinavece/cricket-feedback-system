const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Google OAuth client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Verify Google token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user with default role
      user = new User({
        googleId: payload.sub,
        email,
        name,
        avatar: picture,
        role: 'viewer', // Default role
        isActive: true,
        lastLogin: new Date(),
      });
      await user.save();
    } else {
      // Update last login and avatar if changed
      user.lastLogin = new Date();
      if (picture && user.avatar !== picture) {
        user.avatar = picture;
      }
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data without sensitive fields
    const userData = {
      id: user._id, // Send as 'id' for frontend consistency
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      token: jwtToken,
      user: userData
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Mobile Google OAuth login (uses access token instead of ID token)
router.post('/google/mobile', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Fetch user info from Google using access token
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    const googleUser = await response.json();
    const { email, name, picture, id: googleId } = googleUser;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user with default role
      user = new User({
        googleId,
        email,
        name,
        avatar: picture,
        role: 'viewer', // Default role
        isActive: true,
        lastLogin: new Date(),
      });
      await user.save();
    } else {
      // Update last login and avatar if changed
      user.lastLogin = new Date();
      if (picture && user.avatar !== picture) {
        user.avatar = picture;
      }
      await user.save();
    }

    // Generate JWT token with longer expiry for mobile
    const jwtToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' } // Longer expiry for mobile
    );

    // Return user data
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      token: jwtToken,
      user: userData
    });
  } catch (error) {
    console.error('Mobile Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify token and get user info
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await User.findById(decoded.userId).select('-googleId');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    // Return consistent user data structure
    const userData = {
      id: user._id, // Send as 'id' for frontend consistency
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      valid: true,
      user: userData
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const requestingUser = await User.findById(decoded.userId);
    
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find().select('-googleId').sort({ createdAt: -1 });
    
    // Transform users to consistent structure with 'id' instead of '_id'
    const transformedUsers = users.map(user => ({
      id: user._id, // Send as 'id' for frontend consistency
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    }));
    
    res.json(transformedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
router.put('/users/:userId/role', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const requestingUser = await User.findById(decoded.userId);
    
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === requestingUser._id.toString()) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Make user admin (one-time setup for super admin)
router.post('/make-admin', async (req, res) => {
  try {
    const { email, superAdminKey } = req.body;

    // Simple super admin key verification (in production, use a more secure method)
    if (superAdminKey !== process.env.SUPER_ADMIN_KEY || 'super-admin-setup-key-2024') {
      return res.status(403).json({ error: 'Invalid super admin key' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    user.role = 'admin';
    await user.save();

    res.json({
      message: 'User promoted to admin successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ error: 'Failed to promote user to admin' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, email } = req.body;

    // Update allowed fields
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Note: For OAuth users, email typically shouldn't be changed
    // But if needed, add email validation and uniqueness check
    
    await user.save();

    // Return updated user data
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get feature flags for current user
router.get('/feature-flags', auth, async (req, res) => {
  try {
    const { getAllFeatureFlags } = require('../config/featureFlags');
    
    const flags = getAllFeatureFlags({
      user: req.user,
      orgId: req.user?.activeOrganizationId,
    });
    
    // Convert to simple enabled/disabled map for frontend
    const simpleFlags = {};
    for (const [name, info] of Object.entries(flags)) {
      simpleFlags[name] = info.enabled;
    }
    
    res.json({
      success: true,
      flags: simpleFlags,
    });
  } catch (error) {
    console.error('Feature flags error:', error);
    res.status(500).json({ error: 'Failed to get feature flags' });
  }
});

module.exports = router;
