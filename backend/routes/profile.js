const express = require('express');
const router = express.Router();
const Player = require('../models/Player.js');
const User = require('../models/User.js');
const auth = require('../middleware/auth.js');
const { formatPhoneNumber } = require('../services/playerService');

// GET /api/profile - Get current user's profile
router.get('/', auth, async (req, res) => {
  console.log('GET /api/profile - Fetching user profile');
  try {
    const user = await User.findById(req.user._id).populate('playerId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const profile = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        profileComplete: user.profileComplete
      },
      player: user.playerId ? {
        _id: user.playerId._id,
        name: user.playerId.name,
        phone: user.playerId.phone,
        role: user.playerId.role,
        team: user.playerId.team,
        cricHeroesId: user.playerId.cricHeroesId,
        about: user.playerId.about,
        battingStyle: user.playerId.battingStyle,
        bowlingStyle: user.playerId.bowlingStyle
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
    const { name, phone, playerRole, team, cricHeroesId, about, battingStyle, bowlingStyle } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name and phone are required'
      });
    }

    const user = await User.findById(req.user._id);
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

    // Create new player
    const player = await Player.create({
      name: name.trim(),
      phone: formattedPhone,
      role: playerRole || 'player',
      team: team || 'Mavericks XI',
      userId: user._id,
      cricHeroesId: cricHeroesId || null,
      about: about || null,
      battingStyle: battingStyle || null,
      bowlingStyle: bowlingStyle || null,
      isActive: true
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

// PUT /api/profile - Update existing profile
router.put('/', auth, async (req, res) => {
  console.log('PUT /api/profile - Updating user profile:', req.body);
  try {
    const { name, phone, playerRole, team, cricHeroesId, about, battingStyle, bowlingStyle } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.playerId) {
      return res.status(400).json({
        success: false,
        error: 'No profile exists. Use POST to create.'
      });
    }

    const player = await Player.findById(user.playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player record not found'
      });
    }

    // If phone is being updated, validate it
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      if (!formattedPhone || formattedPhone.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format'
        });
      }

      // Check if new phone already exists for another player
      const existingPlayer = await Player.findOne({ 
        phone: formattedPhone,
        _id: { $ne: player._id }
      });
      
      if (existingPlayer) {
        return res.status(400).json({
          success: false,
          error: `Phone number already registered to another player: ${existingPlayer.name}`
        });
      }

      player.phone = formattedPhone;
    }

    // Update fields
    if (name) player.name = name.trim();
    if (playerRole) player.role = playerRole;
    if (team) player.team = team;
    if (cricHeroesId !== undefined) player.cricHeroesId = cricHeroesId || null;
    if (about !== undefined) player.about = about || null;
    if (battingStyle !== undefined) player.battingStyle = battingStyle || null;
    if (bowlingStyle !== undefined) player.bowlingStyle = bowlingStyle || null;

    await player.save();

    res.json({
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
