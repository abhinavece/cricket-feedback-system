const express = require('express');
const router = express.Router();
const Player = require('../models/Player.js');
const User = require('../models/User.js');
const { auth } = require('../middleware/auth.js');
const { formatPhoneNumber } = require('../services/playerService');

// GET /api/profile - Get current user's profile
router.get('/', auth, async (req, res) => {
  console.log('GET /api/profile - Fetching user profile for:', req.user._id);
  try {
    let user = await User.findById(req.user._id).populate('playerId');
    
    // If user not found and DISABLE_AUTH is true, use mock user for development
    if (!user && process.env.DISABLE_AUTH === 'true') {
      console.log('Using mock user for development mode');
      user = {
        _id: req.user._id,
        name: req.user.name || 'Dev User',
        email: req.user.email || 'dev@localhost',
        avatar: null,
        role: 'admin',
        profileComplete: false,
        playerId: null
      };
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    let player = user.playerId;
    
    // If user doesn't have playerId linked, check if there's a player with this userId
    if (!player) {
      player = await Player.findOne({ userId: user._id });
      
      // If found, link it to user
      if (player) {
        user.playerId = player._id;
        user.profileComplete = true;
        await user.save();
        console.log('Auto-linked existing player to user:', player.name);
      }
    }

    const profile = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        profileComplete: user.profileComplete || !!player
      },
      player: player ? {
        _id: player._id,
        name: player.name,
        phone: player.phone,
        role: player.role,
        team: player.team,
        dateOfBirth: player.dateOfBirth,
        cricHeroesId: player.cricHeroesId,
        about: player.about,
        battingStyle: player.battingStyle,
        bowlingStyle: player.bowlingStyle
      } : null
    };

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// POST /api/profile - Create profile for new user
router.post('/', auth, async (req, res) => {
  console.log('POST /api/profile - Creating user profile:', req.body);
  try {
    const { name, phone, dateOfBirth, playerRole, team, cricHeroesId, about, battingStyle, bowlingStyle } = req.body;
    
    // Validate required fields
    if (!name || !phone || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone, and date of birth are required'
      });
    }

    let user = await User.findById(req.user._id);
    
    // If user not found and DISABLE_AUTH is true, use mock user for development
    if (!user && process.env.DISABLE_AUTH === 'true') {
      console.log('Using mock user for development mode');
      user = {
        _id: req.user._id,
        name: req.user.name || 'Dev User',
        email: req.user.email || 'dev@localhost',
        role: 'admin',
        isActive: true,
        playerId: null,
        profileComplete: false,
        save: async function() { return this; } // Mock save method
      };
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user already has a profile
    if (user.playerId) {
      return res.status(400).json({
        success: false,
        error: 'Profile already exists. Use PUT to update.'
      });
    }

    // Format and validate phone
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone || formattedPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Check if phone already exists
    const existingPlayer = await Player.findOne({ phone: formattedPhone });
    if (existingPlayer) {
      // If player exists but not linked to any user, link it
      if (!existingPlayer.userId) {
        existingPlayer.userId = user._id;
        existingPlayer.name = name.trim();
        existingPlayer.dateOfBirth = new Date(dateOfBirth);
        if (cricHeroesId) existingPlayer.cricHeroesId = cricHeroesId;
        if (about) existingPlayer.about = about;
        if (battingStyle) existingPlayer.battingStyle = battingStyle;
        if (bowlingStyle) existingPlayer.bowlingStyle = bowlingStyle;
        if (playerRole) existingPlayer.role = playerRole;
        await existingPlayer.save();

        user.playerId = existingPlayer._id;
        user.profileComplete = true;
        await user.save();

        return res.status(200).json({
          success: true,
          data: {
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              profileComplete: user.profileComplete
            },
            player: existingPlayer
          },
          message: 'Profile linked to existing player record'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: `Phone number already registered to another player: ${existingPlayer.name}`
      });
    }

    // Get user's active organization ID (required for multi-tenant data isolation)
    const organizationId = user.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'No active organization. Please join or create a team first.'
      });
    }

    // Create new player with organizationId for tenant isolation
    const player = await Player.create({
      name: name.trim(),
      phone: formattedPhone,
      dateOfBirth: new Date(dateOfBirth),
      role: playerRole || 'player',
      team: team || 'Mavericks XI',
      userId: user._id,
      cricHeroesId: cricHeroesId || null,
      about: about || null,
      battingStyle: battingStyle || null,
      bowlingStyle: bowlingStyle || null,
      isActive: true,
      organizationId: organizationId,  // Required for multi-tenant isolation
    });

    // Link player to user and mark profile as complete
    user.playerId = player._id;
    user.profileComplete = true;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileComplete: user.profileComplete
        },
        player
      },
      message: 'Profile created successfully'
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create profile'
    });
  }
});

// PUT /api/profile - Update existing profile (phone number cannot be changed)
router.put('/', auth, async (req, res) => {
  console.log('PUT /api/profile - Updating user profile:', req.body);
  try {
    const { name, dateOfBirth, playerRole, team, cricHeroesId, about, battingStyle, bowlingStyle } = req.body;
    
    let user = await User.findById(req.user._id);
    
    // If user not found and DISABLE_AUTH is true, use mock user for development
    if (!user && process.env.DISABLE_AUTH === 'true') {
      console.log('Using mock user for development mode');
      user = {
        _id: req.user._id,
        name: req.user.name || 'Dev User',
        email: req.user.email || 'dev@localhost',
        role: 'admin',
        isActive: true,
        playerId: null,
        profileComplete: false,
        save: async function() { return this; } // Mock save method
      };
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find player - either linked via playerId or via userId
    let player = null;
    if (user.playerId) {
      player = await Player.findById(user.playerId);
    }
    if (!player) {
      player = await Player.findOne({ userId: user._id });
    }
    
    if (!player) {
      return res.status(400).json({
        success: false,
        error: 'No profile exists. Use POST to create.'
      });
    }

    // Update fields (phone number is NOT updateable)
    if (name) player.name = name.trim();
    if (dateOfBirth) player.dateOfBirth = new Date(dateOfBirth);
    if (playerRole) player.role = playerRole;
    if (team) player.team = team;
    if (cricHeroesId !== undefined) player.cricHeroesId = cricHeroesId || null;
    if (about !== undefined) player.about = about || null;
    if (battingStyle !== undefined) player.battingStyle = battingStyle || null;
    if (bowlingStyle !== undefined) player.bowlingStyle = bowlingStyle || null;

    await player.save();

    // Ensure user is linked to player
    if (!user.playerId) {
      user.playerId = player._id;
      user.profileComplete = true;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileComplete: true
        },
        player
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile'
    });
  }
});

module.exports = router;
