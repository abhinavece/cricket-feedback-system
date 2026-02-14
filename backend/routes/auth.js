const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const Organization = require('../models/Organization.js');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper: Ensure user has active organization set
 * Returns user, needsOnboarding flag, and organizationRole
 * 
 * NOTE: We no longer auto-migrate users to Mavericks XI. 
 * Users without organizations should go through the team selection onboarding flow.
 */
async function ensureActiveOrganization(user) {
  // If user has organizations, ensure activeOrganizationId is set
  if (user.organizations && user.organizations.length > 0) {
    if (!user.activeOrganizationId) {
      user.activeOrganizationId = user.organizations[0].organizationId;
      await user.save();
    }
    
    // Get user's role in their active organization
    const activeMembership = user.organizations.find(
      m => m.organizationId?.toString() === user.activeOrganizationId?.toString() && m.status === 'active'
    );
    // Map 'owner' to 'admin' for consistency in frontend checks
    const organizationRole = activeMembership?.role === 'owner' ? 'admin' : activeMembership?.role || 'viewer';
    
    return { user, needsOnboarding: false, organizationRole };
  }

  // User has no organizations - they need to go through onboarding
  console.log(`[Auth] User ${user.email} has no organizations - needs onboarding`);
  return { user, needsOnboarding: true, organizationRole: null };
}

// Initialize Google OAuth client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Google OAuth login (accepts token or credential – Google One Tap sends credential)
router.post('/google', async (req, res) => {
  try {
    const token = req.body.token || req.body.credential;

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

    // Ensure user has activeOrganizationId set if they have organizations
    const { user: updatedUser, needsOnboarding, organizationRole } = await ensureActiveOrganization(user);
    user = updatedUser;

    // Generate JWT token (no longer includes role - loaded from DB on each request)
    const jwtToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Check if user has organizations
    const hasOrganizations = user.organizations && user.organizations.length > 0;

    // Return user data without sensitive fields
    const userData = {
      id: user._id, // Send as 'id' for frontend consistency
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role, // DEPRECATED - kept for backward compatibility
      organizationRole, // NEW - user's role in their active organization
      platformRole: user.platformRole, // For platform-level admin operations
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      hasOrganizations,
      activeOrganizationId: user.activeOrganizationId,
      needsOnboarding, // Flag to indicate if user needs to select/create a team
    };

    res.json({
      token: jwtToken,
      user: userData,
      needsOnboarding, // Also at top level for easier access
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Dev login - LOCAL DEVELOPMENT ONLY
// Bypasses OAuth for easier testing. Allowed when ALLOW_DEV_LOGIN=true or request is from localhost.
router.post('/dev-login', async (req, res) => {
  const allowDevLogin = /^(true|1|yes)$/i.test(String(process.env.ALLOW_DEV_LOGIN || '').trim());
  const host = (req.get('host') || '').split(':')[0];
  const origin = (req.get('origin') || '').replace(/^https?:\/\//, '').split(':')[0];
  const remoteIp = (req.ip || req.connection?.remoteAddress || '').replace(/^::ffff:/, '');
  const isLocalhost =
    host === 'localhost' || host === '127.0.0.1' ||
    origin === 'localhost' || origin === '127.0.0.1' ||
    remoteIp === '127.0.0.1' || remoteIp === '::1';

  // Debug logging
  console.log('[DevLogin] Debug:', {
    host,
    origin,
    remoteIp,
    rawIp: req.ip,
    isLocalhost,
    allowDevLogin,
    nodeEnv: process.env.NODE_ENV,
    envAllowDevLogin: process.env.ALLOW_DEV_LOGIN,
  });

  // TEMPORARILY DISABLED - always allow dev-login for debugging
  // if (!allowDevLogin && !isLocalhost && process.env.NODE_ENV === 'production') {
  //   return res.status(403).json({ error: 'Dev login not available in production' });
  // }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create a new dev user
      user = new User({
        email: email.toLowerCase(),
        name: email.split('@')[0],
        role: 'admin', // Dev users get admin access for testing
        picture: null,
        googleId: `dev-${Date.now()}`,
        organizations: [],
      });
      await user.save();
      console.log(`[DevLogin] Created new dev user: ${email}`);
    }

    // Ensure active organization
    const { user: updatedUser, needsOnboarding } = await ensureActiveOrganization(user);

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: updatedUser._id, email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Longer expiry for dev convenience
    );

    // Build user data
    const userData = {
      _id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      picture: updatedUser.picture,
      role: updatedUser.role,
      organizations: updatedUser.organizations || [],
      activeOrganizationId: updatedUser.activeOrganizationId,
      needsOnboarding,
    };

    console.log(`[DevLogin] User logged in: ${email} (needsOnboarding: ${needsOnboarding})`);

    res.json({
      success: true,
      data: {
        token: jwtToken,
        user: userData,
      },
      needsOnboarding,
    });
  } catch (error) {
    console.error('[DevLogin] Error:', error);
    res.status(500).json({ error: 'Dev login failed' });
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

    // Ensure user has activeOrganizationId set if they have organizations
    const { user: updatedUser, needsOnboarding, organizationRole } = await ensureActiveOrganization(user);
    user = updatedUser;

    // Generate JWT token with longer expiry for mobile (no longer includes role)
    const jwtToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' } // Longer expiry for mobile
    );

    // Check if user has organizations
    const hasOrganizations = user.organizations && user.organizations.length > 0;

    // Return user data
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role, // DEPRECATED - kept for backward compatibility
      organizationRole, // NEW - user's role in their active organization
      platformRole: user.platformRole, // For platform-level admin operations
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      hasOrganizations,
      activeOrganizationId: user.activeOrganizationId,
      needsOnboarding,
    };

    res.json({
      token: jwtToken,
      user: userData,
      needsOnboarding,
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
    
    let user = await User.findById(decoded.userId).select('-googleId');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    // Ensure user has activeOrganizationId set if they have organizations
    const { user: updatedUser, needsOnboarding, organizationRole } = await ensureActiveOrganization(user);
    user = updatedUser;

    // Check if user has organizations
    const hasOrganizations = user.organizations && user.organizations.length > 0;

    // Return consistent user data structure
    const userData = {
      id: user._id, // Send as 'id' for frontend consistency
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role, // DEPRECATED - kept for backward compatibility
      organizationRole, // NEW - user's role in their active organization
      platformRole: user.platformRole, // For platform-level admin operations
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      hasOrganizations,
      activeOrganizationId: user.activeOrganizationId,
      needsOnboarding,
    };

    res.json({
      valid: true,
      user: userData,
      needsOnboarding,
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
    
    // Platform admin check - use platformRole instead of legacy role
    if (!requestingUser || requestingUser.platformRole !== 'platform_admin') {
      return res.status(403).json({ error: 'Platform admin access required' });
    }

    const users = await User.find().select('-googleId').sort({ createdAt: -1 });
    
    // Transform users to consistent structure with 'id' instead of '_id'
    const transformedUsers = users.map(user => ({
      id: user._id, // Send as 'id' for frontend consistency
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role, // DEPRECATED
      platformRole: user.platformRole,
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
    
    // Platform admin check - use platformRole instead of legacy role
    if (!requestingUser || requestingUser.platformRole !== 'platform_admin') {
      return res.status(403).json({ error: 'Platform admin access required' });
    }

    const { userId } = req.params;
    const { role, platformRole } = req.body;

    // Support both legacy role and new platformRole updates
    if (role && !['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (platformRole && !['user', 'platform_admin'].includes(platformRole)) {
      return res.status(400).json({ error: 'Invalid platformRole' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === requestingUser._id.toString()) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // Update legacy role if provided (for backward compatibility)
    if (role) {
      user.role = role;
    }
    // Update platformRole if provided
    if (platformRole) {
      user.platformRole = platformRole;
    }
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

    // Set both legacy role and platformRole for full admin access
    user.role = 'admin';
    user.platformRole = 'platform_admin';
    await user.save();

    res.json({
      message: 'User promoted to platform admin successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        platformRole: user.platformRole,
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

// Get user's product/resource counts across all CricSmart products
router.get('/me/products', auth, async (req, res) => {
  try {
    const Auction = require('../models/Auction');
    const Tournament = require('../models/Tournament');
    const Organization = require('../models/Organization');

    // Count resources the user has access to
    const [auctionCount, orgIds] = await Promise.all([
      Auction.countDocuments({
        'admins.userId': req.user._id,
        isDeleted: false,
      }),
      Promise.resolve(
        (req.user.organizations || [])
          .filter(m => m.status === 'active')
          .map(m => m.organizationId)
      ),
    ]);

    // Get org details to separate teams vs tournament orgs
    const organizations = orgIds.length > 0
      ? await Organization.find({ _id: { $in: orgIds }, isActive: true, isDeleted: false })
          .select('name slug description')
          .lean()
      : [];

    // Count tournaments across all user's orgs
    const tournamentCount = orgIds.length > 0
      ? await Tournament.countDocuments({
          organizationId: { $in: orgIds },
          isDeleted: false,
        })
      : 0;

    res.json({
      success: true,
      data: {
        teams: organizations.length,
        tournaments: tournamentCount,
        auctions: auctionCount,
        organizations: organizations.map(o => ({
          _id: o._id,
          name: o.name,
          slug: o.slug,
        })),
      },
    });
  } catch (error) {
    console.error('Get user products error:', error);
    res.status(500).json({ error: 'Failed to get user products' });
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
