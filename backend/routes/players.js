const express = require('express');
const router = express.Router();
const Player = require('../models/Player.js');
const auth = require('../middleware/auth.js');

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
    
    // Check if player with same phone already exists
    const existingPlayer = await Player.findOne({ phone });
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        error: `Player already exists with same number. Name: "${existingPlayer.name}"`
      });
    }
    
    // Create player
    const player = new Player({
      name,
      phone,
      role: 'player', // Default role
      team: 'Unknown Team',
      notes
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

    // Update fields if provided
    if (name) player.name = name;
    if (phone) player.phone = phone;
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
      error: 'Failed to update player'
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
