/**
 * @fileoverview Auction Trade Routes
 * 
 * Post-auction player-for-player swap trades.
 * Team-initiated (via team JWT), admin-approved/rejected/executed.
 * Max trades per team configurable (default 2), 48-hour window.
 * 
 * Routes mounted at: /api/v1/auctions/:auctionId/trades
 * 
 * @module routes/auctionTrade
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { auth } = require('../middleware/auth');
const { resolveAuctionAdmin, resolveAuctionTeam } = require('../middleware/auctionAuth');
const Auction = require('../models/Auction');
const AuctionTeam = require('../models/AuctionTeam');
const AuctionPlayer = require('../models/AuctionPlayer');
const AuctionTrade = require('../models/AuctionTrade');
const ActionEvent = require('../models/ActionEvent');

// ============================================================
// PROPOSE TRADE (Team-initiated)
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/trades
 * Propose a player-for-player swap trade.
 * Auth: Team JWT (resolveAuctionTeam)
 * 
 * Body: {
 *   toTeamId: ObjectId,
 *   fromPlayerIds: [ObjectId],  // players from proposing team
 *   toPlayerIds: [ObjectId],    // players from receiving team
 *   message?: string            // optional message to admin
 * }
 */
router.post('/', resolveAuctionTeam, async (req, res) => {
  try {
    const { toTeamId, fromPlayerIds, toPlayerIds, message } = req.body;
    const auction = req.auction;
    const fromTeam = req.auctionTeam;

    // --- Validate auction is in trade_window ---
    if (auction.status !== 'trade_window') {
      return res.status(400).json({
        success: false,
        error: auction.status === 'completed'
          ? 'Trade window has not been opened yet. Ask the admin to open the trade window.'
          : `Trades are only allowed during the trade window. Current status: ${auction.status}`,
      });
    }

    // --- Check trade window hasn't expired ---
    if (auction.tradeWindowEndsAt && new Date() > auction.tradeWindowEndsAt) {
      return res.status(400).json({
        success: false,
        error: 'Trade window has expired',
      });
    }

    // --- Validate input ---
    if (!toTeamId || !fromPlayerIds?.length || !toPlayerIds?.length) {
      return res.status(400).json({
        success: false,
        error: 'toTeamId, fromPlayerIds (array), and toPlayerIds (array) are required',
      });
    }

    if (fromTeam._id.toString() === toTeamId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot propose a trade with your own team',
      });
    }

    // --- Check max trades per team ---
    const maxTrades = auction.config.maxTradesPerTeam || 2;
    const existingFromTrades = await AuctionTrade.countDocuments({
      auctionId: auction._id,
      $or: [{ fromTeamId: fromTeam._id }, { toTeamId: fromTeam._id }],
      status: { $in: ['proposed', 'approved', 'executed'] },
    });

    if (existingFromTrades >= maxTrades) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${maxTrades} trades allowed per team. You have already used ${existingFromTrades}.`,
      });
    }

    // --- Validate receiving team exists ---
    const toTeam = await AuctionTeam.findOne({
      _id: toTeamId,
      auctionId: auction._id,
      isActive: true,
    });
    if (!toTeam) {
      return res.status(404).json({
        success: false,
        error: 'Receiving team not found',
      });
    }

    // --- Check max trades for receiving team ---
    const existingToTrades = await AuctionTrade.countDocuments({
      auctionId: auction._id,
      $or: [{ fromTeamId: toTeam._id }, { toTeamId: toTeam._id }],
      status: { $in: ['proposed', 'approved', 'executed'] },
    });

    if (existingToTrades >= maxTrades) {
      return res.status(400).json({
        success: false,
        error: `The receiving team has already reached the maximum of ${maxTrades} trades.`,
      });
    }

    // --- Validate players belong to correct teams ---
    const fromPlayers = await AuctionPlayer.find({
      _id: { $in: fromPlayerIds },
      auctionId: auction._id,
      soldTo: fromTeam._id,
      status: 'sold',
      isDisqualified: false,
    });

    if (fromPlayers.length !== fromPlayerIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more players from your team are invalid (not sold to your team or disqualified)',
      });
    }

    const toPlayers = await AuctionPlayer.find({
      _id: { $in: toPlayerIds },
      auctionId: auction._id,
      soldTo: toTeam._id,
      status: 'sold',
      isDisqualified: false,
    });

    if (toPlayers.length !== toPlayerIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more players from the receiving team are invalid (not sold to them or disqualified)',
      });
    }

    // --- Check players are not already in a pending/approved trade ---
    const allPlayerIds = [...fromPlayerIds, ...toPlayerIds];
    const conflictingTrades = await AuctionTrade.find({
      auctionId: auction._id,
      status: { $in: ['proposed', 'approved'] },
      $or: [
        { 'fromPlayers.playerId': { $in: allPlayerIds } },
        { 'toPlayers.playerId': { $in: allPlayerIds } },
      ],
    });

    if (conflictingTrades.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'One or more players are already involved in a pending or approved trade',
      });
    }

    // --- Create trade proposal ---
    const trade = await AuctionTrade.create({
      auctionId: auction._id,
      fromTeamId: fromTeam._id,
      toTeamId: toTeam._id,
      fromPlayers: fromPlayers.map(p => ({ playerId: p._id, name: p.name })),
      toPlayers: toPlayers.map(p => ({ playerId: p._id, name: p.name })),
      proposedBy: null, // team-initiated (no user ID, team JWT)
      status: 'proposed',
      publicAnnouncement: message || '',
    });

    // --- Notify via Socket.IO ---
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      ns.to(`admin:${auction._id}`).emit('trade:proposed', {
        tradeId: trade._id,
        fromTeam: { _id: fromTeam._id, name: fromTeam.name, shortName: fromTeam.shortName },
        toTeam: { _id: toTeam._id, name: toTeam.name, shortName: toTeam.shortName },
        fromPlayers: trade.fromPlayers,
        toPlayers: trade.toPlayers,
      });
    }

    res.status(201).json({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error('Propose trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIST TRADES (Admin or Team)
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/trades
 * List all trades for an auction.
 * Auth: Admin JWT (auth + resolveAuctionAdmin)
 */
router.get('/', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { auctionId: req.auction._id };
    if (status) filter.status = status;

    const trades = await AuctionTrade.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with team names
    const teamIds = [...new Set(trades.flatMap(t => [t.fromTeamId.toString(), t.toTeamId.toString()]))];
    const teams = await AuctionTeam.find({ _id: { $in: teamIds } })
      .select('name shortName primaryColor')
      .lean();
    const teamMap = {};
    teams.forEach(t => { teamMap[t._id.toString()] = t; });

    const enriched = trades.map(t => ({
      ...t,
      fromTeam: teamMap[t.fromTeamId.toString()] || { name: 'Unknown' },
      toTeam: teamMap[t.toTeamId.toString()] || { name: 'Unknown' },
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('List trades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/auctions/:auctionId/trades/my-trades
 * List trades involving the authenticated team.
 * Auth: Team JWT (resolveAuctionTeam)
 */
router.get('/my-trades', resolveAuctionTeam, async (req, res) => {
  try {
    const teamId = req.auctionTeam._id;
    const trades = await AuctionTrade.find({
      auctionId: req.auction._id,
      $or: [{ fromTeamId: teamId }, { toTeamId: teamId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich
    const teamIds = [...new Set(trades.flatMap(t => [t.fromTeamId.toString(), t.toTeamId.toString()]))];
    const teams = await AuctionTeam.find({ _id: { $in: teamIds } })
      .select('name shortName primaryColor')
      .lean();
    const teamMap = {};
    teams.forEach(t => { teamMap[t._id.toString()] = t; });

    const enriched = trades.map(t => ({
      ...t,
      fromTeam: teamMap[t.fromTeamId.toString()] || { name: 'Unknown' },
      toTeam: teamMap[t.toTeamId.toString()] || { name: 'Unknown' },
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('List my trades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// APPROVE TRADE (Admin)
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/trades/:tradeId/approve
 * Approve a proposed trade. Does NOT execute yet.
 * Auth: Admin JWT
 */
router.patch('/:tradeId/approve', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const trade = await AuctionTrade.findOne({
      _id: req.params.tradeId,
      auctionId: req.auction._id,
    });

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (trade.status !== 'proposed') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve a trade with status '${trade.status}'. Must be 'proposed'.`,
      });
    }

    trade.status = 'approved';
    trade.approvedBy = req.user._id;
    await trade.save();

    // Notify via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      ns.to(`auction:${req.auction._id}`).emit('trade:approved', {
        tradeId: trade._id,
        fromTeamId: trade.fromTeamId,
        toTeamId: trade.toTeamId,
      });
    }

    res.json({ success: true, data: trade });
  } catch (error) {
    console.error('Approve trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// REJECT TRADE (Admin)
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/trades/:tradeId/reject
 * Reject a proposed trade.
 * Auth: Admin JWT
 * Body: { reason?: string }
 */
router.patch('/:tradeId/reject', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const trade = await AuctionTrade.findOne({
      _id: req.params.tradeId,
      auctionId: req.auction._id,
    });

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (!['proposed', 'approved'].includes(trade.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot reject a trade with status '${trade.status}'.`,
      });
    }

    trade.status = 'rejected';
    trade.rejectedBy = req.user._id;
    trade.rejectionReason = req.body.reason || '';
    await trade.save();

    // Notify via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      ns.to(`auction:${req.auction._id}`).emit('trade:rejected', {
        tradeId: trade._id,
        reason: trade.rejectionReason,
      });
    }

    res.json({ success: true, data: trade });
  } catch (error) {
    console.error('Reject trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// EXECUTE TRADE (Admin — performs the actual player swap)
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/trades/:tradeId/execute
 * Execute an approved trade: swap players between teams.
 * Auth: Admin JWT
 * 
 * Execution steps:
 * 1. Validate trade is approved
 * 2. Verify players still belong to their respective teams (no conflict)
 * 3. Swap player ownership (soldTo) in AuctionPlayer
 * 4. Update team player lists in AuctionTeam
 * 5. Log ActionEvent for undo support
 * 6. Broadcast to all connected clients
 */
router.post('/:tradeId/execute', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const trade = await AuctionTrade.findOne({
      _id: req.params.tradeId,
      auctionId: req.auction._id,
    });

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (trade.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: `Cannot execute a trade with status '${trade.status}'. Must be 'approved'.`,
      });
    }

    // Verify auction is still in trade_window
    if (req.auction.status !== 'trade_window') {
      return res.status(400).json({
        success: false,
        error: 'Trade window is no longer active',
      });
    }

    const fromTeam = await AuctionTeam.findById(trade.fromTeamId);
    const toTeam = await AuctionTeam.findById(trade.toTeamId);

    if (!fromTeam || !toTeam) {
      return res.status(404).json({ success: false, error: 'One or both teams not found' });
    }

    // --- Re-validate player ownership ---
    const fromPlayerIds = trade.fromPlayers.map(p => p.playerId);
    const toPlayerIds = trade.toPlayers.map(p => p.playerId);

    const fromPlayers = await AuctionPlayer.find({
      _id: { $in: fromPlayerIds },
      soldTo: fromTeam._id,
      status: 'sold',
      isDisqualified: false,
    });

    const toPlayers = await AuctionPlayer.find({
      _id: { $in: toPlayerIds },
      soldTo: toTeam._id,
      status: 'sold',
      isDisqualified: false,
    });

    if (fromPlayers.length !== fromPlayerIds.length || toPlayers.length !== toPlayerIds.length) {
      trade.status = 'rejected';
      trade.rejectionReason = 'Player ownership changed since trade was proposed';
      await trade.save();
      return res.status(409).json({
        success: false,
        error: 'Player ownership has changed since the trade was proposed. Trade has been auto-rejected.',
      });
    }

    // --- Execute the swap ---

    // Move fromPlayers → toTeam
    await AuctionPlayer.updateMany(
      { _id: { $in: fromPlayerIds } },
      { $set: { soldTo: toTeam._id } }
    );

    // Move toPlayers → fromTeam
    await AuctionPlayer.updateMany(
      { _id: { $in: toPlayerIds } },
      { $set: { soldTo: fromTeam._id } }
    );

    // Update fromTeam.players array
    for (const fp of fromPlayers) {
      const idx = fromTeam.players.findIndex(p => p.playerId.equals(fp._id));
      if (idx !== -1) fromTeam.players.splice(idx, 1);
    }
    for (const tp of toPlayers) {
      fromTeam.players.push({
        playerId: tp._id,
        boughtAt: tp.soldAmount,
        round: tp.soldInRound,
        boughtTimestamp: new Date(),
      });
    }
    await fromTeam.save();

    // Update toTeam.players array
    for (const tp of toPlayers) {
      const idx = toTeam.players.findIndex(p => p.playerId.equals(tp._id));
      if (idx !== -1) toTeam.players.splice(idx, 1);
    }
    for (const fp of fromPlayers) {
      toTeam.players.push({
        playerId: fp._id,
        boughtAt: fp.soldAmount,
        round: fp.soldInRound,
        boughtTimestamp: new Date(),
      });
    }
    await toTeam.save();

    // Mark trade as executed
    trade.status = 'executed';
    trade.executedAt = new Date();
    trade.publicAnnouncement = `Trade executed: ${fromTeam.shortName} sends ${trade.fromPlayers.map(p => p.name).join(', ')} to ${toTeam.shortName} for ${trade.toPlayers.map(p => p.name).join(', ')}`;
    await trade.save();

    // Log ActionEvent for undo support
    const lastEvent = await ActionEvent.findOne({ auctionId: req.auction._id })
      .sort({ sequenceNumber: -1 });
    const seq = (lastEvent?.sequenceNumber || 0) + 1;

    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: seq,
      type: 'TRADE_EXECUTED',
      payload: {
        tradeId: trade._id,
        fromTeamId: fromTeam._id,
        toTeamId: toTeam._id,
        fromPlayerIds,
        toPlayerIds,
      },
      reversalPayload: {
        tradeId: trade._id,
        fromTeamId: fromTeam._id,
        toTeamId: toTeam._id,
        fromPlayerIds: toPlayerIds,
        toPlayerIds: fromPlayerIds,
      },
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: trade.publicAnnouncement,
    });

    // Broadcast trade execution
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      ns.to(`auction:${req.auction._id}`).emit('trade:executed', {
        tradeId: trade._id,
        fromTeam: { _id: fromTeam._id, name: fromTeam.name, shortName: fromTeam.shortName },
        toTeam: { _id: toTeam._id, name: toTeam.name, shortName: toTeam.shortName },
        fromPlayers: trade.fromPlayers,
        toPlayers: trade.toPlayers,
        announcement: trade.publicAnnouncement,
      });
    }

    res.json({
      success: true,
      data: trade,
      message: trade.publicAnnouncement,
    });
  } catch (error) {
    console.error('Execute trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET TEAM PLAYERS (Team-accessible — for trade proposal UI)
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/trades/team-players/:teamId
 * Get sold players for a specific team. Used by trade proposal UI.
 * Auth: Team JWT (resolveAuctionTeam)
 */
router.get('/team-players/:teamId', resolveAuctionTeam, async (req, res) => {
  try {
    const players = await AuctionPlayer.find({
      auctionId: req.auction._id,
      soldTo: req.params.teamId,
      status: 'sold',
      isDisqualified: false,
    })
      .select('name role soldAmount playerNumber customFields')
      .sort({ playerNumber: 1 })
      .lean();

    res.json({ success: true, data: players });
  } catch (error) {
    console.error('Get team players error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
