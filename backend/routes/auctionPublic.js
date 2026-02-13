/**
 * @fileoverview Auction Public/SEO Routes
 * 
 * Public endpoints for auction data — no authentication required.
 * Used by the auction-frontend (Next.js SSR) and seo-site for crawlable pages.
 * 
 * @module routes/auctionPublic
 */

const express = require('express');
const router = express.Router();
const { loadPublicAuction } = require('../middleware/auctionAuth');
const Auction = require('../models/Auction');
const AuctionTeam = require('../models/AuctionTeam');
const AuctionPlayer = require('../models/AuctionPlayer');

// ============================================================
// LIST PUBLIC AUCTIONS (for /explore page and cricsmart.in/auction)
// ============================================================

/**
 * GET /api/seo/auctions
 * List publicly visible auctions (not draft, not deleted).
 * Supports filtering by status and pagination.
 */
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      isDeleted: false,
      isActive: true,
      status: { $ne: 'draft' }, // exclude drafts from public view
    };

    if (status) {
      // Allow filtering by specific status or multiple statuses
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').filter(s => s !== 'draft') };
      } else if (status !== 'draft') {
        filter.status = status;
      }
    }

    const [auctions, total] = await Promise.all([
      Auction.find(filter)
        .select('name slug description status config.basePrice config.purseValue scheduledStartTime startedAt completedAt createdAt')
        .sort({ startedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Auction.countDocuments(filter),
    ]);

    // Enrich with team count and player count
    const enriched = await Promise.all(auctions.map(async (auction) => {
      const [teamCount, playerCount] = await Promise.all([
        AuctionTeam.countDocuments({ auctionId: auction._id, isActive: true }),
        AuctionPlayer.countDocuments({ auctionId: auction._id }),
      ]);
      return { ...auction, teamCount, playerCount };
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasMore: skip + auctions.length < total,
      },
    });
  } catch (error) {
    console.error('List public auctions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET SINGLE AUCTION (Public view by slug)
// ============================================================

/**
 * GET /api/seo/auctions/:slug
 * Get public auction data by slug (for SSR pages and JSON-LD).
 */
router.get('/:slug', loadPublicAuction, async (req, res) => {
  try {
    const auction = req.auction;

    const [teams, playerStats, soldPlayers] = await Promise.all([
      AuctionTeam.find({ auctionId: auction._id, isActive: true })
        .select('name shortName logo primaryColor secondaryColor purseValue purseRemaining retainedPlayers')
        .lean(),
      AuctionPlayer.aggregate([
        { $match: { auctionId: auction._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AuctionPlayer.find({ auctionId: auction._id, status: 'sold' })
        .select('name role playerNumber soldAmount soldInRound soldTo imageUrl')
        .populate('soldTo', 'name shortName primaryColor logo')
        .sort({ soldAmount: -1 })
        .limit(20)
        .lean(),
    ]);

    const stats = {};
    playerStats.forEach(s => { stats[s._id] = s.count; });

    // Enrich teams with squad size
    const enrichedTeams = teams.map(team => ({
      ...team,
      squadSize: (team.retainedPlayers ? team.retainedPlayers.length : 0),
    }));

    // For teams, also count bought players
    for (const team of enrichedTeams) {
      const boughtCount = await AuctionPlayer.countDocuments({
        auctionId: auction._id,
        soldTo: team._id,
        status: 'sold',
      });
      team.squadSize += boughtCount;
      team.boughtCount = boughtCount;
    }

    res.json({
      success: true,
      data: {
        _id: auction._id,
        name: auction.name,
        slug: auction.slug,
        description: auction.description,
        status: auction.status,
        config: {
          basePrice: auction.config.basePrice,
          purseValue: auction.config.purseValue,
          minSquadSize: auction.config.minSquadSize,
          maxSquadSize: auction.config.maxSquadSize,
          maxRounds: auction.config.maxRounds,
        },
        playerFields: auction.displayConfig?.playerFields || [],
        currentRound: auction.currentRound,
        scheduledStartTime: auction.scheduledStartTime,
        startedAt: auction.startedAt,
        completedAt: auction.completedAt,
        teams: enrichedTeams,
        playerStats: stats,
        topSoldPlayers: soldPlayers,
      },
    });
  } catch (error) {
    console.error('Get public auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET AUCTION TEAMS (Public)
// ============================================================

/**
 * GET /api/seo/auctions/:slug/teams
 * Get team squads for an auction (public view).
 */
router.get('/:slug/teams', loadPublicAuction, async (req, res) => {
  try {
    const teams = await AuctionTeam.find({
      auctionId: req.auction._id,
      isActive: true,
    })
      .select('name shortName logo primaryColor secondaryColor purseValue purseRemaining retainedPlayers')
      .lean();

    // Enrich each team with bought players
    const enriched = await Promise.all(teams.map(async (team) => {
      const boughtPlayers = await AuctionPlayer.find({
        auctionId: req.auction._id,
        soldTo: team._id,
        status: 'sold',
      })
        .select('name role playerNumber soldAmount soldInRound imageUrl customFields')
        .sort({ soldAmount: -1 })
        .lean();

      return {
        ...team,
        boughtPlayers,
        squadSize: boughtPlayers.length + (team.retainedPlayers ? team.retainedPlayers.length : 0),
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Get public teams error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET AUCTION ANALYTICS (Public, post-completion)
// ============================================================

/**
 * GET /api/seo/auctions/:slug/analytics
 * Get post-auction analytics (public view).
 */
router.get('/:slug/analytics', loadPublicAuction, async (req, res) => {
  try {
    if (!['completed', 'trade_window', 'finalized'].includes(req.auction.status)) {
      return res.status(400).json({
        success: false,
        error: 'Analytics are only available after auction completion',
      });
    }

    const [
      topSold,
      teamSpending,
      roleBreakdown,
      unsoldPlayers,
      roundStats,
    ] = await Promise.all([
      // Top 10 highest sold players
      AuctionPlayer.find({ auctionId: req.auction._id, status: 'sold' })
        .select('name role playerNumber soldAmount soldInRound imageUrl')
        .populate('soldTo', 'name shortName primaryColor logo')
        .sort({ soldAmount: -1 })
        .limit(10)
        .lean(),

      // Team spending breakdown
      AuctionTeam.find({ auctionId: req.auction._id, isActive: true })
        .select('name shortName primaryColor purseValue purseRemaining logo')
        .lean(),

      // Role-wise average price
      AuctionPlayer.aggregate([
        { $match: { auctionId: req.auction._id, status: 'sold' } },
        { $group: {
          _id: '$role',
          avgPrice: { $avg: '$soldAmount' },
          maxPrice: { $max: '$soldAmount' },
          count: { $sum: 1 },
        }},
      ]),

      // Unsold players
      AuctionPlayer.find({ auctionId: req.auction._id, status: 'unsold' })
        .select('name role playerNumber imageUrl roundHistory')
        .lean(),

      // Round-wise stats
      AuctionPlayer.aggregate([
        { $match: { auctionId: req.auction._id, status: 'sold' } },
        { $group: {
          _id: '$soldInRound',
          count: { $sum: 1 },
          avgPrice: { $avg: '$soldAmount' },
          totalSpent: { $sum: '$soldAmount' },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Calculate value picks (bought at base price with high stats)
    const basePrice = req.auction.config.basePrice;
    const valuePicks = await AuctionPlayer.find({
      auctionId: req.auction._id,
      status: 'sold',
      soldAmount: basePrice,
    })
      .select('name role playerNumber soldAmount imageUrl')
      .populate('soldTo', 'name shortName primaryColor')
      .lean();

    // Calculate premium picks (highest multiplier over base price)
    const premiumPicks = topSold.map(p => ({
      ...p,
      multiplier: Math.round((p.soldAmount / basePrice) * 10) / 10,
    })).filter(p => p.multiplier > 1).slice(0, 5);

    res.json({
      success: true,
      data: {
        topSoldPlayers: topSold,
        teamSpending: teamSpending.map(t => ({
          ...t,
          spent: t.purseValue - t.purseRemaining,
          utilization: Math.round(((t.purseValue - t.purseRemaining) / t.purseValue) * 100),
        })),
        roleBreakdown,
        unsoldPlayers,
        roundStats,
        valuePicks,
        premiumPicks,
        totalPlayersSold: topSold.length,
        totalPlayersUnsold: unsoldPlayers.length,
        totalSpent: teamSpending.reduce((sum, t) => sum + (t.purseValue - t.purseRemaining), 0),
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// SITEMAP DATA
// ============================================================

/**
 * GET /api/seo/sitemap/auctions
 * Get all auction slugs for sitemap generation.
 */
router.get('/sitemap/auctions', async (req, res) => {
  try {
    // Note: This route is registered BEFORE the /:slug route in the parent router
    const auctions = await Auction.find({
      isDeleted: false,
      isActive: true,
      status: { $ne: 'draft' },
    })
      .select('slug status updatedAt')
      .lean();

    res.json({
      success: true,
      slugs: auctions.map(a => ({
        slug: a.slug,
        status: a.status,
        lastModified: a.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Sitemap auctions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// UPCOMING PLAYERS (Public spectator view)
// ============================================================

/**
 * GET /api/seo/auctions/:slug/players
 * Get player pool for public view (full details, random order hidden).
 */
router.get('/:slug/players', loadPublicAuction, async (req, res) => {
  try {
    const { status, role, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { auctionId: req.auction._id };
    if (status) filter.status = status;
    if (role) filter.role = role;

    const [players, total] = await Promise.all([
      AuctionPlayer.find(filter)
        .select('name role playerNumber imageUrl customFields status soldAmount soldInRound')
        .populate('soldTo', 'name shortName primaryColor logo')
        .sort({ playerNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuctionPlayer.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: players,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasMore: skip + players.length < total,
      },
    });
  } catch (error) {
    console.error('Get public players error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// PUBLIC TRADES (executed trades only — for public auction page)
// ============================================================

/**
 * GET /api/seo/auctions/:slug/trades
 * Get executed trades for a public auction page.
 */
router.get('/:slug/trades', loadPublicAuction, async (req, res) => {
  try {
    const AuctionTrade = require('../models/AuctionTrade');
    const trades = await AuctionTrade.find({
      auctionId: req.auction._id,
      status: 'executed',
    })
      .sort({ executedAt: -1 })
      .lean();

    // Filter out legacy trades that lack bilateral fields
    const validTrades = trades.filter(t => t.initiatorTeamId && t.counterpartyTeamId);

    // Enrich with team names
    const teamIds = [...new Set(validTrades.flatMap(t => [t.initiatorTeamId.toString(), t.counterpartyTeamId.toString()]))];
    const teams = await AuctionTeam.find({ _id: { $in: teamIds } })
      .select('name shortName primaryColor')
      .lean();
    const teamMap = {};
    teams.forEach(t => { teamMap[t._id.toString()] = t; });

    const enriched = validTrades.map(t => ({
      ...t,
      initiatorTeam: teamMap[t.initiatorTeamId.toString()] || { name: 'Unknown' },
      counterpartyTeam: teamMap[t.counterpartyTeamId.toString()] || { name: 'Unknown' },
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Get public trades error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
