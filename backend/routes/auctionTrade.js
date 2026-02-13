/**
 * @fileoverview Auction Trade Routes — Bilateral Negotiation
 * 
 * Post-auction player trades with smart asymmetric player locking.
 * Flow: Initiator proposes → counterparty accepts/rejects → admin approves+executes.
 * Configurable purse settlement based on player purchase prices.
 * 
 * Locking rules:
 * - Initiator's players lock immediately on propose (can't be in other trades)
 * - Counterparty's requested players remain FREE until counterparty accepts
 * - Auto-cancellation when a requested player gets committed elsewhere
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
// HELPERS
// ============================================================

/**
 * Check if a player is locked (in an active trade as initiator player,
 * or in a both_agreed trade as counterparty player).
 * Returns the conflicting trade if locked, null if free.
 */
async function getPlayerLock(auctionId, playerId) {
  // Locked as initiator player in pending_counterparty or both_agreed
  const asInitiator = await AuctionTrade.findOne({
    auctionId,
    'initiatorPlayers.playerId': playerId,
    status: { $in: ['pending_counterparty', 'both_agreed'] },
  }).lean();
  if (asInitiator) return asInitiator;

  // Locked as counterparty player in both_agreed only
  const asCounterparty = await AuctionTrade.findOne({
    auctionId,
    'counterpartyPlayers.playerId': playerId,
    status: 'both_agreed',
  }).lean();
  if (asCounterparty) return asCounterparty;

  return null;
}

/**
 * Auto-cancel all pending_counterparty trades that REQUEST any of the
 * given player IDs as counterparty players.
 * Called when those players become committed (locked).
 */
async function autoCancelConflictingTrades(auctionId, lockedPlayerIds, excludeTradeId, io) {
  const conflicting = await AuctionTrade.find({
    auctionId,
    _id: { $ne: excludeTradeId },
    status: 'pending_counterparty',
    'counterpartyPlayers.playerId': { $in: lockedPlayerIds },
  });

  const cancelledTradeIds = [];
  for (const trade of conflicting) {
    const conflictingNames = trade.counterpartyPlayers
      .filter(p => lockedPlayerIds.some(id => id.toString() === p.playerId.toString()))
      .map(p => p.name);

    trade.status = 'cancelled';
    trade.cancellationReason = `Player(s) ${conflictingNames.join(', ')} committed to another trade`;
    await trade.save();
    cancelledTradeIds.push(trade._id);

    // Notify initiator team
    if (io) {
      const ns = io.of('/auction');
      ns.to(`team:${auctionId}:${trade.initiatorTeamId}`).emit('trade:cancelled', {
        tradeId: trade._id,
        reason: trade.cancellationReason,
      });
      ns.to(`admin:${auctionId}`).emit('trade:cancelled', {
        tradeId: trade._id,
        reason: trade.cancellationReason,
      });
    }
  }

  return cancelledTradeIds;
}

/**
 * Enrich trades with team info for API responses.
 */
async function enrichTradesWithTeams(trades) {
  if (!trades.length) return [];

  // Filter out legacy trades that lack bilateral fields (old fromTeamId/toTeamId schema)
  const validTrades = trades.filter(t => t.initiatorTeamId && t.counterpartyTeamId);

  if (!validTrades.length) return [];

  const teamIds = [...new Set(validTrades.flatMap(t => [
    t.initiatorTeamId.toString(),
    t.counterpartyTeamId.toString(),
  ]))];
  const teams = await AuctionTeam.find({ _id: { $in: teamIds } })
    .select('name shortName primaryColor purseRemaining')
    .lean();
  const teamMap = {};
  teams.forEach(t => { teamMap[t._id.toString()] = t; });

  return validTrades.map(t => ({
    ...t,
    initiatorTeam: teamMap[t.initiatorTeamId.toString()] || { name: 'Unknown' },
    counterpartyTeam: teamMap[t.counterpartyTeamId.toString()] || { name: 'Unknown' },
  }));
}

/**
 * Calculate financial settlement for a trade.
 */
function calculateSettlement(initiatorPlayers, counterpartyPlayers) {
  const initiatorTotal = initiatorPlayers.reduce((sum, p) => sum + (p.soldAmount || 0), 0);
  const counterpartyTotal = counterpartyPlayers.reduce((sum, p) => sum + (p.soldAmount || 0), 0);
  const diff = Math.abs(initiatorTotal - counterpartyTotal);

  let direction = 'even';
  if (initiatorTotal < counterpartyTotal) direction = 'initiator_pays';
  else if (initiatorTotal > counterpartyTotal) direction = 'counterparty_pays';

  return {
    initiatorTotalValue: initiatorTotal,
    counterpartyTotalValue: counterpartyTotal,
    settlementAmount: diff,
    settlementDirection: direction,
  };
}

// ============================================================
// PROPOSE TRADE (Team-initiated)
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/trades
 * Propose a bilateral trade. Initiator's players lock immediately.
 * Counterparty's requested players remain free until accepted.
 * Auth: Team JWT (resolveAuctionTeam)
 * 
 * Body: {
 *   counterpartyTeamId: ObjectId,
 *   initiatorPlayerIds: [ObjectId],     // players from proposing team
 *   counterpartyPlayerIds: [ObjectId],  // players from receiving team
 *   message?: string
 * }
 */
router.post('/', resolveAuctionTeam, async (req, res) => {
  try {
    const { counterpartyTeamId, initiatorPlayerIds, counterpartyPlayerIds, message } = req.body;
    const auction = req.auction;
    const initiatorTeam = req.auctionTeam;

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
      return res.status(400).json({ success: false, error: 'Trade window has expired' });
    }

    // --- Validate input ---
    if (!counterpartyTeamId || !initiatorPlayerIds?.length || !counterpartyPlayerIds?.length) {
      return res.status(400).json({
        success: false,
        error: 'counterpartyTeamId, initiatorPlayerIds (array), and counterpartyPlayerIds (array) are required',
      });
    }

    if (initiatorTeam._id.toString() === counterpartyTeamId) {
      return res.status(400).json({ success: false, error: 'Cannot propose a trade with your own team' });
    }

    // --- Check max executed trades per team (only executed count) ---
    const maxTrades = auction.config.maxTradesPerTeam || 2;
    const myExecutedTrades = await AuctionTrade.countDocuments({
      auctionId: auction._id,
      $or: [{ initiatorTeamId: initiatorTeam._id }, { counterpartyTeamId: initiatorTeam._id }],
      status: 'executed',
    });
    if (myExecutedTrades >= maxTrades) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${maxTrades} executed trades allowed per team. You have already used ${myExecutedTrades}.`,
      });
    }

    // --- Validate counterparty team ---
    const counterpartyTeam = await AuctionTeam.findOne({
      _id: counterpartyTeamId,
      auctionId: auction._id,
      isActive: true,
    });
    if (!counterpartyTeam) {
      return res.status(404).json({ success: false, error: 'Counterparty team not found' });
    }

    // --- Check max executed trades for counterparty ---
    const cpExecutedTrades = await AuctionTrade.countDocuments({
      auctionId: auction._id,
      $or: [{ initiatorTeamId: counterpartyTeam._id }, { counterpartyTeamId: counterpartyTeam._id }],
      status: 'executed',
    });
    if (cpExecutedTrades >= maxTrades) {
      return res.status(400).json({
        success: false,
        error: `The counterparty team has already reached the maximum of ${maxTrades} executed trades.`,
      });
    }

    // --- Validate initiator's players ---
    const initPlayers = await AuctionPlayer.find({
      _id: { $in: initiatorPlayerIds },
      auctionId: auction._id,
      soldTo: initiatorTeam._id,
      status: 'sold',
      isDisqualified: false,
    }).lean();

    if (initPlayers.length !== initiatorPlayerIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more of your players are invalid (not sold to your team or disqualified)',
      });
    }

    // --- Validate counterparty's players ---
    const cpPlayers = await AuctionPlayer.find({
      _id: { $in: counterpartyPlayerIds },
      auctionId: auction._id,
      soldTo: counterpartyTeam._id,
      status: 'sold',
      isDisqualified: false,
    }).lean();

    if (cpPlayers.length !== counterpartyPlayerIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more counterparty players are invalid (not sold to them or disqualified)',
      });
    }

    // --- Check initiator's players are NOT locked ---
    for (const p of initPlayers) {
      const lock = await getPlayerLock(auction._id, p._id);
      if (lock) {
        return res.status(409).json({
          success: false,
          error: `Player "${p.name}" is already in an active trade and cannot be offered`,
        });
      }
    }

    // NOTE: counterparty players are NOT checked for locks (they're free until accepted)

    // --- Calculate financial settlement ---
    const initiatorMapped = initPlayers.map(p => ({
      playerId: p._id, name: p.name, role: p.role, soldAmount: p.soldAmount || 0,
    }));
    const counterpartyMapped = cpPlayers.map(p => ({
      playerId: p._id, name: p.name, role: p.role, soldAmount: p.soldAmount || 0,
    }));
    const settlement = calculateSettlement(initiatorMapped, counterpartyMapped);

    // --- Create trade ---
    const trade = await AuctionTrade.create({
      auctionId: auction._id,
      initiatorTeamId: initiatorTeam._id,
      counterpartyTeamId: counterpartyTeam._id,
      initiatorPlayers: initiatorMapped,
      counterpartyPlayers: counterpartyMapped,
      ...settlement,
      purseSettlementEnabled: auction.config.tradeSettlementEnabled !== false,
      status: 'pending_counterparty',
      initiatorMessage: message || '',
    });

    // --- Notify via Socket.IO ---
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      const payload = {
        tradeId: trade._id,
        initiatorTeam: { _id: initiatorTeam._id, name: initiatorTeam.name, shortName: initiatorTeam.shortName },
        counterpartyTeam: { _id: counterpartyTeam._id, name: counterpartyTeam.name, shortName: counterpartyTeam.shortName },
        initiatorPlayers: trade.initiatorPlayers,
        counterpartyPlayers: trade.counterpartyPlayers,
        ...settlement,
      };
      // Notify counterparty team
      ns.to(`team:${auction._id}:${counterpartyTeam._id}`).emit('trade:proposed', payload);
      // Notify admin
      ns.to(`admin:${auction._id}`).emit('trade:proposed', payload);
    }

    res.status(201).json({ success: true, data: trade });
  } catch (error) {
    console.error('Propose trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// COUNTERPARTY ACCEPT
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/trades/:tradeId/accept
 * Counterparty team accepts the trade proposal.
 * Locks counterparty players, auto-cancels conflicting trades.
 * Auth: Team JWT (resolveAuctionTeam)
 * Body: { message?: string }
 */
router.patch('/:tradeId/accept', resolveAuctionTeam, async (req, res) => {
  try {
    const trade = await AuctionTrade.findOne({
      _id: req.params.tradeId,
      auctionId: req.auction._id,
    });

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    // Only counterparty team can accept
    if (trade.counterpartyTeamId.toString() !== req.auctionTeam._id.toString()) {
      return res.status(403).json({ success: false, error: 'Only the counterparty team can accept this trade' });
    }

    if (trade.status !== 'pending_counterparty') {
      return res.status(400).json({
        success: false,
        error: `Cannot accept a trade with status '${trade.status}'. Must be 'pending_counterparty'.`,
      });
    }

    // Re-validate counterparty players are not locked elsewhere
    for (const p of trade.counterpartyPlayers) {
      const lock = await getPlayerLock(req.auction._id, p.playerId);
      if (lock) {
        return res.status(409).json({
          success: false,
          error: `Player "${p.name}" is now in another active trade and cannot be committed`,
        });
      }
    }

    // Re-validate counterparty players still belong to the team
    const cpPlayerIds = trade.counterpartyPlayers.map(p => p.playerId);
    const validPlayers = await AuctionPlayer.countDocuments({
      _id: { $in: cpPlayerIds },
      soldTo: req.auctionTeam._id,
      status: 'sold',
      isDisqualified: false,
    });
    if (validPlayers !== cpPlayerIds.length) {
      return res.status(409).json({
        success: false,
        error: 'One or more of your players are no longer valid for this trade',
      });
    }

    // Accept
    trade.status = 'both_agreed';
    trade.counterpartyAcceptedAt = new Date();
    trade.counterpartyMessage = req.body.message || '';
    await trade.save();

    // Auto-cancel conflicting pending trades that request these counterparty players
    const io = req.app.get('io');
    await autoCancelConflictingTrades(
      req.auction._id,
      cpPlayerIds,
      trade._id,
      io
    );

    // Notify initiator team + admin
    if (io) {
      const ns = io.of('/auction');
      const payload = { tradeId: trade._id, status: 'both_agreed' };
      ns.to(`team:${req.auction._id}:${trade.initiatorTeamId}`).emit('trade:accepted', payload);
      ns.to(`admin:${req.auction._id}`).emit('trade:accepted', payload);
    }

    res.json({ success: true, data: trade });
  } catch (error) {
    console.error('Accept trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// COUNTERPARTY REJECT
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/trades/:tradeId/reject
 * Counterparty team rejects the trade proposal.
 * Auth: Team JWT (resolveAuctionTeam)
 * Body: { reason?: string }
 */
router.patch('/:tradeId/reject', resolveAuctionTeam, async (req, res) => {
  try {
    const trade = await AuctionTrade.findOne({
      _id: req.params.tradeId,
      auctionId: req.auction._id,
    });

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (trade.counterpartyTeamId.toString() !== req.auctionTeam._id.toString()) {
      return res.status(403).json({ success: false, error: 'Only the counterparty team can reject this trade' });
    }

    if (trade.status !== 'pending_counterparty') {
      return res.status(400).json({
        success: false,
        error: `Cannot reject a trade with status '${trade.status}'. Must be 'pending_counterparty'.`,
      });
    }

    trade.status = 'rejected';
    trade.rejectedBy = 'counterparty';
    trade.rejectionReason = req.body.reason || '';
    trade.counterpartyMessage = req.body.reason || '';
    await trade.save();

    // Notify initiator + admin
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      const payload = { tradeId: trade._id, status: 'rejected', reason: trade.rejectionReason };
      ns.to(`team:${req.auction._id}:${trade.initiatorTeamId}`).emit('trade:rejected', payload);
      ns.to(`admin:${req.auction._id}`).emit('trade:rejected', payload);
    }

    res.json({ success: true, data: trade });
  } catch (error) {
    console.error('Reject trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// INITIATOR WITHDRAW
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/trades/:tradeId/withdraw
 * Initiator team withdraws their trade proposal.
 * Auth: Team JWT (resolveAuctionTeam)
 */
router.patch('/:tradeId/withdraw', resolveAuctionTeam, async (req, res) => {
  try {
    const trade = await AuctionTrade.findOne({
      _id: req.params.tradeId,
      auctionId: req.auction._id,
    });

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (trade.initiatorTeamId.toString() !== req.auctionTeam._id.toString()) {
      return res.status(403).json({ success: false, error: 'Only the initiator team can withdraw this trade' });
    }

    if (trade.status !== 'pending_counterparty') {
      return res.status(400).json({
        success: false,
        error: `Cannot withdraw a trade with status '${trade.status}'. Must be 'pending_counterparty'.`,
      });
    }

    trade.status = 'withdrawn';
    await trade.save();

    // Notify counterparty + admin
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      const payload = { tradeId: trade._id, status: 'withdrawn' };
      ns.to(`team:${req.auction._id}:${trade.counterpartyTeamId}`).emit('trade:withdrawn', payload);
      ns.to(`admin:${req.auction._id}`).emit('trade:withdrawn', payload);
    }

    res.json({ success: true, data: trade });
  } catch (error) {
    console.error('Withdraw trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIST TRADES — Admin (full detail)
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/trades
 * List all trades for an auction with full detail.
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

    const enriched = await enrichTradesWithTeams(trades);
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('List trades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// MY TRADES — Team (own trades)
// ============================================================

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
      $or: [{ initiatorTeamId: teamId }, { counterpartyTeamId: teamId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await enrichTradesWithTeams(trades);
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('List my trades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ALL TRADES — Team (all auction trades, limited info)
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/trades/all-trades
 * List all auction trades visible to any team (no private messages).
 * Auth: Team JWT (resolveAuctionTeam)
 */
router.get('/all-trades', resolveAuctionTeam, async (req, res) => {
  try {
    const trades = await AuctionTrade.find({
      auctionId: req.auction._id,
      status: { $nin: ['withdrawn'] }, // don't show withdrawn trades to other teams
    })
      .select('-initiatorMessage -counterpartyMessage -adminNote')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await enrichTradesWithTeams(trades);
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('List all trades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN APPROVE + EXECUTE
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/trades/:tradeId/admin-approve
 * Admin approves and executes a both_agreed trade in one step.
 * Swaps players, adjusts purse if settlement enabled + affordable.
 * Auth: Admin JWT
 * Body: { note?: string }
 */
router.patch('/:tradeId/admin-approve', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const trade = await AuctionTrade.findOne({
      _id: req.params.tradeId,
      auctionId: req.auction._id,
    });

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (trade.status !== 'both_agreed') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve a trade with status '${trade.status}'. Must be 'both_agreed'.`,
      });
    }

    // Verify auction is in trade_window
    if (req.auction.status !== 'trade_window') {
      return res.status(400).json({ success: false, error: 'Trade window is no longer active' });
    }

    const initiatorTeam = await AuctionTeam.findById(trade.initiatorTeamId);
    const counterpartyTeam = await AuctionTeam.findById(trade.counterpartyTeamId);
    if (!initiatorTeam || !counterpartyTeam) {
      return res.status(404).json({ success: false, error: 'One or both teams not found' });
    }

    // --- Re-validate ALL players ---
    const initPlayerIds = trade.initiatorPlayers.map(p => p.playerId);
    const cpPlayerIds = trade.counterpartyPlayers.map(p => p.playerId);

    const initPlayers = await AuctionPlayer.find({
      _id: { $in: initPlayerIds },
      soldTo: initiatorTeam._id,
      status: 'sold',
      isDisqualified: false,
    });
    const cpPlayers = await AuctionPlayer.find({
      _id: { $in: cpPlayerIds },
      soldTo: counterpartyTeam._id,
      status: 'sold',
      isDisqualified: false,
    });

    if (initPlayers.length !== initPlayerIds.length || cpPlayers.length !== cpPlayerIds.length) {
      trade.status = 'rejected';
      trade.rejectedBy = 'admin';
      trade.rejectionReason = 'Player ownership changed since trade was agreed — auto-rejected';
      await trade.save();
      return res.status(409).json({
        success: false,
        error: 'Player ownership has changed. Trade auto-rejected.',
      });
    }

    // --- Execute the swap ---

    // Move initiator players → counterparty team
    await AuctionPlayer.updateMany(
      { _id: { $in: initPlayerIds } },
      { $set: { soldTo: counterpartyTeam._id } }
    );

    // Move counterparty players → initiator team
    await AuctionPlayer.updateMany(
      { _id: { $in: cpPlayerIds } },
      { $set: { soldTo: initiatorTeam._id } }
    );

    // Update initiatorTeam.players array
    for (const ip of initPlayers) {
      const idx = initiatorTeam.players.findIndex(p => p.playerId.equals(ip._id));
      if (idx !== -1) initiatorTeam.players.splice(idx, 1);
    }
    for (const cp of cpPlayers) {
      initiatorTeam.players.push({
        playerId: cp._id,
        boughtAt: cp.soldAmount,
        round: cp.soldInRound,
        boughtTimestamp: new Date(),
      });
    }

    // Update counterpartyTeam.players array
    for (const cp of cpPlayers) {
      const idx = counterpartyTeam.players.findIndex(p => p.playerId.equals(cp._id));
      if (idx !== -1) counterpartyTeam.players.splice(idx, 1);
    }
    for (const ip of initPlayers) {
      counterpartyTeam.players.push({
        playerId: ip._id,
        boughtAt: ip.soldAmount,
        round: ip.soldInRound,
        boughtTimestamp: new Date(),
      });
    }

    // --- Purse settlement (if enabled and affordable) ---
    let purseAdjusted = false;
    const warnings = [];
    if (trade.purseSettlementEnabled && trade.settlementAmount > 0) {
      const payingTeam = trade.settlementDirection === 'initiator_pays' ? initiatorTeam : counterpartyTeam;
      const receivingTeam = trade.settlementDirection === 'initiator_pays' ? counterpartyTeam : initiatorTeam;

      if (payingTeam.purseRemaining >= trade.settlementAmount) {
        payingTeam.purseRemaining -= trade.settlementAmount;
        receivingTeam.purseRemaining += trade.settlementAmount;
        purseAdjusted = true;
      } else {
        warnings.push(
          `Purse settlement skipped: ${payingTeam.shortName} has ₹${payingTeam.purseRemaining} but settlement requires ₹${trade.settlementAmount}`
        );
      }
    }

    await initiatorTeam.save();
    await counterpartyTeam.save();

    // Mark trade as executed
    trade.status = 'executed';
    trade.approvedBy = req.user._id;
    trade.executedAt = new Date();
    trade.adminNote = req.body.note || '';

    const initNames = trade.initiatorPlayers.map(p => p.name).join(', ');
    const cpNames = trade.counterpartyPlayers.map(p => p.name).join(', ');
    trade.publicAnnouncement = `Trade executed: ${initiatorTeam.shortName} sends ${initNames} to ${counterpartyTeam.shortName} for ${cpNames}`;
    if (purseAdjusted && trade.settlementAmount > 0) {
      const payer = trade.settlementDirection === 'initiator_pays' ? initiatorTeam.shortName : counterpartyTeam.shortName;
      const receiver = trade.settlementDirection === 'initiator_pays' ? counterpartyTeam.shortName : initiatorTeam.shortName;
      trade.publicAnnouncement += ` (Settlement: ₹${trade.settlementAmount.toLocaleString('en-IN')} from ${payer} to ${receiver})`;
    }
    await trade.save();

    // Log ActionEvent
    const lastEvent = await ActionEvent.findOne({ auctionId: req.auction._id })
      .sort({ sequenceNumber: -1 });
    const seq = (lastEvent?.sequenceNumber || 0) + 1;

    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: seq,
      type: 'TRADE_EXECUTED',
      payload: {
        tradeId: trade._id,
        initiatorTeamId: initiatorTeam._id,
        counterpartyTeamId: counterpartyTeam._id,
        initPlayerIds,
        cpPlayerIds,
        purseAdjusted,
        settlementAmount: trade.settlementAmount,
        settlementDirection: trade.settlementDirection,
      },
      reversalPayload: {
        tradeId: trade._id,
        initiatorTeamId: initiatorTeam._id,
        counterpartyTeamId: counterpartyTeam._id,
        initPlayerIds: cpPlayerIds,
        cpPlayerIds: initPlayerIds,
      },
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: trade.publicAnnouncement,
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      ns.to(`auction:${req.auction._id}`).emit('trade:executed', {
        tradeId: trade._id,
        initiatorTeam: { _id: initiatorTeam._id, name: initiatorTeam.name, shortName: initiatorTeam.shortName },
        counterpartyTeam: { _id: counterpartyTeam._id, name: counterpartyTeam.name, shortName: counterpartyTeam.shortName },
        initiatorPlayers: trade.initiatorPlayers,
        counterpartyPlayers: trade.counterpartyPlayers,
        announcement: trade.publicAnnouncement,
        purseAdjusted,
      });
    }

    res.json({
      success: true,
      data: trade,
      message: trade.publicAnnouncement,
      warnings,
    });
  } catch (error) {
    console.error('Admin approve+execute trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN-INITIATED TRADE (bypasses bilateral flow)
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/trades/admin-initiate
 * Admin creates AND executes a trade in one step.
 * Bypasses propose→accept→approve flow. Works during trade_window, completed, or paused.
 * Auth: Admin JWT
 * Body: {
 *   initiatorTeamId, counterpartyTeamId,
 *   initiatorPlayerIds: [], counterpartyPlayerIds: [],
 *   note?: string
 * }
 */
router.post('/admin-initiate', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { initiatorTeamId, counterpartyTeamId, initiatorPlayerIds, counterpartyPlayerIds, note } = req.body;
    const auction = req.auction;

    // Allow during trade_window, completed, or paused
    if (!['trade_window', 'completed', 'paused'].includes(auction.status)) {
      return res.status(400).json({
        success: false,
        error: `Admin trades are allowed during trade_window, completed, or paused. Current status: ${auction.status}`,
      });
    }

    // Validate input
    if (!initiatorTeamId || !counterpartyTeamId || !initiatorPlayerIds?.length || !counterpartyPlayerIds?.length) {
      return res.status(400).json({
        success: false,
        error: 'initiatorTeamId, counterpartyTeamId, initiatorPlayerIds[], and counterpartyPlayerIds[] are required',
      });
    }

    if (initiatorTeamId === counterpartyTeamId) {
      return res.status(400).json({ success: false, error: 'Cannot trade between the same team' });
    }

    // Validate teams
    const initiatorTeam = await AuctionTeam.findOne({ _id: initiatorTeamId, auctionId: auction._id, isActive: true });
    const counterpartyTeam = await AuctionTeam.findOne({ _id: counterpartyTeamId, auctionId: auction._id, isActive: true });
    if (!initiatorTeam || !counterpartyTeam) {
      return res.status(404).json({ success: false, error: 'One or both teams not found' });
    }

    // Validate players
    const initPlayers = await AuctionPlayer.find({
      _id: { $in: initiatorPlayerIds },
      auctionId: auction._id,
      soldTo: initiatorTeam._id,
      status: 'sold',
      isDisqualified: false,
    }).lean();

    const cpPlayers = await AuctionPlayer.find({
      _id: { $in: counterpartyPlayerIds },
      auctionId: auction._id,
      soldTo: counterpartyTeam._id,
      status: 'sold',
      isDisqualified: false,
    }).lean();

    if (initPlayers.length !== initiatorPlayerIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more initiator players are invalid (not sold to the team or disqualified)',
      });
    }
    if (cpPlayers.length !== counterpartyPlayerIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more counterparty players are invalid (not sold to the team or disqualified)',
      });
    }

    // Check player locks
    for (const p of [...initPlayers, ...cpPlayers]) {
      const lock = await getPlayerLock(auction._id, p._id);
      if (lock) {
        return res.status(409).json({
          success: false,
          error: `Player "${p.name}" is in an active trade and cannot be included`,
        });
      }
    }

    // Build trade data
    const initiatorMapped = initPlayers.map(p => ({
      playerId: p._id, name: p.name, role: p.role, soldAmount: p.soldAmount || 0,
    }));
    const counterpartyMapped = cpPlayers.map(p => ({
      playerId: p._id, name: p.name, role: p.role, soldAmount: p.soldAmount || 0,
    }));
    const settlement = calculateSettlement(initiatorMapped, counterpartyMapped);

    // Execute the swap
    const initPlayerIds2 = initPlayers.map(p => p._id);
    const cpPlayerIds2 = cpPlayers.map(p => p._id);

    await AuctionPlayer.updateMany(
      { _id: { $in: initPlayerIds2 } },
      { $set: { soldTo: counterpartyTeam._id } }
    );
    await AuctionPlayer.updateMany(
      { _id: { $in: cpPlayerIds2 } },
      { $set: { soldTo: initiatorTeam._id } }
    );

    // Update team player arrays
    for (const ip of initPlayers) {
      const idx = initiatorTeam.players.findIndex(p => p.playerId.equals(ip._id));
      if (idx !== -1) initiatorTeam.players.splice(idx, 1);
    }
    for (const cp of cpPlayers) {
      initiatorTeam.players.push({
        playerId: cp._id, boughtAt: cp.soldAmount, round: cp.soldInRound, boughtTimestamp: new Date(),
      });
    }

    for (const cp of cpPlayers) {
      const idx = counterpartyTeam.players.findIndex(p => p.playerId.equals(cp._id));
      if (idx !== -1) counterpartyTeam.players.splice(idx, 1);
    }
    for (const ip of initPlayers) {
      counterpartyTeam.players.push({
        playerId: ip._id, boughtAt: ip.soldAmount, round: ip.soldInRound, boughtTimestamp: new Date(),
      });
    }

    // Purse settlement
    let purseAdjusted = false;
    const warnings = [];
    if (auction.config.tradeSettlementEnabled !== false && settlement.settlementAmount > 0) {
      const payingTeam = settlement.settlementDirection === 'initiator_pays' ? initiatorTeam : counterpartyTeam;
      const receivingTeam = settlement.settlementDirection === 'initiator_pays' ? counterpartyTeam : initiatorTeam;

      if (payingTeam.purseRemaining >= settlement.settlementAmount) {
        payingTeam.purseRemaining -= settlement.settlementAmount;
        receivingTeam.purseRemaining += settlement.settlementAmount;
        purseAdjusted = true;
      } else {
        warnings.push(
          `Purse settlement skipped: ${payingTeam.shortName} has ₹${payingTeam.purseRemaining} but settlement requires ₹${settlement.settlementAmount}`
        );
      }
    }

    await initiatorTeam.save();
    await counterpartyTeam.save();

    // Create trade record as executed
    const initNames = initiatorMapped.map(p => p.name).join(', ');
    const cpNames = counterpartyMapped.map(p => p.name).join(', ');
    let announcement = `Admin trade: ${initiatorTeam.shortName} sends ${initNames} to ${counterpartyTeam.shortName} for ${cpNames}`;
    if (purseAdjusted && settlement.settlementAmount > 0) {
      const payer = settlement.settlementDirection === 'initiator_pays' ? initiatorTeam.shortName : counterpartyTeam.shortName;
      const receiver = settlement.settlementDirection === 'initiator_pays' ? counterpartyTeam.shortName : initiatorTeam.shortName;
      announcement += ` (Settlement: ₹${settlement.settlementAmount.toLocaleString('en-IN')} from ${payer} to ${receiver})`;
    }

    const trade = await AuctionTrade.create({
      auctionId: auction._id,
      initiatorTeamId: initiatorTeam._id,
      counterpartyTeamId: counterpartyTeam._id,
      initiatorPlayers: initiatorMapped,
      counterpartyPlayers: counterpartyMapped,
      ...settlement,
      purseSettlementEnabled: auction.config.tradeSettlementEnabled !== false,
      status: 'executed',
      approvedBy: req.user._id,
      executedAt: new Date(),
      counterpartyAcceptedAt: new Date(),
      adminNote: note || 'Admin-initiated trade',
      publicAnnouncement: announcement,
    });

    // Log ActionEvent
    const lastEvent = await ActionEvent.findOne({ auctionId: auction._id }).sort({ sequenceNumber: -1 });
    const seq = (lastEvent?.sequenceNumber || 0) + 1;

    await ActionEvent.create({
      auctionId: auction._id,
      sequenceNumber: seq,
      type: 'TRADE_EXECUTED',
      payload: {
        tradeId: trade._id,
        initiatorTeamId: initiatorTeam._id,
        counterpartyTeamId: counterpartyTeam._id,
        initPlayerIds: initPlayerIds2,
        cpPlayerIds: cpPlayerIds2,
        purseAdjusted,
        settlementAmount: settlement.settlementAmount,
        settlementDirection: settlement.settlementDirection,
        adminInitiated: true,
      },
      reversalPayload: {
        tradeId: trade._id,
        initiatorTeamId: initiatorTeam._id,
        counterpartyTeamId: counterpartyTeam._id,
        initPlayerIds: cpPlayerIds2,
        cpPlayerIds: initPlayerIds2,
      },
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: announcement,
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      ns.to(`auction:${auction._id}`).emit('trade:executed', {
        tradeId: trade._id,
        initiatorTeam: { _id: initiatorTeam._id, name: initiatorTeam.name, shortName: initiatorTeam.shortName },
        counterpartyTeam: { _id: counterpartyTeam._id, name: counterpartyTeam.name, shortName: counterpartyTeam.shortName },
        initiatorPlayers: trade.initiatorPlayers,
        counterpartyPlayers: trade.counterpartyPlayers,
        announcement,
        purseAdjusted,
        adminInitiated: true,
      });
    }

    res.status(201).json({
      success: true,
      data: trade,
      message: announcement,
      warnings,
    });
  } catch (error) {
    console.error('Admin-initiated trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN REJECT
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/trades/:tradeId/admin-reject
 * Admin rejects a trade (from both_agreed or pending_counterparty).
 * Auth: Admin JWT
 * Body: { reason?: string }
 */
router.patch('/:tradeId/admin-reject', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const trade = await AuctionTrade.findOne({
      _id: req.params.tradeId,
      auctionId: req.auction._id,
    });

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (!['pending_counterparty', 'both_agreed'].includes(trade.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot reject a trade with status '${trade.status}'.`,
      });
    }

    trade.status = 'rejected';
    trade.rejectedBy = 'admin';
    trade.rejectionReason = req.body.reason || '';
    trade.adminNote = req.body.reason || '';
    await trade.save();

    // Notify both teams
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      const payload = { tradeId: trade._id, status: 'rejected', reason: trade.rejectionReason, rejectedBy: 'admin' };
      ns.to(`team:${req.auction._id}:${trade.initiatorTeamId}`).emit('trade:admin_rejected', payload);
      ns.to(`team:${req.auction._id}:${trade.counterpartyTeamId}`).emit('trade:admin_rejected', payload);
    }

    res.json({ success: true, data: trade });
  } catch (error) {
    console.error('Admin reject trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET TEAM PLAYERS (Team-accessible — for trade proposal UI)
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/trades/team-players/:teamId
 * Get sold players for a specific team with all custom fields.
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
      .select('name role soldAmount playerNumber customFields imageUrl')
      .sort({ playerNumber: 1 })
      .lean();

    // Also return lock status for each player
    const enriched = await Promise.all(players.map(async (p) => {
      const lock = await getPlayerLock(req.auction._id, p._id);
      return { ...p, isLocked: !!lock };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Get team players error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
