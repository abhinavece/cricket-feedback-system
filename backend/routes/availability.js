const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const Match = require('../models/Match');
const Player = require('../models/Player');
const auth = require('../middleware/auth');

// GET /api/availability/match/:matchId - Get all availability records for a match
router.get('/match/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;

    const availabilities = await Availability.find({ matchId })
      .populate('playerId', 'name phone')
      .sort({ createdAt: -1 });

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

// GET /api/availability/player/:playerId - Get availability history for a player
router.get('/player/:playerId', auth, async (req, res) => {
  try {
    const { playerId } = req.params;

    const availabilities = await Availability.find({ playerId })
      .populate('matchId', 'date opponent ground')
      .sort({ createdAt: -1 })
      .limit(20);

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
      stats
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
router.post('/', auth, async (req, res) => {
  try {
    const { matchId, playerIds } = req.body;

    if (!matchId || !playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'matchId and playerIds array are required'
      });
    }

    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Get player details
    const players = await Player.find({ _id: { $in: playerIds } });
    if (players.length !== playerIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some players not found'
      });
    }

    // Create availability records
    const availabilityRecords = [];
    for (const player of players) {
      // Check if record already exists
      const existing = await Availability.findOne({ matchId, playerId: player._id });
      
      if (!existing) {
        const record = await Availability.create({
          matchId,
          playerId: player._id,
          playerName: player.name,
          playerPhone: player.phone,
          response: 'pending',
          status: 'sent'
        });
        availabilityRecords.push(record);
      } else {
        availabilityRecords.push(existing);
      }
    }

    // Update match statistics
    await Match.findByIdAndUpdate(matchId, {
      availabilitySent: true,
      availabilitySentAt: new Date(),
      totalPlayersRequested: playerIds.length
    });

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
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, messageContent, incomingMessageId } = req.body;

    if (!response || !['yes', 'no', 'tentative'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Valid response (yes/no/tentative) is required'
      });
    }

    const availability = await Availability.findById(id);
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
    const match = await Match.findById(availability.matchId);
    if (match) {
      // Recalculate statistics
      const allAvailabilities = await Availability.find({ matchId: match._id });
      
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
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const availability = await Availability.findById(id);
    if (!availability) {
      return res.status(404).json({
        success: false,
        error: 'Availability record not found'
      });
    }

    await Availability.findByIdAndDelete(id);

    // Update match statistics
    const match = await Match.findById(availability.matchId);
    if (match) {
      const allAvailabilities = await Availability.find({ matchId: match._id });
      
      match.totalPlayersRequested = allAvailabilities.length;
      match.confirmedPlayers = allAvailabilities.filter(a => a.response === 'yes').length;
      match.declinedPlayers = allAvailabilities.filter(a => a.response === 'no').length;
      match.tentativePlayers = allAvailabilities.filter(a => a.response === 'tentative').length;
      match.noResponsePlayers = allAvailabilities.filter(a => a.response === 'pending').length;
      
      await match.save();
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
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalRecords = await Availability.countDocuments();
    const responded = await Availability.countDocuments({ status: 'responded' });
    const confirmed = await Availability.countDocuments({ response: 'yes' });
    const declined = await Availability.countDocuments({ response: 'no' });
    const tentative = await Availability.countDocuments({ response: 'tentative' });

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
