const express = require('express');
const router = express.Router();
const Player = require('../models/Player.js');
const auth = require('../middleware/auth.js');

// GET /api/players - Get all active players (for WhatsApp messaging)
router.get('/', auth, async (req, res) => {
  try {
    const players = await Player.find({ isActive: true })
      .select('name phone role team')
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

// POST /api/players - Add a new player
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, notes } = req.body;
    
    // Check if player with same phone already exists
    const existingPlayer = await Player.findOne({ phone });
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        error: 'Player with this phone number already exists'
      });
    }
    
    // Create player with default values for missing fields
    const player = new Player({
      name,
      phone,
      role: 'player', // Default role
      team: notes || 'Unknown Team' // Use notes as team or default
    });
    
    await player.save();
    
    res.status(201).json({
      success: true,
      data: player,
      message: 'Player added successfully'
    });
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add player'
    });
  }
});

module.exports = router;
