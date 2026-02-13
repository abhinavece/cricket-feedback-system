/**
 * @fileoverview Auction CRUD & Lifecycle Routes
 * 
 * Handles auction creation, configuration, admin management,
 * and lifecycle transitions (draft → configured → live → paused → completed → trade_window → finalized).
 * 
 * All admin routes require: auth + resolveAuctionAdmin
 * Create route requires: auth only (creator becomes owner)
 * 
 * @module routes/auction
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const { resolveAuctionAdmin, requireAuctionOwner } = require('../middleware/auctionAuth');
const Auction = require('../models/Auction');
const AuctionTeam = require('../models/AuctionTeam');
const AuctionPlayer = require('../models/AuctionPlayer');
const ActionEvent = require('../models/ActionEvent');

const coverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ============================================================
// CREATE AUCTION
// ============================================================

/**
 * POST /api/v1/auctions
 * Create a new auction. Creator becomes owner.
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, config } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Auction name is required' });
    }

    if (!config || !config.basePrice || !config.purseValue || !config.minSquadSize || !config.maxSquadSize) {
      return res.status(400).json({
        success: false,
        error: 'Config is required with basePrice, purseValue, minSquadSize, maxSquadSize',
      });
    }

    if (config.minSquadSize > config.maxSquadSize) {
      return res.status(400).json({
        success: false,
        error: 'minSquadSize cannot be greater than maxSquadSize',
      });
    }

    // Check user doesn't already have a LIVE auction
    const liveAuction = await Auction.findOne({
      createdBy: req.user._id,
      status: 'live',
      isDeleted: false,
    });
    if (liveAuction) {
      return res.status(409).json({
        success: false,
        error: 'You already have a live auction. Complete or end it before creating a new one.',
      });
    }

    // Apply bid increment preset if specified
    if (config.bidIncrementPreset && config.bidIncrementPreset !== 'custom') {
      const preset = Auction.BID_INCREMENT_PRESETS[config.bidIncrementPreset];
      if (preset) {
        config.bidIncrementTiers = preset.tiers;
      }
    }

    const slug = await generateUniqueSlug(name);

    const auction = new Auction({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      config,
      createdBy: req.user._id,
      admins: [{
        userId: req.user._id,
        role: 'owner',
        email: req.user.email,
      }],
    });

    await auction.save();

    res.status(201).json({
      success: true,
      data: auction,
    });
  } catch (error) {
    console.error('Create auction error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: 'An auction with this slug already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET AUCTIONS (My Auctions - Admin)
// ============================================================

/**
 * GET /api/v1/auctions
 * List auctions where the authenticated user is an admin.
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      'admins.userId': req.user._id,
      isDeleted: false,
    };
    if (status) {
      filter.status = status;
    }

    const [auctions, total] = await Promise.all([
      Auction.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Auction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: auctions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasMore: skip + auctions.length < total,
      },
    });
  } catch (error) {
    console.error('List auctions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// UPLOAD COVER IMAGE
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/upload-cover
 * Upload an auction cover image to GCS. Auto-resizes to 800x800 max, converts to WebP.
 */
router.post('/:auctionId/upload-cover', auth, resolveAuctionAdmin, coverUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const { uploadImage } = require('../services/imageUpload');
    const gcsPath = `auctions/${req.auction._id}/cover`;
    const { imageUrl } = await uploadImage(
      req.file.buffer,
      req.file.mimetype,
      gcsPath,
      req.auction.coverImage || undefined,
    );

    req.auction.coverImage = imageUrl;
    await req.auction.save();

    res.json({ success: true, data: { coverImage: imageUrl } });
  } catch (error) {
    console.error('Upload cover image error:', error);
    res.status(error.message.includes('Invalid') || error.message.includes('too small') || error.message.includes('exceeds')
      ? 400 : 500
    ).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET SINGLE AUCTION (Admin)
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId
 * Get full auction details (admin view).
 */
router.get('/:auctionId', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const [teams, playerStats] = await Promise.all([
      AuctionTeam.find({ auctionId: req.auction._id, isActive: true })
        .select('-accessCode')
        .lean(),
      AuctionPlayer.aggregate([
        { $match: { auctionId: req.auction._id } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
        }},
      ]),
    ]);

    const stats = {};
    playerStats.forEach(s => { stats[s._id] = s.count; });

    const responseData = {
      ...req.auction.toObject(),
      teams,
      playerStats: stats,
    };

    // Include trade stats for post-auction states
    if (['completed', 'trade_window', 'finalized'].includes(req.auction.status)) {
      const AuctionTrade = require('../models/AuctionTrade');
      const tradeCounts = await AuctionTrade.aggregate([
        { $match: { auctionId: req.auction._id, initiatorTeamId: { $exists: true } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const tradeStats = {};
      tradeCounts.forEach(s => { tradeStats[s._id] = s.count; });
      responseData.tradeStats = tradeStats;
    }

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// UPDATE AUCTION CONFIG (Draft only)
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/config
 * Update auction configuration. Only allowed in draft status.
 */
router.patch('/:auctionId/config', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (req.auction.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Configuration can only be updated in draft status',
      });
    }

    const allowedFields = [
      'name', 'description', 'config', 'displayConfig', 'scheduledStartTime',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate config if provided
    if (updates.config) {
      const c = updates.config;
      if (c.minSquadSize && c.maxSquadSize && c.minSquadSize > c.maxSquadSize) {
        return res.status(400).json({
          success: false,
          error: 'minSquadSize cannot be greater than maxSquadSize',
        });
      }

      // Apply preset if changed
      if (c.bidIncrementPreset && c.bidIncrementPreset !== 'custom') {
        const preset = Auction.BID_INCREMENT_PRESETS[c.bidIncrementPreset];
        if (preset) {
          c.bidIncrementTiers = preset.tiers;
        }
      }

      // Merge with existing config
      updates.config = { ...req.auction.config.toObject(), ...c };
    }

    Object.assign(req.auction, updates);
    await req.auction.save();

    res.json({ success: true, data: req.auction });
  } catch (error) {
    console.error('Update auction config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DISPLAY CONFIG: Player field configuration
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/display-config
 * Get the current player field display configuration.
 */
router.get('/:auctionId/display-config', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        playerFields: req.auction.displayConfig?.playerFields || [],
      },
    });
  } catch (error) {
    console.error('Get display config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/v1/auctions/:auctionId/display-config
 * Update player field display configuration (reorder, rename, toggle visibility).
 * Allowed in any status — this is display-only config, not auction logic.
 */
router.patch('/:auctionId/display-config', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { playerFields } = req.body;

    if (!Array.isArray(playerFields)) {
      return res.status(400).json({
        success: false,
        error: 'playerFields must be an array',
      });
    }

    // Validate each field entry
    const validTypes = ['text', 'number', 'url', 'date'];
    for (const field of playerFields) {
      if (!field.key || !field.label) {
        return res.status(400).json({
          success: false,
          error: 'Each field must have a key and label',
        });
      }
      if (field.type && !validTypes.includes(field.type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid type "${field.type}". Must be one of: ${validTypes.join(', ')}`,
        });
      }
    }

    req.auction.displayConfig = { playerFields };
    await req.auction.save();

    res.json({
      success: true,
      data: {
        playerFields: req.auction.displayConfig.playerFields,
      },
    });
  } catch (error) {
    console.error('Update display config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIFECYCLE: CONFIGURE (Lock config)
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/configure
 * Lock auction configuration. Moves from draft → configured.
 */
router.post('/:auctionId/configure', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (req.auction.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: `Cannot configure auction in '${req.auction.status}' status. Must be 'draft'.`,
      });
    }

    // Validate readiness
    const teams = await AuctionTeam.countDocuments({ auctionId: req.auction._id, isActive: true });
    if (teams < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 teams are required to configure the auction',
      });
    }

    const players = await AuctionPlayer.countDocuments({
      auctionId: req.auction._id,
      status: { $in: ['pool', 'unsold'] },
      isDisqualified: false,
    });
    if (players < teams) {
      return res.status(400).json({
        success: false,
        error: 'Need at least as many players as teams in the pool',
      });
    }

    req.auction.status = 'configured';
    await req.auction.save();

    res.json({ success: true, data: req.auction });
  } catch (error) {
    console.error('Configure auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIFECYCLE: GO LIVE
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/go-live
 * Start the auction. Moves from configured → live.
 * Calls the auction engine to populate pool, pick the first player, and broadcast via Socket.IO.
 */
router.post('/:auctionId/go-live', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (req.auction.status !== 'configured') {
      return res.status(400).json({
        success: false,
        error: `Cannot go live from '${req.auction.status}' status. Must be 'configured'.`,
      });
    }

    const engine = require('../services/auctionEngine');
    const io = req.app.get('io');

    await engine.startAuction(req.params.auctionId, io);

    // Re-fetch updated auction
    const updated = await Auction.findById(req.params.auctionId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Go live error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIFECYCLE: PAUSE
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/pause
 * Pause the auction. Delegates to engine for timer cleanup and Socket.IO broadcast.
 */
router.post('/:auctionId/pause', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (req.auction.status !== 'live') {
      return res.status(400).json({
        success: false,
        error: `Cannot pause from '${req.auction.status}' status. Must be 'live'.`,
      });
    }

    const engine = require('../services/auctionEngine');
    const io = req.app.get('io');

    await engine.pauseAuction(req.params.auctionId, req.user._id, req.body?.reason, io);

    const updated = await Auction.findById(req.params.auctionId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Pause auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIFECYCLE: RESUME
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/resume
 * Resume a paused auction. Picks next player via engine.
 */
router.post('/:auctionId/resume', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (req.auction.status !== 'paused') {
      return res.status(400).json({
        success: false,
        error: `Cannot resume from '${req.auction.status}' status. Must be 'paused'.`,
      });
    }

    const engine = require('../services/auctionEngine');
    const io = req.app.get('io');

    await engine.resumeAuction(req.params.auctionId, req.user._id, io);

    const updated = await Auction.findById(req.params.auctionId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Resume auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIFECYCLE: COMPLETE
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/complete
 * End the auction. Delegates to engine for timer cleanup and Socket.IO broadcast.
 */
router.post('/:auctionId/complete', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (!['live', 'paused'].includes(req.auction.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot complete from '${req.auction.status}' status. Must be 'live' or 'paused'.`,
      });
    }

    const engine = require('../services/auctionEngine');
    const io = req.app.get('io');

    await engine.completeAuction(req.params.auctionId, io, req.body?.reason || 'Ended by admin');

    const updated = await Auction.findById(req.params.auctionId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Complete auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIFECYCLE: OPEN TRADE WINDOW
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/open-trade-window
 * Open the trade window after auction completes. Moves from completed → trade_window.
 */
router.post('/:auctionId/open-trade-window', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (req.auction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: `Cannot open trade window from '${req.auction.status}' status. Must be 'completed'.`,
      });
    }

    const tradeWindowHours = req.auction.config.tradeWindowHours || 48;
    req.auction.status = 'trade_window';
    req.auction.tradeWindowEndsAt = new Date(Date.now() + tradeWindowHours * 60 * 60 * 1000);
    await req.auction.save();

    // Log action event
    const lastEvent = await ActionEvent.findOne({ auctionId: req.auction._id })
      .sort({ sequenceNumber: -1 });
    const seq = (lastEvent?.sequenceNumber || 0) + 1;

    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: seq,
      type: 'TRADE_WINDOW_OPENED',
      payload: { tradeWindowEndsAt: req.auction.tradeWindowEndsAt, openedBy: req.user._id },
      reversalPayload: {},
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: `Trade window opened for ${tradeWindowHours} hours`,
    });

    // Broadcast via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      ns.to(`auction:${req.params.auctionId}`).emit('auction:status_change', {
        status: 'trade_window',
        tradeWindowEndsAt: req.auction.tradeWindowEndsAt,
      });
    }

    res.json({ success: true, data: req.auction });
  } catch (error) {
    console.error('Open trade window error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIFECYCLE: FINALIZE
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/finalize
 * Finalize the auction. No more changes allowed.
 * Moves from completed or trade_window → finalized.
 * Rejects any pending trades before finalizing.
 */
router.post('/:auctionId/finalize', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (!['completed', 'trade_window'].includes(req.auction.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot finalize from '${req.auction.status}' status. Must be 'completed' or 'trade_window'.`,
      });
    }

    // Auto-expire any non-executed trades
    const AuctionTrade = require('../models/AuctionTrade');
    const pendingTrades = await AuctionTrade.updateMany(
      {
        auctionId: req.auction._id,
        status: { $in: ['pending_counterparty', 'both_agreed'] },
      },
      {
        $set: {
          status: 'expired',
          cancellationReason: 'Auction finalized — all pending trades expired',
        },
      }
    );

    req.auction.status = 'finalized';
    req.auction.finalizedAt = new Date();
    await req.auction.save();

    // Log action event
    const lastEvent = await ActionEvent.findOne({ auctionId: req.auction._id })
      .sort({ sequenceNumber: -1 });
    const seq = (lastEvent?.sequenceNumber || 0) + 1;

    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: seq,
      type: 'AUCTION_FINALIZED',
      payload: {
        finalizedBy: req.user._id,
        pendingTradesRejected: pendingTrades.modifiedCount,
      },
      reversalPayload: {},
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: 'Auction finalized — results are now permanent',
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      const ns = io.of('/auction');
      ns.to(`auction:${req.params.auctionId}`).emit('auction:status_change', {
        status: 'finalized',
      });
    }

    res.json({
      success: true,
      data: req.auction,
      message: `Auction finalized. ${pendingTrades.modifiedCount} pending trade(s) expired.`,
    });
  } catch (error) {
    console.error('Finalize auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN MANAGEMENT
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/admins
 * Invite a co-admin by email.
 */
router.post('/:auctionId/admins', auth, resolveAuctionAdmin, requireAuctionOwner, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check if already an admin
    const existing = req.auction.admins.find(a => a.email === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, error: 'This user is already an admin' });
    }

    // Find user by email (they may not have logged in yet)
    const User = require('../models/User');
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

    req.auction.admins.push({
      userId: user ? user._id : new (require('mongoose')).Types.ObjectId(),
      role: 'admin',
      email: email.toLowerCase(),
    });

    await req.auction.save();

    res.json({
      success: true,
      message: user
        ? `${user.name} added as auction admin`
        : `Invitation sent to ${email}. They will have admin access upon login.`,
      data: req.auction.admins,
    });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/v1/auctions/:auctionId/admins/:userId
 * Remove a co-admin. Owner cannot be removed.
 */
router.delete('/:auctionId/admins/:userId', auth, resolveAuctionAdmin, requireAuctionOwner, async (req, res) => {
  try {
    const targetIdx = req.auction.admins.findIndex(
      a => a.userId.toString() === req.params.userId
    );

    if (targetIdx === -1) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }

    if (req.auction.admins[targetIdx].role === 'owner') {
      return res.status(400).json({ success: false, error: 'Cannot remove the auction owner' });
    }

    req.auction.admins.splice(targetIdx, 1);
    await req.auction.save();

    res.json({ success: true, data: req.auction.admins });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DELETE AUCTION (Soft delete, owner only)
// ============================================================

/**
 * DELETE /api/v1/auctions/:auctionId
 * Soft-delete an auction. Only owner, only in draft status.
 */
router.delete('/:auctionId', auth, resolveAuctionAdmin, requireAuctionOwner, async (req, res) => {
  try {
    if (req.auction.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Only draft auctions can be deleted',
      });
    }

    req.auction.isDeleted = true;
    req.auction.deletedAt = new Date();
    req.auction.deletedBy = req.user._id;
    await req.auction.save();

    res.json({ success: true, message: 'Auction deleted' });
  } catch (error) {
    console.error('Delete auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// AUCTION LIFECYCLE ENDPOINTS
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/start
 * Start the auction (configured → live)
 */
router.post('/:auctionId/start', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const engine = require('../services/auctionEngine');
    const io = req.app.get('io');
    
    await engine.startAuction(req.params.auctionId, io);
    
    res.json({ success: true, message: 'Auction started' });
  } catch (error) {
    console.error('Start auction error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/auctions/:auctionId/pause
 * Pause the auction
 */
router.post('/:auctionId/pause', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const engine = require('../services/auctionEngine');
    const io = req.app.get('io');
    
    await engine.pauseAuction(req.params.auctionId, req.user._id, req.body?.reason, io);
    
    res.json({ success: true, message: 'Auction paused' });
  } catch (error) {
    console.error('Pause auction error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/auctions/:auctionId/complete
 * Complete the auction
 */
router.post('/:auctionId/complete', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const engine = require('../services/auctionEngine');
    const io = req.app.get('io');
    
    await engine.completeAuction(req.params.auctionId, io, req.body?.reason || 'Ended by admin');
    
    res.json({ success: true, message: 'Auction completed' });
  } catch (error) {
    console.error('Complete auction error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET BID INCREMENT PRESETS
// ============================================================

/**
 * GET /api/v1/auctions/presets/bid-increments
 * Get available bid increment tier presets.
 */
router.get('/presets/bid-increments', (req, res) => {
  res.json({
    success: true,
    data: Auction.BID_INCREMENT_PRESETS,
  });
});

// ============================================================
// TEAM LOGIN (standalone — no auctionId needed for magic links)
// ============================================================

/**
 * POST /api/v1/auctions/team-login
 * Authenticate a team using magic link accessToken or accessCode+auctionId.
 * Returns a team-scoped JWT for WebSocket auth.
 */
router.post('/team-login', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const { accessToken, accessCode, auctionId } = req.body;

    let team;

    if (accessToken) {
      // Magic link login — find team by accessToken
      team = await AuctionTeam.findOne({ accessToken, isActive: true })
        .select('+accessCode');
    } else if (accessCode && auctionId) {
      // Access code login: find all teams in auction, compare codes
      const teams = await AuctionTeam.find({ auctionId, isActive: true })
        .select('+accessCode');
      for (const t of teams) {
        const match = await bcrypt.compare(accessCode, t.accessCode);
        if (match) { team = t; break; }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide either accessToken or accessCode+auctionId',
      });
    }

    if (!team) {
      return res.status(401).json({ success: false, error: 'Invalid access credentials' });
    }

    // Generate team-scoped JWT
    const token = jwt.sign(
      { teamId: team._id, auctionId: team.auctionId.toString(), teamName: team.name, type: 'team' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      auctionId: team.auctionId.toString(),
      teamName: team.name,
      team: {
        _id: team._id,
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        primaryColor: team.primaryColor,
        auctionId: team.auctionId,
      },
    });
  } catch (error) {
    console.error('Team login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// CLONE AUCTION
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/clone
 * Clone an auction: copies config, display config, teams (without players/purse state), and all players (reset to pool).
 * Creates a new draft auction with a new slug.
 */
router.post('/:auctionId/clone', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const source = req.auction;
    const { name } = req.body;
    const cloneName = name || `${source.name} (Copy)`;

    // Generate unique slug
    const slug = await generateUniqueSlug(cloneName);

    // Create new auction
    const newAuction = new Auction({
      name: cloneName,
      slug,
      description: source.description || '',
      status: 'draft',
      config: {
        basePrice: source.config.basePrice,
        purseValue: source.config.purseValue,
        bidIncrementTiers: source.config.bidIncrementTiers,
        bidIncrementPreset: source.config.bidIncrementPreset,
        timerDuration: source.config.timerDuration,
        bidResetTimer: source.config.bidResetTimer,
        goingOnceTimer: source.config.goingOnceTimer,
        goingTwiceTimer: source.config.goingTwiceTimer,
        minSquadSize: source.config.minSquadSize,
        maxSquadSize: source.config.maxSquadSize,
        maxRounds: source.config.maxRounds,
        playerRevealDelay: source.config.playerRevealDelay,
        retentionEnabled: source.config.retentionEnabled,
        maxRetentions: source.config.maxRetentions,
        retentionCost: source.config.retentionCost,
        maxTradesPerTeam: source.config.maxTradesPerTeam,
        tradeWindowHours: source.config.tradeWindowHours,
        tradeSettlementEnabled: source.config.tradeSettlementEnabled,
        maxUndoActions: source.config.maxUndoActions,
      },
      displayConfig: source.displayConfig ? {
        playerFields: (source.displayConfig.playerFields || []).map(f => ({
          key: f.key,
          label: f.label,
          type: f.type,
          showOnCard: f.showOnCard,
          showInList: f.showInList,
          sortable: f.sortable,
          order: f.order,
        })),
      } : {},
      admins: [{ userId: req.user._id, role: 'owner', email: req.user.email }],
      createdBy: req.user._id,
      organizationId: source.organizationId || null,
    });

    await newAuction.save();

    // Clone teams (reset purse, no players)
    const sourceTeams = await AuctionTeam.find({ auctionId: source._id, isActive: true }).lean();
    const teamBulk = sourceTeams.map(t => ({
      auctionId: newAuction._id,
      name: t.name,
      shortName: t.shortName,
      primaryColor: t.primaryColor,
      logoUrl: t.logoUrl || '',
      purseValue: source.config.purseValue,
      purseRemaining: source.config.purseValue,
      players: [],
      retainedPlayers: [],
      accessToken: require('crypto').randomBytes(32).toString('hex'),
      isActive: true,
    }));
    if (teamBulk.length > 0) {
      await AuctionTeam.insertMany(teamBulk);
    }

    // Clone players (reset to pool status)
    const sourcePlayers = await AuctionPlayer.find({ auctionId: source._id, isDeleted: { $ne: true } }).lean();

    // Get max playerNumber for numbering
    let playerNum = 0;
    const playerBulk = sourcePlayers.map(p => {
      playerNum++;
      return {
        auctionId: newAuction._id,
        playerNumber: playerNum,
        name: p.name,
        role: p.role,
        imageUrl: p.imageUrl || '',
        customFields: p.customFields || {},
        status: 'pool',
        soldTo: null,
        soldAmount: null,
        soldInRound: null,
        importSource: 'manual',
        isDisqualified: false,
        isIneligible: false,
        isDeleted: false,
      };
    });
    if (playerBulk.length > 0) {
      await AuctionPlayer.insertMany(playerBulk);
    }

    res.json({
      success: true,
      data: {
        _id: newAuction._id,
        name: newAuction.name,
        slug: newAuction.slug,
        teamsCloned: teamBulk.length,
        playersCloned: playerBulk.length,
      },
    });
  } catch (error) {
    console.error('Clone auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// AUDIT LOG VIEWER
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/audit-log
 * List action events with optional filters: type, page
 */
router.get('/:auctionId/audit-log', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const query = { auctionId: req.auction._id };
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      ActionEvent.find(query)
        .sort({ sequenceNumber: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('performedBy', 'name email')
        .lean(),
      ActionEvent.countDocuments(query),
    ]);

    res.json({ success: true, data: events, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// BID HISTORY VIEWER
// ============================================================

const BidAuditLog = require('../models/BidAuditLog');

/**
 * GET /api/v1/auctions/:auctionId/bid-history
 * List bid audit logs with optional filters: playerId, teamId, type
 */
router.get('/:auctionId/bid-history', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { playerId, teamId, type, page = 1, limit = 50 } = req.query;
    const query = { auctionId: req.auction._id };
    if (playerId) query.playerId = playerId;
    if (teamId) query.teamId = teamId;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      BidAuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('teamId', 'name shortName primaryColor')
        .populate('playerId', 'name playerNumber role')
        .lean(),
      BidAuditLog.countDocuments(query),
    ]);

    res.json({ success: true, data: logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    console.error('Bid history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/auctions/:auctionId/bid-history/:logId/void
 * Void an accepted bid (admin override). Does NOT reverse the sale — use return-to-pool for that.
 * This just marks the log entry as voided for audit purposes.
 */
router.post('/:auctionId/bid-history/:logId/void', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const log = await BidAuditLog.findOne({ _id: req.params.logId, auctionId: req.auction._id });
    if (!log) {
      return res.status(404).json({ success: false, error: 'Bid log not found' });
    }
    if (log.type === 'bid_voided') {
      return res.status(400).json({ success: false, error: 'Bid is already voided' });
    }

    log.type = 'bid_voided';
    log.reason = reason || 'Voided by admin';
    await log.save();

    // Log action
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'MANUAL_OVERRIDE',
      payload: {
        action: 'BID_VOIDED',
        bidLogId: log._id,
        playerId: log.playerId,
        teamId: log.teamId,
        amount: log.attemptedAmount,
        reason: reason || '',
      },
      performedBy: req.user._id,
      isPublic: false,
    });

    res.json({ success: true, data: log });
  } catch (error) {
    console.error('Void bid error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// EXPORT AUCTION RESULTS (XLSX)
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/export
 * Export auction results as XLSX with multiple sheets.
 */
router.get('/:auctionId/export', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const auction = req.auction;

    // Fetch all data
    const [teams, players] = await Promise.all([
      AuctionTeam.find({ auctionId: auction._id, isActive: true }).lean(),
      AuctionPlayer.find({ auctionId: auction._id, isDeleted: { $ne: true } }).populate('soldTo', 'name shortName').lean(),
    ]);

    // Get display config for custom field labels
    const displayConfig = auction.displayConfig || {};
    const playerFields = (displayConfig.playerFields || []).sort((a, b) => a.order - b.order);

    // --- Sheet 1: All Players ---
    const allPlayersData = players.map(p => {
      const row = {
        '#': p.playerNumber,
        'Name': p.name,
        'Role': p.role,
        'Status': p.status,
        'Sold To': p.soldTo?.name || '',
        'Sold Amount': p.soldAmount || '',
      };
      // Add custom fields
      for (const f of playerFields) {
        const val = p.customFields instanceof Map ? p.customFields.get(f.key) : p.customFields?.[f.key];
        row[f.label || f.key] = val ?? '';
      }
      return row;
    });

    // --- Sheet 2: Team Squads ---
    const teamSquadData = [];
    for (const team of teams) {
      const teamPlayers = players.filter(p => p.soldTo && p.soldTo._id.toString() === team._id.toString());
      if (teamPlayers.length === 0) {
        teamSquadData.push({
          'Team': team.name,
          'Short Name': team.shortName,
          'Player': '',
          'Role': '',
          'Amount': '',
          'Purse Remaining': team.purseRemaining,
          'Purse Total': team.purseValue,
        });
      } else {
        teamPlayers.forEach((p, i) => {
          teamSquadData.push({
            'Team': i === 0 ? team.name : '',
            'Short Name': i === 0 ? team.shortName : '',
            'Player': p.name,
            'Role': p.role,
            'Amount': p.soldAmount || '',
            'Purse Remaining': i === 0 ? team.purseRemaining : '',
            'Purse Total': i === 0 ? team.purseValue : '',
          });
        });
      }
    }

    // --- Sheet 3: Team Summary ---
    const teamSummaryData = teams.map(t => {
      const teamPlayers = players.filter(p => p.soldTo && p.soldTo._id.toString() === t._id.toString());
      const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.soldAmount || 0), 0);
      return {
        'Team': t.name,
        'Short Name': t.shortName,
        'Players Bought': teamPlayers.length,
        'Total Spent': totalSpent,
        'Purse Remaining': t.purseRemaining,
        'Purse Total': t.purseValue,
        'Retained': (t.retainedPlayers || []).length,
      };
    });

    // --- Sheet 4: Unsold Players ---
    const unsoldData = players
      .filter(p => ['unsold', 'pool'].includes(p.status))
      .map(p => ({
        '#': p.playerNumber,
        'Name': p.name,
        'Role': p.role,
        'Status': p.status,
      }));

    // Build workbook
    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(allPlayersData);
    XLSX.utils.book_append_sheet(wb, ws1, 'All Players');

    const ws2 = XLSX.utils.json_to_sheet(teamSquadData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Team Squads');

    const ws3 = XLSX.utils.json_to_sheet(teamSummaryData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Team Summary');

    if (unsoldData.length > 0) {
      const ws4 = XLSX.utils.json_to_sheet(unsoldData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Unsold Players');
    }

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `${auction.name.replace(/[^a-zA-Z0-9]/g, '-')}-results.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('Export auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// HELPERS
// ============================================================

async function generateUniqueSlug(name) {
  let slug = Auction.generateSlug(name);
  let attempts = 0;
  while (attempts < 5) {
    const existing = await Auction.findOne({ slug });
    if (!existing) return slug;
    slug = Auction.generateSlug(name);
    attempts++;
  }
  // Fallback: append timestamp
  return `${slug}-${Date.now().toString(36)}`;
}

module.exports = router;
