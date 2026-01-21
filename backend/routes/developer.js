const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');

// Master developer email - hardcoded for security
const MASTER_DEVELOPER_EMAIL = 'abhinavsinghd1404@gmail.com';

// Middleware to check if user has developer access
const requireDeveloperAccess = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Master developer always has access
    if (user.email === MASTER_DEVELOPER_EMAIL) {
      req.isMasterDeveloper = true;
      return next();
    }
    
    // Check if user has developer access flag
    if (user.hasDeveloperAccess) {
      req.isMasterDeveloper = false;
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: 'Developer access required'
    });
  } catch (error) {
    console.error('Error checking developer access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify developer access'
    });
  }
};

// GET /api/developer/access - Check if current user has developer access
router.get('/access', auth, async (req, res) => {
  try {
    const user = req.user;
    const isMasterDeveloper = user.email === MASTER_DEVELOPER_EMAIL;
    const hasDeveloperAccess = isMasterDeveloper || user.hasDeveloperAccess === true;
    
    console.log(`Developer access check for ${user.email}:`, {
      isMasterDeveloper,
      hasDeveloperAccess,
      userHasDeveloperAccessFlag: user.hasDeveloperAccess
    });
    
    res.json({
      success: true,
      hasDeveloperAccess,
      isMasterDeveloper
    });
  } catch (error) {
    console.error('Error checking developer access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check developer access'
    });
  }
});


// GET /api/developer/settings - Get system settings (requires developer access)
router.get('/settings', auth, requireDeveloperAccess, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    
    // Populate last modified by
    await settings.populate('lastModifiedBy', 'name email');
    
    res.json({
      success: true,
      settings: {
        payment: settings.payment,
        whatsapp: settings.whatsapp,
        lastModifiedBy: settings.lastModifiedBy,
        lastModifiedAt: settings.lastModifiedAt
      }
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system settings'
    });
  }
});

// PUT /api/developer/settings - Update system settings (requires developer access)
router.put('/settings', auth, requireDeveloperAccess, async (req, res) => {
  try {
    const { payment, whatsapp } = req.body;
    
    const settings = await SystemSettings.updateSettings(
      { payment, whatsapp },
      req.user._id
    );
    
    await settings.populate('lastModifiedBy', 'name email');
    
    res.json({
      success: true,
      settings: {
        payment: settings.payment,
        whatsapp: settings.whatsapp,
        lastModifiedBy: settings.lastModifiedBy,
        lastModifiedAt: settings.lastModifiedAt
      },
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update system settings'
    });
  }
});

// GET /api/developer/users - Get all users with developer access info (master developer only)
router.get('/users', auth, requireDeveloperAccess, async (req, res) => {
  try {
    // Only master developer can manage user access
    if (!req.isMasterDeveloper) {
      return res.status(403).json({
        success: false,
        error: 'Only master developer can manage user access'
      });
    }
    
    const users = await User.find({ isActive: true })
      .select('name email role hasDeveloperAccess lastLogin')
      .sort({ name: 1 });
    
    // Mark master developer in response
    const usersWithMasterFlag = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasDeveloperAccess: user.hasDeveloperAccess || user.email === MASTER_DEVELOPER_EMAIL,
      isMasterDeveloper: user.email === MASTER_DEVELOPER_EMAIL,
      lastLogin: user.lastLogin
    }));
    
    res.json({
      success: true,
      users: usersWithMasterFlag
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// PUT /api/developer/users/:userId/access - Grant/revoke developer access (master developer only)
router.put('/users/:userId/access', auth, requireDeveloperAccess, async (req, res) => {
  try {
    // Only master developer can manage user access
    if (!req.isMasterDeveloper) {
      return res.status(403).json({
        success: false,
        error: 'Only master developer can manage user access'
      });
    }
    
    const { hasDeveloperAccess } = req.body;
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Cannot modify master developer's access
    if (user.email === MASTER_DEVELOPER_EMAIL) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify master developer access'
      });
    }
    
    user.hasDeveloperAccess = hasDeveloperAccess === true;
    await user.save();
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        hasDeveloperAccess: user.hasDeveloperAccess
      },
      message: hasDeveloperAccess ? 'Developer access granted' : 'Developer access revoked'
    });
  } catch (error) {
    console.error('Error updating user access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user access'
    });
  }
});

module.exports = router;
