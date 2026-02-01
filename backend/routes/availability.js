const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const Match = require('../models/Match');
const Player = require('../models/Player');
const { auth, requireEditor } = require('../middleware/auth');
const { resolveTenant, requireOrgAdmin, requireOrgEditor } = require('../middleware/tenantResolver.js');
const { tenantQuery, tenantCreate } = require('../utils/tenantQuery.js');
const sseManager = require('../utils/sseManager');

// GET /api/availability/match/:matchId - Get all availability records for a match (optimized)
router.get('/match/:matchId', auth, resolveTenant, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Don't populate playerId - we already have playerName and playerPhone in the document
    // This reduces redundant data in response
    const availabilities = await Availability.find(tenantQuery(req, { matchId }))
      .select('_id matchId playerId playerName playerPhone response status respondedAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate statistics
    const stats = {
      total: availabilities.length,
      confirmed: availabilities.filter(a => a.response === 'yes').length,
      declined: availabilities.filter(a => a.response === 'no').length,
      tentative: availabilities.filter(a => a.response === 'tentative').length,
      pending: availabilities.filter(a => a.response === 'pending').length,
      responded: availabilities.filter(a => a.status === 'responded').length,
      noResponse: availabilities.filter(a => a.status !== 'responded').length
    };

    res.json({
      success: true,
      data: availabilities,
      stats
    });
  } catch (error) {
    console.error('Error fetching match availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability records'
    });
  }
});

// GET /api/availability/player/:playerId - Get availability history for a player (with pagination)
router.get('/player/:playerId', auth, resolveTenant, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const availabilities = await Availability.find(tenantQuery(req, { playerId }))
      .populate('matchId', 'date opponent ground')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const total = await Availability.countDocuments(tenantQuery(req, { playerId }));
    const hasMore = (pageNum * limitNum) < total;

    // Calculate player statistics
    const stats = {
      total: availabilities.length,
      confirmed: availabilities.filter(a => a.response === 'yes').length,
      declined: availabilities.filter(a => a.response === 'no').length,
      tentative: availabilities.filter(a => a.response === 'tentative').length,
      responseRate: availabilities.length > 0 
        ? ((availabilities.filter(a => a.status === 'responded').length / availabilities.length) * 100).toFixed(1)
        : 0
    };

    res.json({
      success: true,
      data: availabilities,
      stats,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching player availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player availability history'
    });
  }
});

// POST /api/availability - Create availability record(s)
router.post('/', auth, resolveTenant, requireOrgEditor, async (req, res) => {
  try {
    const { matchId, playerIds } = req.body;

    if (!matchId || !playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'matchId and playerIds array are required'
      });
    }

    // Verify match exists within tenant
    const match = await Match.findOne(tenantQuery(req, { _id: matchId }));
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Get player details within tenant
    const players = await Player.find(tenantQuery(req, { _id: { $in: playerIds } }));
    if (players.length !== playerIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some players not found'
      });
    }

    // Create availability records
    const availabilityRecords = [];
    for (const player of players) {
      // Check if record already exists within tenant
      const existing = await Availability.findOne(tenantQuery(req, { matchId, playerId: player._id }));
      
      if (!existing) {
        const record = await Availability.create(tenantCreate(req, {
          matchId,
          playerId: player._id,
          playerName: player.name,
          playerPhone: player.phone,
          response: 'pending',
          status: 'sent'
        }));
        availabilityRecords.push(record);
      } else {
        availabilityRecords.push(existing);
      }
    }

    // Update match statistics within tenant
    await Match.findOneAndUpdate(
      tenantQuery(req, { _id: matchId }),
      {
        availabilitySent: true,
        availabilitySentAt: new Date(),
        totalPlayersRequested: playerIds.length
      }
    );

    // Broadcast SSE event for new players added
    const newRecords = availabilityRecords.filter(r => r.response === 'pending');
    if (newRecords.length > 0) {
      sseManager.broadcastToMatch(matchId.toString(), {
        type: 'availability:new',
        matchId: matchId.toString(),
        newPlayers: newRecords.map(r => ({
          playerId: r.playerId?.toString(),
          playerName: r.playerName,
          playerPhone: r.playerPhone
        })),
        totalAdded: newRecords.length
      });
    }

    res.json({
      success: true,
      message: `Created ${availabilityRecords.length} availability records`,
      data: availabilityRecords
    });
  } catch (error) {
    console.error('Error creating availability records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create availability records'
    });
  }
});

// PUT /api/availability/:id - Update availability response
router.put('/:id', auth, resolveTenant, requireOrgEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, messageContent, incomingMessageId } = req.body;

    if (!response || !['yes', 'no', 'tentative'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Valid response (yes/no/tentative) is required'
      });
    }

    const availability = await Availability.findOne(tenantQuery(req, { _id: id }));
    if (!availability) {
      return res.status(404).json({
        success: false,
        error: 'Availability record not found'
      });
    }

    // Update availability record
    availability.response = response;
    availability.status = 'responded';
    availability.respondedAt = new Date();
    if (messageContent) availability.messageContent = messageContent;
    if (incomingMessageId) availability.incomingMessageId = incomingMessageId;
    await availability.save();

    // Update match statistics and squad
    const match = await Match.findOne(tenantQuery(req, { _id: availability.matchId }));
    if (match) {
      // Recalculate statistics
      const allAvailabilities = await Availability.find(tenantQuery(req, { matchId: match._id }));
      
      match.confirmedPlayers = allAvailabilities.filter(a => a.response === 'yes').length;
      match.declinedPlayers = allAvailabilities.filter(a => a.response === 'no').length;
      match.tentativePlayers = allAvailabilities.filter(a => a.response === 'tentative').length;
      match.noResponsePlayers = allAvailabilities.filter(a => a.response === 'pending').length;
      match.lastAvailabilityUpdate = new Date();

      // Update squad status
      if (match.confirmedPlayers >= 11) {
        match.squadStatus = 'full';
      } else if (match.confirmedPlayers > 0) {
        match.squadStatus = 'partial';
      } else {
        match.squadStatus = 'pending';
      }

      // Add to squad if confirmed
      if (response === 'yes') {
        const playerInSquad = match.squad.find(
          s => s.player.toString() === availability.playerId.toString()
        );
        
        if (!playerInSquad) {
          match.squad.push({
            player: availability.playerId,
            response: 'yes',
            respondedAt: new Date()
          });
        }
      } else {
        // Remove from squad if declined or tentative
        match.squad = match.squad.filter(
          s => s.player.toString() !== availability.playerId.toString()
        );
      }

      await match.save();

      // Broadcast SSE event for real-time updates
      sseManager.broadcastToMatch(match._id.toString(), {
        type: 'availability:update',
        matchId: match._id.toString(),
        playerId: availability.playerId?.toString(),
        playerName: availability.playerName,
        response: response,
        respondedAt: availability.respondedAt,
        stats: {
          confirmed: match.confirmedPlayers,
          declined: match.declinedPlayers,
          tentative: match.tentativePlayers,
          pending: match.noResponsePlayers
        }
      });
    }

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: availability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability'
    });
  }
});

// DELETE /api/availability/:id - Delete availability record
router.delete('/:id', auth, resolveTenant, requireOrgEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const availability = await Availability.findOne(tenantQuery(req, { _id: id }));
    if (!availability) {
      return res.status(404).json({
        success: false,
        error: 'Availability record not found'
      });
    }

    await Availability.findOneAndDelete(tenantQuery(req, { _id: id }));

    // Store info before deletion for SSE broadcast
    const matchId = availability.matchId;
    const playerId = availability.playerId;
    const playerName = availability.playerName;

    // Update match statistics
    const match = await Match.findOne(tenantQuery(req, { _id: matchId }));
    if (match) {
      const allAvailabilities = await Availability.find(tenantQuery(req, { matchId: match._id }));

      match.totalPlayersRequested = allAvailabilities.length;
      match.confirmedPlayers = allAvailabilities.filter(a => a.response === 'yes').length;
      match.declinedPlayers = allAvailabilities.filter(a => a.response === 'no').length;
      match.tentativePlayers = allAvailabilities.filter(a => a.response === 'tentative').length;
      match.noResponsePlayers = allAvailabilities.filter(a => a.response === 'pending').length;

      await match.save();

      // Broadcast SSE event for player removal
      sseManager.broadcastToMatch(match._id.toString(), {
        type: 'availability:delete',
        matchId: match._id.toString(),
        playerId: playerId?.toString(),
        playerName: playerName,
        stats: {
          confirmed: match.confirmedPlayers,
          declined: match.declinedPlayers,
          tentative: match.tentativePlayers,
          pending: match.noResponsePlayers,
          total: match.totalPlayersRequested
        }
      });
    }

    res.json({
      success: true,
      message: 'Availability record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete availability record'
    });
  }
});

// GET /api/availability/stats/summary - Get overall availability statistics
router.get('/stats/summary', auth, resolveTenant, async (req, res) => {
  try {
    const totalRecords = await Availability.countDocuments(tenantQuery(req, {}));
    const responded = await Availability.countDocuments(tenantQuery(req, { status: 'responded' }));
    const confirmed = await Availability.countDocuments(tenantQuery(req, { response: 'yes' }));
    const declined = await Availability.countDocuments(tenantQuery(req, { response: 'no' }));
    const tentative = await Availability.countDocuments(tenantQuery(req, { response: 'tentative' }));

    const stats = {
      totalRecords,
      responded,
      pending: totalRecords - responded,
      confirmed,
      declined,
      tentative,
      responseRate: totalRecords > 0 ? ((responded / totalRecords) * 100).toFixed(1) : 0,
      confirmationRate: totalRecords > 0 ? ((confirmed / totalRecords) * 100).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching availability stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability statistics'
    });
  }
});

module.exports = router;
