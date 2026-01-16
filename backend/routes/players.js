const express = require('express');
const router = express.Router();
const Player = require('../models/Player.js');
const auth = require('../middleware/auth.js');
const { getOrCreatePlayer, formatPhoneNumber, updatePlayer: updatePlayerService } = require('../services/playerService');

// GET /api/players - Get all active players (for WhatsApp messaging)
// Supports search query parameter for filtering by name
router.get('/', auth, async (req, res) => {
  console.log('GET /api/players - Fetching players');
  try {
    const { search } = req.query;
    
    let query = { isActive: true };
    
    // If search term provided, filter by name starting with that term (case-insensitive)
    if (search && search.trim()) {
      query.name = { $regex: `^${search.trim()}`, $options: 'i' };
    }
    
    const players = await Player.find(query)
      .select('name phone role team notes createdAt')
      .sort({ name: 1 });
    
    // Return just the array for frontend compatibility
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({
      error: 'Failed to fetch players'
    });
  }
});

// GET /api/players/:id/profile - Get public player profile (sanitized, no sensitive data)
router.get('/:id/profile', auth, async (req, res) => {
  console.log(`GET /api/players/${req.params.id}/profile - Fetching player profile`);
  try {
    const player = await Player.findById(req.params.id).populate('userId', 'email');
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Calculate age from dateOfBirth (don't expose exact date)
    let age = null;
    if (player.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(player.dateOfBirth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Return sanitized public profile (exclude phone, notes, exact DOB)
    const publicProfile = {
      _id: player._id,
      name: player.name,
      role: player.role,
      team: player.team,
      about: player.about,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      cricHeroesId: player.cricHeroesId,
      age: age,
      isActive: player.isActive,
      email: player.userId?.email || null
    };

    res.json({
      success: true,
      data: publicProfile
    });
  } catch (error) {
    console.error('Error fetching player profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player profile'
    });
  }
});

// GET /api/players/:id - Get a specific player
router.get('/:id', auth, async (req, res) => {
  console.log(`GET /api/players/${req.params.id} - Fetching specific player`);
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player'
    });
  }
});

// POST /api/players - Add a new player
router.post('/', auth, async (req, res) => {
  console.log('POST /api/players - Adding new player:', req.body);
  try {
    const { name, phone, notes } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name and phone are required'
      });
    }
    
    // Use centralized player service
    const formattedPhone = formatPhoneNumber(phone);
    
    // Check if player with same phone already exists
    const existingPlayer = await Player.findOne({ phone: formattedPhone });
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        error: `Player already exists with same number. Name: "${existingPlayer.name}"`
      });
    }
    
    // Create new player using service
    const { player } = await getOrCreatePlayer({
      phone,
      name,
      notes,
      team: 'Mavericks XI'
    });
    
    res.status(201).json({
      success: true,
      data: player,
      message: 'Player added successfully'
    });
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add player'
    });
  }
});

// PUT /api/players/:id - Update a player
router.put('/:id', auth, async (req, res) => {
  console.log(`PUT /api/players/${req.params.id} - Updating player:`, req.body);
  try {
    const { name, phone, notes, team, role, isActive } = req.body;
    
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // If phone is being updated, check for duplicates
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      const existingPlayer = await Player.findOne({ 
        phone: formattedPhone,
        _id: { $ne: req.params.id }
      });
      
      if (existingPlayer) {
        return res.status(400).json({
          success: false,
          error: `Another player already exists with this number. Name: "${existingPlayer.name}"`
        });
      }
      player.phone = formattedPhone;
    }

    // Update fields if provided
    if (name) player.name = name;
    if (notes !== undefined) player.notes = notes;
    if (team) player.team = team;
    if (role) player.role = role;
    if (isActive !== undefined) player.isActive = isActive;

    await player.save();

    res.json({
      success: true,
      data: player,
      message: 'Player updated successfully'
    });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update player'
    });
  }
});

// DELETE /api/players/:id - Delete a player (soft delete by setting isActive: false)
router.delete('/:id', auth, async (req, res) => {
  console.log(`DELETE /api/players/${req.params.id} - Deleting player`);
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // We do a soft delete to preserve history if needed, but the UI filters by isActive: true
    player.isActive = false;
    await player.save();

    res.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete player'
    });
  }
});

module.exports = router;
