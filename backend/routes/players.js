/**
 * @fileoverview Player Routes
 * 
 * API endpoints for player management within an organization.
 * All routes are tenant-scoped.
 * 
 * @module routes/players
 */

const express = require('express');
const router = express.Router();
const Player = require('../models/Player.js');
const Feedback = require('../models/Feedback.js');
const { auth, requireAdmin } = require('../middleware/auth.js');
const { resolveTenant, requireOrgAdmin, requireOrgEditor } = require('../middleware/tenantResolver.js');
const { tenantQuery, tenantCreate, validateTenantOwnership } = require('../utils/tenantQuery.js');
const { getOrCreatePlayer, formatPhoneNumber, updatePlayer: updatePlayerService } = require('../services/playerService');
const feedbackService = require('../services/feedbackService');

/**
 * GET /api/players
 * Get all active players for the current organization
 * Supports search query parameter for filtering by name
 */
router.get('/', auth, resolveTenant, async (req, res) => {
  console.log('GET /api/players - Fetching players for org:', req.organization?.name);
  try {
    const { search } = req.query;
    
    // Build tenant-scoped query
    let query = tenantQuery(req, { isActive: true });
    
    // If search term provided, filter by name starting with that term (case-insensitive)
    if (search && search.trim()) {
      query.name = { $regex: `^${search.trim()}`, $options: 'i' };
    }
    
    const players = await Player.find(query)
      .select('name phone role team notes createdAt organizationId')
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

/**
 * GET /api/players/:id/profile
 * Get public player profile (sanitized, no sensitive data)
 */
router.get('/:id/profile', auth, resolveTenant, async (req, res) => {
  console.log(`GET /api/players/${req.params.id}/profile - Fetching player profile`);
  try {
    // Find player within organization
    const player = await Player.findOne(tenantQuery(req, { _id: req.params.id }))
      .populate('userId', 'email');
    
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

/**
 * GET /api/players/:id
 * Get a specific player within the organization
 */
router.get('/:id', auth, resolveTenant, async (req, res) => {
  console.log(`GET /api/players/${req.params.id} - Fetching specific player`);
  try {
    // Find player within organization
    const player = await Player.findOne(tenantQuery(req, { _id: req.params.id }));
    
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

/**
 * POST /api/players
 * Add a new player to the organization
 */
router.post('/', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  console.log('POST /api/players - Adding new player:', req.body);
  try {
    const { name, phone, notes, team, role } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name and phone are required'
      });
    }
    
    // Use centralized player service
    const formattedPhone = formatPhoneNumber(phone);
    
    // Check if player with same phone already exists in this organization
    const existingPlayer = await Player.findOne(tenantQuery(req, { phone: formattedPhone }));
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        error: `Player already exists with same number. Name: "${existingPlayer.name}"`
      });
    }
    
    // Create new player with organization context
    const player = new Player(tenantCreate(req, {
      phone: formattedPhone,
      name: name.trim(),
      notes: notes || '',
      team: team || req.organization.name, // Default to org name
      role: role || 'player',
    }));
    
    await player.save();
    
    // Update organization stats
    req.organization.stats.playerCount = (req.organization.stats.playerCount || 0) + 1;
    await req.organization.save();
    
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

/**
 * PUT /api/players/:id
 * Update a player within the organization
 */
router.put('/:id', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  console.log(`PUT /api/players/${req.params.id} - Updating player:`, req.body);
  try {
    const { name, phone, notes, team, role, isActive } = req.body;
    
    // Find player within organization
    const player = await Player.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // If phone is being updated, check for duplicates within organization
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      const existingPlayer = await Player.findOne(tenantQuery(req, { 
        phone: formattedPhone,
        _id: { $ne: req.params.id }
      }));
      
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

/**
 * DELETE /api/players/:id
 * Soft delete a player (set isActive: false)
 */
router.delete('/:id', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  console.log(`DELETE /api/players/${req.params.id} - Deleting player`);
  try {
    // Find player within organization
    const player = await Player.findOne(tenantQuery(req, { _id: req.params.id }));
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

/**
 * GET /api/players/:id/feedback
 * Get player's feedback history within the organization
 * Uses unified feedbackService for role-based redaction
 */
router.get('/:id/feedback', auth, resolveTenant, async (req, res) => {
  console.log(`GET /api/players/${req.params.id}/feedback - Fetching player feedback history`);
  try {
    const { page = 1, limit = 20 } = req.query;
    const playerId = req.params.id;
    const userRole = req.organizationRole || 'viewer';

    // Find player within organization
    const player = await Player.findOne(tenantQuery(req, { _id: playerId }));
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Build query to find feedback by playerId OR by playerName (case-insensitive)
    // Include organization filter
    const query = tenantQuery(req, {
      $or: [
        { playerId: player._id },
        { playerName: { $regex: new RegExp(`^${player.name}$`, 'i') } }
      ]
    });

    // Use unified service for stats and feedback with role-based redaction
    const stats = await feedbackService.getPlayerFeedbackStats(query);
    const { feedback, pagination } = await feedbackService.getPlayerFeedback(
      query,
      { page, limit },
      userRole
    );

    res.json({
      success: true,
      player: {
        _id: player._id,
        name: player.name
      },
      stats,
      feedback,
      pagination
    });
  } catch (error) {
    console.error('Error fetching player feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player feedback'
    });
  }
});

module.exports = router;
