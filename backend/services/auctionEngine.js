/**
 * @fileoverview Auction Engine Service
 * 
 * Server-authoritative state machine for real-time cricket player auctions.
 * Manages the per-player bidding flow:
 *   WAITING → REVEALED → OPEN → [BID ⇄ TIMER_RESET] → GOING_ONCE → GOING_TWICE → SOLD/UNSOLD
 * 
 * All bid validation, timer management, and state transitions happen here.
 * Clients are dumb renderers — they receive state via Socket.IO broadcasts.
 * 
 * @module services/auctionEngine
 */

const Auction = require('../models/Auction');
const AuctionTeam = require('../models/AuctionTeam');
const AuctionPlayer = require('../models/AuctionPlayer');
const ActionEvent = require('../models/ActionEvent');
const BidAuditLog = require('../models/BidAuditLog');

// In-memory state per active auction (cleared on completion)
const activeTimers = new Map();  // auctionId → { timer, phase }
const bidLocks = new Map();      // auctionId → boolean (200ms lock window)

/**
 * Get the bid increment for a given current bid using auction's tier config
 */
function getBidIncrement(auction, currentBid) {
  const tiers = auction.config.bidIncrementTiers;
  if (!tiers || tiers.length === 0) return 10000;
  for (const tier of tiers) {
    if (tier.upTo === null || currentBid < tier.upTo) {
      return tier.increment;
    }
  }
  return tiers[tiers.length - 1].increment;
}

/**
 * Calculate max bid for a team given auction config
 */
function calculateMaxBid(team, auctionConfig) {
  const { basePrice, minSquadSize } = auctionConfig;
  const squadSize = (team.players ? team.players.length : 0) +
                    (team.retainedPlayers ? team.retainedPlayers.length : 0);

  if (squadSize >= minSquadSize) {
    return team.purseRemaining;
  }

  const slotsToFill = minSquadSize - squadSize - 1;
  const reserved = slotsToFill * basePrice;
  const maxBid = team.purseRemaining - reserved;

  if (maxBid < basePrice) {
    return team.purseRemaining >= basePrice ? basePrice : 0;
  }
  return maxBid;
}

/**
 * Build the public auction state object broadcast to all clients
 */
async function buildAuctionState(auction) {
  const teams = await AuctionTeam.find({ auctionId: auction._id, isActive: true })
    .select('name shortName primaryColor secondaryColor purseValue purseRemaining players retainedPlayers logo')
    .lean();

  let currentPlayer = null;
  if (auction.currentBiddingState && auction.currentBiddingState.playerId) {
    currentPlayer = await AuctionPlayer.findById(auction.currentBiddingState.playerId)
      .select('name role playerNumber imageUrl customFields')
      .lean();
  }

  const totalPool = await AuctionPlayer.countDocuments({ auctionId: auction._id, status: 'pool' });
  const totalSold = await AuctionPlayer.countDocuments({ auctionId: auction._id, status: 'sold' });
  const totalUnsold = await AuctionPlayer.countDocuments({ auctionId: auction._id, status: 'unsold' });
  const totalPlayers = await AuctionPlayer.countDocuments({ auctionId: auction._id });

  // Build team info with squad sizes (public view)
  const teamsPublic = teams.map(t => ({
    _id: t._id,
    name: t.name,
    shortName: t.shortName,
    primaryColor: t.primaryColor,
    secondaryColor: t.secondaryColor,
    logo: t.logo,
    purseValue: t.purseValue,
    purseRemaining: t.purseRemaining,
    squadSize: (t.players ? t.players.length : 0) + (t.retainedPlayers ? t.retainedPlayers.length : 0),
  }));

  return {
    auctionId: auction._id.toString(),
    name: auction.name,
    slug: auction.slug,
    status: auction.status,
    currentRound: auction.currentRound,
    config: {
      basePrice: auction.config.basePrice,
      purseValue: auction.config.purseValue,
      minSquadSize: auction.config.minSquadSize,
      maxSquadSize: auction.config.maxSquadSize,
      maxRounds: auction.config.maxRounds,
      timerDuration: auction.config.timerDuration,
      bidResetTimer: auction.config.bidResetTimer,
      goingOnceTimer: auction.config.goingOnceTimer,
      goingTwiceTimer: auction.config.goingTwiceTimer,
      playerRevealDelay: auction.config.playerRevealDelay,
    },
    bidding: auction.currentBiddingState ? {
      status: auction.currentBiddingState.status,
      currentBid: auction.currentBiddingState.currentBid,
      currentBidTeamId: auction.currentBiddingState.currentBidTeamId?.toString() || null,
      bidHistory: (auction.currentBiddingState.bidHistory || []).map(b => ({
        teamId: b.teamId?.toString(),
        amount: b.amount,
        timestamp: b.timestamp,
      })),
      timerExpiresAt: auction.currentBiddingState.timerExpiresAt,
      player: currentPlayer,
    } : null,
    teams: teamsPublic,
    stats: {
      totalPlayers,
      inPool: totalPool,
      sold: totalSold,
      unsold: totalUnsold,
    },
    playerFields: (auction.displayConfig?.playerFields || []).map(f => ({
      key: f.key,
      label: f.label,
      type: f.type,
      showOnCard: f.showOnCard,
      showInList: f.showInList,
      sortable: f.sortable,
      order: f.order,
    })),
  };
}

/**
 * Clear any active timer for an auction
 */
function clearAuctionTimer(auctionId) {
  const id = auctionId.toString();
  const existing = activeTimers.get(id);
  if (existing) {
    clearTimeout(existing.timer);
    activeTimers.delete(id);
  }
}

/**
 * Set a timer that fires a callback after duration
 */
function setAuctionTimer(auctionId, phase, durationMs, callback) {
  const id = auctionId.toString();
  clearAuctionTimer(auctionId);
  const timer = setTimeout(callback, durationMs);
  activeTimers.set(id, { timer, phase });
}

// ============================================================
// AUCTION LIFECYCLE
// ============================================================

/**
 * Start the auction (go live) — pick first random player
 */
async function startAuction(auctionId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'configured') {
    throw new Error('Auction must be in configured state to start');
  }

  // Populate remainingPlayerIds with all pool players
  const poolPlayers = await AuctionPlayer.find({
    auctionId: auction._id,
    status: 'pool',
    isDisqualified: false,
  }).select('_id').lean();

  auction.status = 'live';
  auction.startedAt = new Date();
  auction.currentRound = 1;
  auction.remainingPlayerIds = poolPlayers.map(p => p._id);
  auction.currentBiddingState = { status: 'waiting' };
  await auction.save();

  // Log event
  const seq = await ActionEvent.getNextSequence(auction._id);
  await ActionEvent.create({
    auctionId: auction._id,
    sequenceNumber: seq,
    type: 'AUCTION_STARTED',
    payload: { playerCount: poolPlayers.length },
    reversalPayload: {},
    performedBy: auction.createdBy,
    isPublic: true,
    publicMessage: `Auction started with ${poolPlayers.length} players`,
  });

  const ns = io.of('/auction');
  ns.to(`auction:${auctionId}`).emit('auction:status_change', { status: 'live' });

  // Broadcast full state — admin must click "Next Player" to begin
  const fullState = await buildAuctionState(auction);
  ns.to(`auction:${auctionId}`).emit('auction:state', fullState);
}

/**
 * Pick the next random player from the remaining pool
 */
async function pickNextPlayer(auctionId, io) {
  console.log(`[AuctionEngine] pickNextPlayer called for auction ${auctionId}`);
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'live') {
    console.log(`[AuctionEngine] Auction not live or not found. Status: ${auction?.status}`);
    return;
  }

  console.log(`[AuctionEngine] Remaining players in pool: ${auction.remainingPlayerIds?.length || 0}`);

  // Check if there are remaining players
  if (!auction.remainingPlayerIds || auction.remainingPlayerIds.length === 0) {
    // Check if we should start next round
    const unsoldPlayers = await AuctionPlayer.find({
      auctionId: auction._id,
      status: 'unsold',
      isDisqualified: false,
    }).select('_id').lean();

    if (unsoldPlayers.length > 0 && auction.currentRound < auction.config.maxRounds) {
      // Start next round with unsold players
      auction.currentRound += 1;
      auction.remainingPlayerIds = unsoldPlayers.map(p => p._id);

      // Reset unsold players back to pool
      await AuctionPlayer.updateMany(
        { _id: { $in: unsoldPlayers.map(p => p._id) } },
        { $set: { status: 'pool' } }
      );

      const ns = io.of('/auction');
      ns.to(`auction:${auctionId}`).emit('round:started', {
        round: auction.currentRound,
        playerCount: unsoldPlayers.length,
      });
    } else {
      // Auction complete — no more players or max rounds reached
      await completeAuction(auctionId, io, 'All rounds completed');
      return;
    }
  }

  // Pick random player
  const randomIndex = Math.floor(Math.random() * auction.remainingPlayerIds.length);
  const playerId = auction.remainingPlayerIds[randomIndex];
  console.log(`[AuctionEngine] Picked player index ${randomIndex}, ID: ${playerId}`);

  // Remove from remaining
  auction.remainingPlayerIds.splice(randomIndex, 1);

  // Update player status
  await AuctionPlayer.findByIdAndUpdate(playerId, { status: 'in_auction' });
  console.log(`[AuctionEngine] Updated player status to in_auction`);

  // Set bidding state to revealed
  auction.currentBiddingState = {
    playerId,
    status: 'revealed',
    currentBid: 0,
    currentBidTeamId: null,
    bidHistory: [],
    timerExpiresAt: null,
    timerStartedAt: null,
  };
  await auction.save();

  // Get player details for broadcast
  const player = await AuctionPlayer.findById(playerId)
    .select('name role playerNumber imageUrl customFields')
    .lean();

  const ns = io.of('/auction');
  console.log(`[AuctionEngine] Broadcasting player:revealed for ${player.name} to auction:${auctionId}`);
  ns.to(`auction:${auctionId}`).emit('player:revealed', {
    player,
    revealDuration: auction.config.playerRevealDelay,
    remainingInPool: auction.remainingPlayerIds.length,
    round: auction.currentRound,
  });

  // After reveal delay, open bidding
  setAuctionTimer(auctionId, 'reveal', auction.config.playerRevealDelay * 1000, async () => {
    await openBidding(auctionId, io);
  });
}

/**
 * Open bidding for the current player
 */
async function openBidding(auctionId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'live') return;
  if (!auction.currentBiddingState || auction.currentBiddingState.status !== 'revealed') return;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + auction.config.timerDuration * 1000);

  auction.currentBiddingState.status = 'open';
  auction.currentBiddingState.currentBid = auction.config.basePrice;
  auction.currentBiddingState.timerStartedAt = now;
  auction.currentBiddingState.timerExpiresAt = expiresAt;
  await auction.save();

  const ns = io.of('/auction');
  ns.to(`auction:${auctionId}`).emit('bidding:open', {
    playerId: auction.currentBiddingState.playerId.toString(),
    basePrice: auction.config.basePrice,
    timerExpiresAt: expiresAt,
    timerDuration: auction.config.timerDuration,
  });

  // Start timer — when it expires, go to going_once
  setAuctionTimer(auctionId, 'bidding', auction.config.timerDuration * 1000, async () => {
    await goingOnce(auctionId, io);
  });
}

/**
 * Transition to GOING_ONCE phase
 */
async function goingOnce(auctionId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'live') return;
  if (!auction.currentBiddingState) return;
  if (!['open', 'going_once'].includes(auction.currentBiddingState.status)) return;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + auction.config.goingOnceTimer * 1000);

  auction.currentBiddingState.status = 'going_once';
  auction.currentBiddingState.timerStartedAt = now;
  auction.currentBiddingState.timerExpiresAt = expiresAt;
  await auction.save();

  const ns = io.of('/auction');
  ns.to(`auction:${auctionId}`).emit('timer:phase', {
    phase: 'going_once',
    timerExpiresAt: expiresAt,
    duration: auction.config.goingOnceTimer,
    currentBid: auction.currentBiddingState.currentBid,
    currentBidTeamId: auction.currentBiddingState.currentBidTeamId?.toString(),
  });

  setAuctionTimer(auctionId, 'going_once', auction.config.goingOnceTimer * 1000, async () => {
    await goingTwice(auctionId, io);
  });
}

/**
 * Transition to GOING_TWICE phase
 */
async function goingTwice(auctionId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'live') return;
  if (!auction.currentBiddingState || auction.currentBiddingState.status !== 'going_once') return;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + auction.config.goingTwiceTimer * 1000);

  auction.currentBiddingState.status = 'going_twice';
  auction.currentBiddingState.timerStartedAt = now;
  auction.currentBiddingState.timerExpiresAt = expiresAt;
  await auction.save();

  const ns = io.of('/auction');
  ns.to(`auction:${auctionId}`).emit('timer:phase', {
    phase: 'going_twice',
    timerExpiresAt: expiresAt,
    duration: auction.config.goingTwiceTimer,
    currentBid: auction.currentBiddingState.currentBid,
    currentBidTeamId: auction.currentBiddingState.currentBidTeamId?.toString(),
  });

  setAuctionTimer(auctionId, 'going_twice', auction.config.goingTwiceTimer * 1000, async () => {
    await finalizePlayer(auctionId, io);
  });
}

/**
 * Finalize current player — SOLD or UNSOLD
 */
async function finalizePlayer(auctionId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'live') return;
  if (!auction.currentBiddingState || !auction.currentBiddingState.playerId) return;

  clearAuctionTimer(auctionId);

  const { playerId, currentBid, currentBidTeamId, bidHistory } = auction.currentBiddingState;
  const hasBids = bidHistory && bidHistory.length > 0;

  if (hasBids && currentBidTeamId) {
    // SOLD
    await playerSold(auction, playerId, currentBidTeamId, currentBid, io);
  } else {
    // UNSOLD
    await playerUnsold(auction, playerId, io);
  }

  // After sold/unsold, broadcast full state rebuild so admin sees updated stats
  // Admin must manually trigger "Next Player" — no auto-advance
  const updatedAuction = await Auction.findById(auctionId);
  if (updatedAuction) {
    const fullState = await buildAuctionState(updatedAuction);
    fullState.isAdmin = true;
    fullState.remainingPlayerCount = updatedAuction.remainingPlayerIds?.length || 0;
    const ns = io.of('/auction');
    ns.to(`admin:${auctionId}`).emit('auction:state', fullState);
  }
}

/**
 * Mark player as SOLD
 */
async function playerSold(auction, playerId, teamId, amount, io) {
  // Update player
  await AuctionPlayer.findByIdAndUpdate(playerId, {
    status: 'sold',
    soldTo: teamId,
    soldAmount: amount,
    soldInRound: auction.currentRound,
    $push: {
      roundHistory: {
        round: auction.currentRound,
        result: 'sold',
        highestBid: amount,
        highestBidTeam: teamId,
      },
    },
  });

  // Update team — deduct purse, add to squad
  const team = await AuctionTeam.findById(teamId);
  team.purseRemaining -= amount;
  team.players.push({
    playerId,
    boughtAt: amount,
    round: auction.currentRound,
    boughtTimestamp: new Date(),
  });
  await team.save();

  // Get player and team details for broadcast
  const player = await AuctionPlayer.findById(playerId)
    .select('name role playerNumber imageUrl').lean();
  const teamData = await AuctionTeam.findById(teamId)
    .select('name shortName primaryColor purseRemaining').lean();

  // Update auction state
  auction.currentBiddingState.status = 'sold';
  await auction.save();

  // Log action event (undoable)
  const seq = await ActionEvent.getNextSequence(auction._id);
  await ActionEvent.create({
    auctionId: auction._id,
    sequenceNumber: seq,
    type: 'PLAYER_SOLD',
    payload: { playerId, teamId, amount, round: auction.currentRound },
    reversalPayload: {
      playerId,
      teamId,
      amount,
      previousStatus: 'pool',
      previousPurse: team.purseRemaining + amount,
    },
    performedBy: auction.createdBy,
    isPublic: true,
    publicMessage: `${player.name} sold to ${teamData.name} for ₹${amount.toLocaleString('en-IN')}`,
  });

  const ns = io.of('/auction');
  ns.to(`auction:${auction._id}`).emit('player:sold', {
    player,
    team: teamData,
    amount,
    round: auction.currentRound,
  });

  // Send team:update to the winning team so their purse/maxBid/canBid refreshes
  const teamMaxBid = calculateMaxBid(team, auction.config);
  ns.to(`team:${teamId}`).emit('team:update', {
    purseRemaining: team.purseRemaining,
    maxBid: teamMaxBid,
    squadSize: (team.players?.length || 0) + (team.retainedPlayers?.length || 0),
    canBid: team.purseRemaining >= auction.config.basePrice,
  });
}

/**
 * Mark player as UNSOLD
 */
async function playerUnsold(auction, playerId, io) {
  await AuctionPlayer.findByIdAndUpdate(playerId, {
    status: 'unsold',
    $push: {
      roundHistory: {
        round: auction.currentRound,
        result: 'unsold',
        highestBid: 0,
        highestBidTeam: null,
      },
    },
  });

  const player = await AuctionPlayer.findById(playerId)
    .select('name role playerNumber imageUrl').lean();

  auction.currentBiddingState.status = 'unsold';
  await auction.save();

  const seq = await ActionEvent.getNextSequence(auction._id);
  await ActionEvent.create({
    auctionId: auction._id,
    sequenceNumber: seq,
    type: 'PLAYER_UNSOLD',
    payload: { playerId, round: auction.currentRound },
    reversalPayload: { playerId, previousStatus: 'pool' },
    performedBy: auction.createdBy,
    isPublic: true,
    publicMessage: `${player.name} goes unsold in Round ${auction.currentRound}`,
  });

  const willReturn = auction.currentRound < auction.config.maxRounds;
  const ns = io.of('/auction');
  ns.to(`auction:${auction._id}`).emit('player:unsold', {
    player,
    round: auction.currentRound,
    willReturnInRound: willReturn ? auction.currentRound + 1 : null,
  });
}

// ============================================================
// BID PROCESSING
// ============================================================

/**
 * Process a bid from a team
 * @returns {{ success: boolean, error?: string, data?: object }}
 */
async function processBid(auctionId, teamId, io) {
  const id = auctionId.toString();

  // Bid lock (200ms window to prevent simultaneous processing)
  if (bidLocks.get(id)) {
    return { success: false, error: 'Bid processing in progress, try again' };
  }
  bidLocks.set(id, true);

  try {
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'live') {
      return { success: false, error: 'Auction is not live' };
    }

    const bs = auction.currentBiddingState;
    if (!bs || !['open', 'going_once', 'going_twice'].includes(bs.status)) {
      return { success: false, error: 'Bidding is not open for this player' };
    }

    // Team already the highest bidder?
    if (bs.currentBidTeamId && bs.currentBidTeamId.toString() === teamId.toString()) {
      return { success: false, error: 'You are already the highest bidder' };
    }

    const team = await AuctionTeam.findById(teamId);
    if (!team || !team.isActive) {
      return { success: false, error: 'Team not found' };
    }

    // Calculate bid amount (always currentBid + increment for first bid, or increment on current)
    const increment = getBidIncrement(auction, bs.currentBid);
    const bidAmount = bs.bidHistory.length === 0
      ? auction.config.basePrice  // First bid is at base price
      : bs.currentBid + increment;

    // MaxBid check
    const maxBid = calculateMaxBid(team, auction.config);
    if (bidAmount > maxBid) {
      // Log rejected bid
      await BidAuditLog.create({
        auctionId: auction._id,
        teamId,
        playerId: bs.playerId,
        type: 'bid_rejected',
        attemptedAmount: bidAmount,
        reason: `Max bid exceeded (max: ${maxBid}, attempted: ${bidAmount})`,
        purseAtTime: team.purseRemaining,
        maxBidAtTime: maxBid,
      });
      return { success: false, error: `Cannot bid ₹${bidAmount.toLocaleString('en-IN')}. Max bid: ₹${maxBid.toLocaleString('en-IN')}` };
    }

    // Purse check
    if (bidAmount > team.purseRemaining) {
      await BidAuditLog.create({
        auctionId: auction._id,
        teamId,
        playerId: bs.playerId,
        type: 'bid_rejected',
        attemptedAmount: bidAmount,
        reason: 'Insufficient purse',
        purseAtTime: team.purseRemaining,
        maxBidAtTime: maxBid,
      });
      return { success: false, error: 'Insufficient purse' };
    }

    // Team squad full?
    const squadSize = (team.players ? team.players.length : 0) +
                      (team.retainedPlayers ? team.retainedPlayers.length : 0);
    if (squadSize >= auction.config.maxSquadSize) {
      return { success: false, error: 'Squad is full' };
    }

    // Valid bid — apply
    const now = new Date();
    bs.currentBid = bidAmount;
    bs.currentBidTeamId = teamId;
    bs.bidHistory.push({ teamId, amount: bidAmount, timestamp: now });

    // Reset timer based on current phase
    // If in going_once or going_twice, go back to open with reset timer
    const resetDuration = auction.config.bidResetTimer;
    const expiresAt = new Date(now.getTime() + resetDuration * 1000);
    bs.status = 'open';
    bs.timerStartedAt = now;
    bs.timerExpiresAt = expiresAt;
    await auction.save();

    // Log accepted bid
    await BidAuditLog.create({
      auctionId: auction._id,
      teamId,
      playerId: bs.playerId,
      type: 'bid_accepted',
      attemptedAmount: bidAmount,
      reason: '',
      purseAtTime: team.purseRemaining,
      maxBidAtTime: maxBid,
    });

    // Get team details for broadcast
    const teamData = await AuctionTeam.findById(teamId)
      .select('name shortName primaryColor').lean();

    const ns = io.of('/auction');
    ns.to(`auction:${auctionId}`).emit('bid:placed', {
      teamId: teamId.toString(),
      teamName: teamData.name,
      teamShortName: teamData.shortName,
      teamColor: teamData.primaryColor,
      amount: bidAmount,
      nextBidAmount: bidAmount + getBidIncrement(auction, bidAmount),
      timerExpiresAt: expiresAt,
      timerDuration: resetDuration,
      bidCount: bs.bidHistory.length,
      timestamp: now,
    });

    // Reset timer to go to going_once after bidResetTimer
    setAuctionTimer(auctionId, 'bidding', resetDuration * 1000, async () => {
      await goingOnce(auctionId, io);
    });

    return {
      success: true,
      data: {
        amount: bidAmount,
        nextBidAmount: bidAmount + getBidIncrement(auction, bidAmount),
        timerExpiresAt: expiresAt,
      },
    };
  } catch (error) {
    console.error('processBid error:', error);
    return { success: false, error: 'Internal error processing bid' };
  } finally {
    // Release bid lock after 200ms
    setTimeout(() => { bidLocks.delete(id); }, 200);
  }
}

// ============================================================
// ADMIN ACTIONS
// ============================================================

/**
 * Pause the auction
 */
async function pauseAuction(auctionId, adminUserId, reason, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'live') {
    throw new Error('Auction must be live to pause');
  }

  clearAuctionTimer(auctionId);

  // If mid-bidding, void current player's bids and return to pool
  const bs = auction.currentBiddingState;
  if (bs && bs.playerId && !['sold', 'unsold', 'waiting'].includes(bs.status)) {
    await AuctionPlayer.findByIdAndUpdate(bs.playerId, {
      status: 'pool',
      $push: {
        roundHistory: {
          round: auction.currentRound,
          result: 'voided',
          highestBid: bs.currentBid || 0,
          highestBidTeam: bs.currentBidTeamId || null,
        },
      },
    });

    // Add player back to remaining pool
    if (!auction.remainingPlayerIds.some(id => id.equals(bs.playerId))) {
      auction.remainingPlayerIds.push(bs.playerId);
    }

    // Void all bids for this player
    if (bs.bidHistory && bs.bidHistory.length > 0) {
      await BidAuditLog.updateMany(
        { auctionId: auction._id, playerId: bs.playerId, type: 'bid_accepted' },
        { $set: { type: 'bid_voided', reason: 'Auction paused — bids voided' } }
      );
    }
  }

  auction.status = 'paused';
  auction.currentBiddingState = { status: 'waiting' };
  await auction.save();

  const seq = await ActionEvent.getNextSequence(auction._id);
  await ActionEvent.create({
    auctionId: auction._id,
    sequenceNumber: seq,
    type: 'AUCTION_PAUSED',
    payload: { reason },
    reversalPayload: {},
    performedBy: adminUserId,
    isPublic: true,
    publicMessage: reason || 'Auction paused by admin',
  });

  const ns = io.of('/auction');
  ns.to(`auction:${auctionId}`).emit('auction:status_change', {
    status: 'paused',
    reason: reason || 'Auction paused by admin',
  });
}

/**
 * Resume the auction
 */
async function resumeAuction(auctionId, adminUserId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'paused') {
    throw new Error('Auction must be paused to resume');
  }

  auction.status = 'live';
  await auction.save();

  const seq = await ActionEvent.getNextSequence(auction._id);
  await ActionEvent.create({
    auctionId: auction._id,
    sequenceNumber: seq,
    type: 'AUCTION_RESUMED',
    payload: {},
    reversalPayload: {},
    performedBy: adminUserId,
    isPublic: true,
    publicMessage: 'Auction resumed',
  });

  // Broadcast full state rebuild so all clients get current auction data
  const fullState = await buildAuctionState(auction);
  const ns = io.of('/auction');
  ns.to(`auction:${auctionId}`).emit('auction:status_change', { status: 'live' });
  ns.to(`auction:${auctionId}`).emit('auction:state', fullState);

  // If there was an active bidding phase when paused, restart its timer
  const bs = auction.currentBiddingState;
  if (bs && bs.playerId && ['open', 'going_once', 'going_twice'].includes(bs.status)) {
    const remaining = bs.timerExpiresAt ? Math.max(1, Math.ceil((new Date(bs.timerExpiresAt).getTime() - Date.now()) / 1000)) : 10;
    const newExpiry = new Date(Date.now() + remaining * 1000);
    auction.currentBiddingState.timerExpiresAt = newExpiry;
    auction.currentBiddingState.timerStartedAt = new Date();
    await auction.save();

    ns.to(`auction:${auctionId}`).emit('timer:phase', {
      phase: bs.status,
      timerExpiresAt: newExpiry,
      duration: remaining,
      currentBid: bs.currentBid,
      currentBidTeamId: bs.currentBidTeamId?.toString(),
    });

    const timerCallback = bs.status === 'open'
      ? () => goingOnce(auctionId, io)
      : bs.status === 'going_once'
        ? () => goingTwice(auctionId, io)
        : () => finalizePlayer(auctionId, io);
    setAuctionTimer(auctionId, bs.status, remaining * 1000, timerCallback);
  }
  // Otherwise admin must click "Next Player" to continue
}

/**
 * Skip current player (return to pool, pick next)
 */
async function skipPlayer(auctionId, adminUserId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'live') {
    throw new Error('Auction must be live');
  }

  clearAuctionTimer(auctionId);

  const bs = auction.currentBiddingState;
  if (bs && bs.playerId) {
    await AuctionPlayer.findByIdAndUpdate(bs.playerId, {
      status: 'pool',
      $push: {
        roundHistory: {
          round: auction.currentRound,
          result: 'skipped',
          highestBid: bs.currentBid || 0,
          highestBidTeam: bs.currentBidTeamId || null,
        },
      },
    });

    // Add back to remaining pool
    if (!auction.remainingPlayerIds.some(id => id.equals(bs.playerId))) {
      auction.remainingPlayerIds.push(bs.playerId);
    }

    const player = await AuctionPlayer.findById(bs.playerId).select('name').lean();

    const seq = await ActionEvent.getNextSequence(auction._id);
    await ActionEvent.create({
      auctionId: auction._id,
      sequenceNumber: seq,
      type: 'PLAYER_SKIPPED',
      payload: { playerId: bs.playerId },
      reversalPayload: { playerId: bs.playerId },
      performedBy: adminUserId,
      isPublic: true,
      publicMessage: `${player?.name || 'Player'} skipped by admin`,
    });

    const ns = io.of('/auction');
    ns.to(`auction:${auctionId}`).emit('player:skipped', {
      playerId: bs.playerId.toString(),
      playerName: player?.name,
    });
  }

  auction.currentBiddingState = { status: 'waiting' };
  await auction.save();

  // Broadcast state rebuild — admin must click "Next Player" to continue
  const fullState = await buildAuctionState(auction);
  fullState.isAdmin = true;
  fullState.remainingPlayerCount = auction.remainingPlayerIds?.length || 0;
  const ns2 = io.of('/auction');
  ns2.to(`admin:${auctionId}`).emit('auction:state', fullState);
}

/**
 * Complete the auction
 */
async function completeAuction(auctionId, io, reason) {
  const auction = await Auction.findById(auctionId);
  if (!auction || !['live', 'paused'].includes(auction.status)) {
    throw new Error('Auction must be live or paused to complete');
  }

  clearAuctionTimer(auctionId);
  bidLocks.delete(auctionId.toString());

  auction.status = 'completed';
  auction.completedAt = new Date();
  auction.tradeWindowEndsAt = new Date(Date.now() + auction.config.tradeWindowHours * 60 * 60 * 1000);
  auction.currentBiddingState = { status: 'waiting' };
  await auction.save();

  const seq = await ActionEvent.getNextSequence(auction._id);
  await ActionEvent.create({
    auctionId: auction._id,
    sequenceNumber: seq,
    type: 'AUCTION_COMPLETED',
    payload: { reason },
    reversalPayload: {},
    performedBy: auction.createdBy,
    isPublic: true,
    publicMessage: reason || 'Auction completed',
  });

  const ns = io.of('/auction');
  ns.to(`auction:${auctionId}`).emit('auction:status_change', {
    status: 'completed',
    reason,
  });
}

/**
 * Undo the last player-level action (SOLD → return to pool + refund purse, UNSOLD → return to pool)
 * LIFO stack, max 3 consecutive undos.
 * @returns {{ success: boolean, error?: string, undoneAction?: object }}
 */
async function undoLastAction(auctionId, adminUserId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || !['live', 'paused'].includes(auction.status)) {
    return { success: false, error: 'Auction must be live or paused to undo' };
  }

  // Check undo limit
  const consecutiveUndos = await ActionEvent.getConsecutiveUndoCount(auctionId);
  if (consecutiveUndos >= 3) {
    return { success: false, error: 'Maximum 3 consecutive undos reached' };
  }

  // Get the most recent undoable action
  const undoable = await ActionEvent.getUndoableActions(auctionId, 1);
  if (!undoable || undoable.length === 0) {
    return { success: false, error: 'No undoable actions available' };
  }

  const action = undoable[0];
  const reversal = action.reversalPayload;

  console.log(`[Undo] Reversing action #${action.sequenceNumber} type=${action.type} for auction ${auctionId}`);

  try {
    if (action.type === 'PLAYER_SOLD') {
      // Reverse SOLD: put player back in pool, refund purse to team, remove from squad
      const { playerId, teamId, amount } = action.payload;

      // Restore player to pool
      await AuctionPlayer.findByIdAndUpdate(playerId, {
        status: 'pool',
        soldTo: null,
        soldAmount: null,
        soldInRound: null,
        $pop: { roundHistory: 1 },
      });

      // Refund team purse + remove player from squad
      const team = await AuctionTeam.findById(teamId);
      if (team) {
        team.purseRemaining += amount;
        team.players = team.players.filter(
          p => p.playerId.toString() !== playerId.toString()
        );
        await team.save();
      }

      // Put player back in remaining pool
      if (!auction.remainingPlayerIds.map(id => id.toString()).includes(playerId.toString())) {
        auction.remainingPlayerIds.push(playerId);
      }

    } else if (action.type === 'PLAYER_UNSOLD') {
      // Reverse UNSOLD: put player back in pool
      const { playerId } = action.payload;

      await AuctionPlayer.findByIdAndUpdate(playerId, {
        status: 'pool',
        $pop: { roundHistory: 1 },
      });

      // Put player back in remaining pool
      if (!auction.remainingPlayerIds.map(id => id.toString()).includes(playerId.toString())) {
        auction.remainingPlayerIds.push(playerId);
      }

    } else if (action.type === 'PLAYER_DISQUALIFIED') {
      // Reverse DISQUALIFIED: reinstate player
      const { playerId, teamId, refundAmount } = action.payload;

      await AuctionPlayer.findByIdAndUpdate(playerId, {
        status: reversal.previousStatus || 'pool',
        soldTo: reversal.previousSoldTo || null,
        soldAmount: reversal.previousSoldAmount || null,
        isDisqualified: false,
        disqualifiedReason: null,
      });

      // If player was sold before disqualification, re-deduct from team
      if (reversal.previousStatus === 'sold' && teamId && refundAmount) {
        const team = await AuctionTeam.findById(teamId);
        if (team) {
          team.purseRemaining -= refundAmount;
          team.players.push({
            playerId,
            boughtAt: reversal.previousSoldAmount,
            round: reversal.previousRound || auction.currentRound,
            boughtTimestamp: new Date(),
          });
          await team.save();
        }
      } else {
        // Return to pool
        if (!auction.remainingPlayerIds.map(id => id.toString()).includes(playerId.toString())) {
          auction.remainingPlayerIds.push(playerId);
        }
      }
    }

    // Mark action as undone
    await ActionEvent.findByIdAndUpdate(action._id, {
      isUndone: true,
      undoneAt: new Date(),
      undoneBy: adminUserId,
    });

    await auction.save();

    // Get player details for broadcast
    const player = await AuctionPlayer.findById(action.payload.playerId)
      .select('name role playerNumber').lean();

    // Broadcast undo event to all clients
    const ns = io.of('/auction');
    ns.to(`auction:${auctionId}`).emit('admin:undo', {
      actionType: action.type,
      playerName: player?.name || 'Unknown',
      message: `Undo: ${action.publicMessage || action.type}`,
    });

    // Rebuild and broadcast updated state
    const newState = await buildAuctionState(auction);
    ns.to(`auction:${auctionId}`).emit('auction:state', newState);

    // Also update individual team states if a team was affected
    if (action.payload.teamId) {
      const team = await AuctionTeam.findById(action.payload.teamId);
      if (team) {
        const teamMaxBid = calculateMaxBid(team, auction.config);
        ns.to(`team:${action.payload.teamId}`).emit('team:update', {
          purseRemaining: team.purseRemaining,
          maxBid: teamMaxBid,
          squadSize: (team.players?.length || 0) + (team.retainedPlayers?.length || 0),
          canBid: teamMaxBid >= auction.config.basePrice,
        });
      }
    }

    console.log(`[Undo] Successfully reversed action #${action.sequenceNumber}`);
    return {
      success: true,
      undoneAction: {
        type: action.type,
        playerName: player?.name,
        publicMessage: action.publicMessage,
      },
    };
  } catch (err) {
    console.error('[Undo] Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Disqualify a player — remove from team (if sold) with purse refund
 * @returns {{ success: boolean, error?: string }}
 */
async function disqualifyPlayer(auctionId, playerId, reason, adminUserId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction || !['live', 'paused'].includes(auction.status)) {
    return { success: false, error: 'Auction must be live or paused' };
  }

  const player = await AuctionPlayer.findById(playerId);
  if (!player || player.auctionId.toString() !== auctionId.toString()) {
    return { success: false, error: 'Player not found in this auction' };
  }

  if (player.isDisqualified) {
    return { success: false, error: 'Player is already disqualified' };
  }

  const previousStatus = player.status;
  const previousSoldTo = player.soldTo;
  const previousSoldAmount = player.soldAmount;
  let refundAmount = 0;

  // If player was sold, refund the team
  if (previousStatus === 'sold' && player.soldTo) {
    const team = await AuctionTeam.findById(player.soldTo);
    if (team) {
      refundAmount = player.soldAmount || 0;
      team.purseRemaining += refundAmount;
      team.players = team.players.filter(
        p => p.playerId.toString() !== playerId.toString()
      );
      await team.save();

      // Broadcast team update
      const ns = io.of('/auction');
      const teamMaxBid = calculateMaxBid(team, auction.config);
      ns.to(`team:${team._id}`).emit('team:update', {
        purseRemaining: team.purseRemaining,
        maxBid: teamMaxBid,
        squadSize: (team.players?.length || 0) + (team.retainedPlayers?.length || 0),
        canBid: teamMaxBid >= auction.config.basePrice,
      });
    }
  }

  // If player was in pool, remove from remaining
  if (previousStatus === 'pool') {
    auction.remainingPlayerIds = auction.remainingPlayerIds.filter(
      id => id.toString() !== playerId.toString()
    );
    await auction.save();
  }

  // Update player
  await AuctionPlayer.findByIdAndUpdate(playerId, {
    status: 'disqualified',
    isDisqualified: true,
    disqualifiedReason: reason || 'Disqualified by admin',
    soldTo: null,
    soldAmount: null,
  });

  // Log action event
  const seq = await ActionEvent.getNextSequence(auction._id);
  await ActionEvent.create({
    auctionId: auction._id,
    sequenceNumber: seq,
    type: 'PLAYER_DISQUALIFIED',
    payload: {
      playerId,
      teamId: previousSoldTo,
      refundAmount,
      reason,
    },
    reversalPayload: {
      playerId,
      previousStatus,
      previousSoldTo,
      previousSoldAmount,
      previousRound: player.soldInRound,
    },
    performedBy: adminUserId,
    isPublic: true,
    publicMessage: `${player.name} disqualified${reason ? ': ' + reason : ''}`,
  });

  // Broadcast
  const ns = io.of('/auction');
  ns.to(`auction:${auctionId}`).emit('player:disqualified', {
    playerId,
    playerName: player.name,
    reason,
    refundAmount,
    teamId: previousSoldTo,
  });

  // Rebuild state
  const newState = await buildAuctionState(auction);
  ns.to(`auction:${auctionId}`).emit('auction:state', newState);

  return { success: true };
}

/**
 * Send admin announcement to all viewers
 */
async function sendAnnouncement(auctionId, message, io) {
  const ns = io.of('/auction');
  ns.to(`auction:${auctionId}`).emit('admin:announcement', {
    message,
    timestamp: new Date(),
  });
}

module.exports = {
  buildAuctionState,
  startAuction,
  pickNextPlayer,
  processBid,
  pauseAuction,
  resumeAuction,
  skipPlayer,
  completeAuction,
  sendAnnouncement,
  clearAuctionTimer,
  getBidIncrement,
  calculateMaxBid,
  undoLastAction,
  disqualifyPlayer,
};
