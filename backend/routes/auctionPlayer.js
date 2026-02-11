/**
 * @fileoverview AuctionPlayer Routes
 * 
 * Player pool management: XLSX/CSV import with column mapping,
 * manual add, update, search, disqualify, and self-validation.
 * 
 * Admin routes require: auth + resolveAuctionAdmin
 * Validation routes: public (token-based)
 * 
 * @module routes/auctionPlayer
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const XLSX = require('xlsx');
const { auth } = require('../middleware/auth');
const { resolveAuctionAdmin } = require('../middleware/auctionAuth');
const AuctionPlayer = require('../models/AuctionPlayer');
const ActionEvent = require('../models/ActionEvent');

// Multer config for file uploads (memory storage, 5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];
    if (allowed.includes(file.mimetype) ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only XLSX and CSV files are supported'));
    }
  },
});

// ============================================================
// IMPORT PLAYERS (XLSX/CSV)
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players/import
 * Import players from XLSX/CSV file.
 * Step 1: Upload file → returns detected columns for mapping.
 */
router.post('/import', auth, resolveAuctionAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!['draft', 'configured'].includes(req.auction.status)) {
      return res.status(400).json({
        success: false,
        error: 'Players can only be imported in draft or configured status',
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File is required' });
    }

    // Parse the file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, error: 'File is empty or could not be parsed' });
    }

    // Detect columns
    const headers = Object.keys(data[0]);
    const preview = data.slice(0, 10);

    // If columnMapping is provided, do the actual import
    const columnMapping = req.body.columnMapping
      ? (typeof req.body.columnMapping === 'string' ? JSON.parse(req.body.columnMapping) : req.body.columnMapping)
      : null;

    if (!columnMapping) {
      // Step 1: Return preview and detected columns for mapping
      return res.json({
        success: true,
        step: 'preview',
        data: {
          headers,
          preview,
          totalRows: data.length,
          suggestedMapping: suggestColumnMapping(headers),
        },
      });
    }

    // Step 2: Actual import with column mapping
    if (!columnMapping.name || !columnMapping.role) {
      return res.status(400).json({
        success: false,
        error: 'Column mapping must include at least "name" and "role" fields',
      });
    }

    const validRoles = ['batsman', 'bowler', 'all-rounder', 'wicket-keeper'];
    const roleAliases = {
      'bat': 'batsman', 'batter': 'batsman', 'batsman': 'batsman',
      'bowl': 'bowler', 'bowler': 'bowler',
      'all-rounder': 'all-rounder', 'allrounder': 'all-rounder', 'ar': 'all-rounder', 'all rounder': 'all-rounder',
      'wk': 'wicket-keeper', 'keeper': 'wicket-keeper', 'wicketkeeper': 'wicket-keeper', 'wicket-keeper': 'wicket-keeper',
    };

    let nextNumber = await AuctionPlayer.getNextPlayerNumber(req.auction._id);
    const players = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const name = String(row[columnMapping.name] || '').trim();
      const rawRole = String(row[columnMapping.role] || '').trim().toLowerCase();
      const role = roleAliases[rawRole];

      if (!name) {
        errors.push({ row: i + 2, error: 'Missing name' });
        continue;
      }
      if (!role) {
        errors.push({ row: i + 2, error: `Invalid role: "${rawRole}"` });
        continue;
      }

      // Build custom fields from unmapped columns
      const customFields = {};
      for (const [header, value] of Object.entries(row)) {
        const isMapped = Object.values(columnMapping).includes(header);
        if (!isMapped && value !== '') {
          customFields[header] = value;
        }
      }

      players.push({
        auctionId: req.auction._id,
        playerNumber: nextNumber++,
        name,
        role,
        imageUrl: columnMapping.imageUrl ? String(row[columnMapping.imageUrl] || '') : '',
        customFields,
        importSource: 'excel',
        importRow: i + 2,
        validationToken: AuctionPlayer.generateValidationToken(),
      });
    }

    if (players.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid players found in the file',
        errors,
      });
    }

    // Bulk insert
    const inserted = await AuctionPlayer.insertMany(players, { ordered: false });

    // Update auction's remaining player pool
    const Auction = require('../models/Auction');
    const allPoolIds = await AuctionPlayer.find({
      auctionId: req.auction._id,
      status: 'pool',
      isDisqualified: false,
    }).select('_id').lean();

    await Auction.findByIdAndUpdate(req.auction._id, {
      remainingPlayerIds: allPoolIds.map(p => p._id),
    });

    res.status(201).json({
      success: true,
      step: 'imported',
      data: {
        imported: inserted.length,
        errors: errors.length > 0 ? errors : undefined,
        totalInPool: allPoolIds.length,
      },
    });
  } catch (error) {
    console.error('Import players error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADD PLAYER MANUALLY
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players
 * Add a single player manually.
 */
router.post('/', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (!['draft', 'configured'].includes(req.auction.status)) {
      return res.status(400).json({
        success: false,
        error: 'Players can only be added in draft or configured status',
      });
    }

    const { name, role, imageUrl, customFields } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Player name and role are required',
      });
    }

    const playerNumber = await AuctionPlayer.getNextPlayerNumber(req.auction._id);

    const player = new AuctionPlayer({
      auctionId: req.auction._id,
      playerNumber,
      name: name.trim(),
      role,
      imageUrl: imageUrl || '',
      customFields: customFields || {},
      importSource: 'manual',
      validationToken: AuctionPlayer.generateValidationToken(),
    });

    await player.save();

    res.status(201).json({ success: true, data: player });
  } catch (error) {
    console.error('Add player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIST PLAYERS
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/players
 * List players with filters (status, role, search).
 */
router.get('/', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { status, role, search, page = 1, limit = 50, sort = 'playerNumber' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { auctionId: req.auction._id };
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { playerNumber: parseInt(search) || -1 },
      ];
    }

    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const [players, total] = await Promise.all([
      AuctionPlayer.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('soldTo', 'name shortName primaryColor')
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
    console.error('List players error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// UPDATE PLAYER
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/players/:playerId
 * Update player data.
 */
router.patch('/:playerId', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const player = await AuctionPlayer.findOne({
      _id: req.params.playerId,
      auctionId: req.auction._id,
    });

    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const allowedFields = ['name', 'role', 'imageUrl', 'customFields'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        player[field] = req.body[field];
      }
    }

    await player.save();

    // Log data update
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'PLAYER_DATA_UPDATED',
      payload: { playerId: player._id, updates: req.body },
      performedBy: req.user._id,
      isPublic: false,
    });

    res.json({ success: true, data: player });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DISQUALIFY PLAYER
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players/:playerId/disqualify
 * Disqualify a player. If sold, refund purse to team.
 */
router.post('/:playerId/disqualify', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const player = await AuctionPlayer.findOne({
      _id: req.params.playerId,
      auctionId: req.auction._id,
    });

    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    if (player.isDisqualified) {
      return res.status(400).json({ success: false, error: 'Player is already disqualified' });
    }

    const previousStatus = player.status;
    let refundAmount = 0;
    let refundTeamId = null;

    // If sold, refund purse to buying team
    if (player.status === 'sold' && player.soldTo && player.soldAmount) {
      const AuctionTeam = require('../models/AuctionTeam');
      const team = await AuctionTeam.findById(player.soldTo);
      if (team) {
        refundAmount = player.soldAmount;
        refundTeamId = team._id;
        team.purseRemaining += refundAmount;
        team.players = team.players.filter(p => !p.playerId.equals(player._id));
        await team.save();
      }
    }

    player.isDisqualified = true;
    player.disqualifiedAt = new Date();
    player.disqualifiedBy = req.user._id;
    player.disqualificationReason = req.body.reason || '';
    player.status = 'disqualified';
    player.soldTo = null;
    player.soldAmount = null;
    player.soldInRound = null;
    await player.save();

    // Remove from remaining pool if present
    const Auction = require('../models/Auction');
    await Auction.findByIdAndUpdate(req.auction._id, {
      $pull: { remainingPlayerIds: player._id },
    });

    // Log action
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'PLAYER_DISQUALIFIED',
      payload: {
        playerId: player._id,
        playerName: player.name,
        previousStatus,
        reason: req.body.reason || '',
        refundAmount,
        refundTeamId,
      },
      reversalPayload: {
        playerId: player._id,
        previousStatus,
        soldTo: refundTeamId,
        soldAmount: refundAmount,
      },
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: `Player #${player.playerNumber} ${player.name} has been disqualified.${refundAmount ? ` ₹${refundAmount.toLocaleString()} refunded.` : ''}`,
    });

    res.json({
      success: true,
      data: player,
      refundAmount,
      refundTeamId,
    });
  } catch (error) {
    console.error('Disqualify player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// PLAYER SELF-VALIDATION (Public, token-based)
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/validate/:token
 * View player data via validation token (no auth required).
 */
router.get('/validate/:token', async (req, res) => {
  try {
    const player = await AuctionPlayer.findOne({
      validationToken: req.params.token,
    }).lean();

    if (!player) {
      return res.status(404).json({ success: false, error: 'Invalid validation link' });
    }

    res.json({
      success: true,
      data: {
        name: player.name,
        role: player.role,
        playerNumber: player.playerNumber,
        imageUrl: player.imageUrl,
        customFields: player.customFields,
        validationStatus: player.validationStatus,
        flaggedIssues: player.flaggedIssues,
      },
    });
  } catch (error) {
    console.error('Validate player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/auctions/:auctionId/validate/:token/flag
 * Flag an issue with player data (no auth required).
 */
router.post('/validate/:token/flag', async (req, res) => {
  try {
    const player = await AuctionPlayer.findOne({
      validationToken: req.params.token,
    });

    if (!player) {
      return res.status(404).json({ success: false, error: 'Invalid validation link' });
    }

    const { field, message } = req.body;
    if (!field || !message) {
      return res.status(400).json({ success: false, error: 'Field and message are required' });
    }

    player.flaggedIssues.push({ field, message });
    player.validationStatus = 'flagged';
    await player.save();

    res.json({ success: true, message: 'Issue flagged successfully' });
  } catch (error) {
    console.error('Flag issue error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// HELPERS
// ============================================================

/**
 * Suggest column mapping based on header names
 */
function suggestColumnMapping(headers) {
  const mapping = {};
  const headerLower = headers.map(h => h.toLowerCase().trim());

  const namePatterns = ['name', 'player name', 'player_name', 'playername', 'full name'];
  const rolePatterns = ['role', 'player role', 'player_role', 'type', 'category', 'specialization'];
  const imagePatterns = ['image', 'imageurl', 'image_url', 'photo', 'picture', 'avatar'];

  for (let i = 0; i < headers.length; i++) {
    const h = headerLower[i];
    if (namePatterns.includes(h) && !mapping.name) mapping.name = headers[i];
    if (rolePatterns.includes(h) && !mapping.role) mapping.role = headers[i];
    if (imagePatterns.includes(h) && !mapping.imageUrl) mapping.imageUrl = headers[i];
  }

  return mapping;
}

module.exports = router;
