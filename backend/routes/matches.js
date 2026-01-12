const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Player = require('../models/Player');
const auth = require('../middleware/auth');

// Get matches summary (lightweight, for listing view)
router.get('/summary', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    // Fetch matches without populating squad.player (saves ~80% payload)
    const matches = await Match.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1, date: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();
    
    // Compute squad stats from match's availability fields (not squad array)
    const summaryMatches = matches.map(match => {
      // Use availability tracking fields if availabilitySent, otherwise use squad array as fallback
      const squadStats = match.availabilitySent ? {
        total: match.totalPlayersRequested || 0,
        yes: match.confirmedPlayers || 0,
        no: match.declinedPlayers || 0,
        tentative: match.tentativePlayers || 0,
        pending: match.noResponsePlayers || 0
      } : {
        total: match.squad?.length || 0,
        yes: match.squad?.filter(s => s.response === 'yes').length || 0,
        no: match.squad?.filter(s => s.response === 'no').length || 0,
        tentative: match.squad?.filter(s => s.response === 'tentative').length || 0,
        pending: match.squad?.filter(s => s.response === 'pending').length || 0
      };
      
      // Return match without squad array, but with computed stats
      const { squad, ...matchWithoutSquad } = match;
      return {
        ...matchWithoutSquad,
        squadStats
      };
    });
    
    const total = await Match.countDocuments(query);
    const hasMore = (pageNum * limitNum) < total;
    
    res.json({
      matches: summaryMatches,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all matches (optimized - squad only included when explicitly requested)
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, includeSquad = 'false' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const shouldIncludeSquad = includeSquad === 'true';
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    let matchQuery = Match.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1, date: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);
    
    // Only populate squad if explicitly requested (reduces payload by ~80%)
    if (shouldIncludeSquad) {
      matchQuery = matchQuery.populate('squad.player', 'name phone role team');
    }
    
    const matches = await matchQuery.lean();
    
    // If squad not requested, compute stats and exclude squad array
    let responseMatches = matches;
    if (!shouldIncludeSquad) {
      responseMatches = matches.map(match => {
        // Use availability tracking fields if availabilitySent, otherwise use squad array as fallback
        const squadStats = match.availabilitySent ? {
          total: match.totalPlayersRequested || 0,
          yes: match.confirmedPlayers || 0,
          no: match.declinedPlayers || 0,
          tentative: match.tentativePlayers || 0,
          pending: match.noResponsePlayers || 0
        } : {
          total: match.squad?.length || 0,
          yes: match.squad?.filter(s => s.response === 'yes').length || 0,
          no: match.squad?.filter(s => s.response === 'no').length || 0,
          tentative: match.squad?.filter(s => s.response === 'tentative').length || 0,
          pending: match.squad?.filter(s => s.response === 'pending').length || 0
        };
        const { squad, ...matchWithoutSquad } = match;
        return { ...matchWithoutSquad, squadStats };
      });
    }
    
    const total = await Match.countDocuments(query);
    const hasMore = (pageNum * limitNum) < total;
    
    res.json({
      matches: responseMatches,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single match
router.get('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('squad.player', 'name phone role team')
      .populate('createdBy', 'name email');
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new match
router.post('/', auth, async (req, res) => {
  try {
    const { date, slot, ground, time, opponent, cricHeroesMatchId, notes } = req.body;
    
    // Validate required fields
    if (!date || !slot || !ground) {
      return res.status(400).json({ 
        error: 'Date, slot, and ground are required fields' 
      });
    }
    
    // Generate match ID - find max existing matchId to avoid duplicates
    const lastMatch = await Match.findOne({ matchId: { $regex: /^MATCH-\d+$/ } })
      .sort({ matchId: -1 })
      .select('matchId')
      .lean();
    
    let nextNum = 1;
    if (lastMatch && lastMatch.matchId) {
      const lastNum = parseInt(lastMatch.matchId.replace('MATCH-', ''), 10);
      nextNum = lastNum + 1;
    }
    const matchId = `MATCH-${String(nextNum).padStart(4, '0')}`;
    
    // Create match
    const match = new Match({
      matchId,
      date,
      slot,
      ground,
      time: time || '',
      opponent: opponent || '',
      cricHeroesMatchId: cricHeroesMatchId || '',
      notes: notes || '',
      createdBy: req.user.id
    });
    
    await match.save();
    
    // Populate squad with all active players initially
    const activePlayers = await Player.find({ isActive: true });
    match.squad = activePlayers.map(player => ({
      player: player._id,
      response: 'pending',
      respondedAt: null,
      notes: ''
    }));
    
    await match.save();
    
    const populatedMatch = await Match.findById(match._id)
      .populate('squad.player', 'name phone role team')
      .populate('createdBy', 'name email');
    
    res.status(201).json(populatedMatch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update match
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, time, slot, opponent, ground, status, cricHeroesMatchId, notes } = req.body;
    
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Update allowed fields (matchId cannot be changed)
    if (date) match.date = date;
    if (time !== undefined) match.time = time;
    if (slot) match.slot = slot;
    if (opponent !== undefined) match.opponent = opponent;
    if (ground) match.ground = ground;
    if (status) match.status = status;
    if (cricHeroesMatchId !== undefined) match.cricHeroesMatchId = cricHeroesMatchId;
    if (notes !== undefined) match.notes = notes;
    
    await match.save();
    
    const updatedMatch = await Match.findById(match._id)
      .populate('squad.player', 'name phone role team')
      .populate('createdBy', 'name email');
    
    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update squad response (optimized - returns only updated member, not entire match)
router.put('/:id/squad/:playerId', auth, async (req, res) => {
  try {
    const { response, notes, returnFullMatch = false } = req.body;
    
    if (!['yes', 'no', 'tentative'].includes(response)) {
      return res.status(400).json({ error: 'Invalid response' });
    }
    
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Find and update player response
    const squadMember = match.squad.find(s => s.player.toString() === req.params.playerId);
    if (!squadMember) {
      return res.status(404).json({ error: 'Player not found in squad' });
    }
    
    squadMember.response = response;
    squadMember.respondedAt = new Date();
    if (notes !== undefined) squadMember.notes = notes;
    
    await match.save();
    
    // By default, return only the updated member (reduces payload by ~99%)
    // Set returnFullMatch=true in body to get full match data
    if (returnFullMatch) {
      const updatedMatch = await Match.findById(match._id)
        .populate('squad.player', 'name phone role team')
        .populate('createdBy', 'name email');
      return res.json(updatedMatch);
    }
    
    // Return minimal response with updated member data
    res.json({
      success: true,
      message: 'Squad response updated',
      data: {
        matchId: match._id,
        playerId: req.params.playerId,
        response: squadMember.response,
        respondedAt: squadMember.respondedAt,
        notes: squadMember.notes
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update squad responses
router.put('/:id/squad/bulk', auth, async (req, res) => {
  try {
    const { responses } = req.body; // [{ playerId, response, notes }]
    
    if (!Array.isArray(responses)) {
      return res.status(400).json({ error: 'Responses must be an array' });
    }
    
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Update each response
    responses.forEach(({ playerId, response, notes }) => {
      if (!['yes', 'no', 'tentative'].includes(response)) return;
      
      const squadMember = match.squad.find(s => s.player.toString() === playerId);
      if (squadMember) {
        squadMember.response = response;
        squadMember.respondedAt = new Date();
        if (notes !== undefined) squadMember.notes = notes;
      }
    });
    
    await match.save();
    
    const updatedMatch = await Match.findById(match._id)
      .populate('squad.player', 'name phone role team')
      .populate('createdBy', 'name email');
    
    res.json(updatedMatch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete match
router.delete('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    await Match.findByIdAndDelete(req.params.id);
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get match statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    const stats = {
      total: match.squad.length,
      yes: match.squad.filter(s => s.response === 'yes').length,
      no: match.squad.filter(s => s.response === 'no').length,
      tentative: match.squad.filter(s => s.response === 'tentative').length,
      pending: match.squad.filter(s => s.response === 'pending').length,
      responseRate: Math.round((match.squad.filter(s => s.response !== 'pending').length / match.squad.length) * 100)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
