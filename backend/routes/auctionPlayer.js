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
const AuctionTeam = require('../models/AuctionTeam');
const Auction = require('../models/Auction');
const ActionEvent = require('../models/ActionEvent');

// Multer config for spreadsheet imports (memory storage, 5MB limit)
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

// Multer config for image uploads (memory storage, 2MB limit)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
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

    // Parse skipped columns (sent from frontend as comma-separated string)
    const skipColumnsRaw = columnMapping._skipColumns || '';
    const skipColumns = new Set(skipColumnsRaw ? skipColumnsRaw.split(',').map(s => s.trim()) : []);
    delete columnMapping._skipColumns;

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

      // Build custom fields from unmapped and non-skipped columns
      const customFields = {};
      for (const [header, value] of Object.entries(row)) {
        const isMapped = Object.values(columnMapping).includes(header);
        if (!isMapped && !skipColumns.has(header) && value !== '') {
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

    // Auto-populate displayConfig.playerFields from custom field keys
    const auctionDoc = await Auction.findById(req.auction._id);
    const existingFields = auctionDoc.displayConfig?.playerFields || [];
    const existingKeys = new Set(existingFields.map(f => f.key));
    let order = existingFields.length;

    const allCustomKeys = new Set();
    players.forEach(p => {
      Object.keys(p.customFields || {}).forEach(k => allCustomKeys.add(k));
    });

    for (const key of allCustomKeys) {
      if (!existingKeys.has(key)) {
        const fieldType = inferFieldType(players, key);
        existingFields.push({
          key,
          label: key, // Use Excel column name directly as label
          type: fieldType,
          showOnCard: true,
          showInList: true,
          sortable: fieldType === 'number',
          order: order++,
        });
      }
    }

    auctionDoc.displayConfig = { playerFields: existingFields };
    await auctionDoc.save();

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
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortDir = sort.startsWith('-') ? -1 : 1;
    // Support sorting by custom fields: sort=customFields.batting_avg or sort=-customFields.age
    sortObj[sortField] = sortDir;

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

    const allowedFields = ['name', 'role', 'imageUrl', 'imageThumbnailUrl', 'imageCropPosition', 'customFields'];
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
// UPLOAD PLAYER IMAGE
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players/:playerId/upload-image
 * Upload a player photo to GCS. Auto-resizes to 800x800 max, converts to WebP, generates thumbnail.
 */
router.post('/:playerId/upload-image', auth, resolveAuctionAdmin, imageUpload.single('image'), async (req, res) => {
  try {
    const player = await AuctionPlayer.findOne({
      _id: req.params.playerId,
      auctionId: req.auction._id,
    });

    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const { uploadImage } = require('../services/imageUpload');
    const gcsPath = `auctions/${req.auction._id}/players/${player._id}`;
    const { imageUrl, thumbnailUrl } = await uploadImage(
      req.file.buffer,
      req.file.mimetype,
      gcsPath,
      player.imageUrl || undefined,
    );

    player.imageUrl = imageUrl;
    player.imageThumbnailUrl = thumbnailUrl;
    await player.save();

    res.json({ success: true, data: { imageUrl, thumbnailUrl } });
  } catch (error) {
    console.error('Upload player image error:', error);
    res.status(error.message.includes('Invalid') || error.message.includes('too small') || error.message.includes('exceeds')
      ? 400 : 500
    ).json({ success: false, error: error.message });
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
// ADMIN: ASSIGN PLAYER TO TEAM
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players/:playerId/assign
 * Admin assigns a pool/unsold player to a team at a specified amount.
 */
router.post('/:playerId/assign', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { teamId, amount } = req.body;
    if (!teamId || amount == null || amount < 0) {
      return res.status(400).json({ success: false, error: 'teamId and amount are required' });
    }

    const player = await AuctionPlayer.findOne({
      _id: req.params.playerId,
      auctionId: req.auction._id,
    });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    if (!['pool', 'unsold'].includes(player.status)) {
      return res.status(400).json({ success: false, error: `Player is ${player.status}, must be pool or unsold to assign` });
    }

    const team = await AuctionTeam.findOne({ _id: teamId, auctionId: req.auction._id, isActive: true });
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    if (team.purseRemaining < amount) {
      return res.status(400).json({ success: false, error: `Insufficient purse. Team has ₹${team.purseRemaining.toLocaleString()}, needs ₹${amount.toLocaleString()}` });
    }

    // Update player
    player.status = 'sold';
    player.soldTo = team._id;
    player.soldAmount = amount;
    player.soldInRound = player.roundHistory.length + 1;
    await player.save();

    // Update team
    team.purseRemaining -= amount;
    team.players.push({ playerId: player._id, boughtFor: amount });
    await team.save();

    // Remove from remaining pool
    await Auction.findByIdAndUpdate(req.auction._id, {
      $pull: { remainingPlayerIds: player._id },
    });

    // Log action
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'ADMIN_PLAYER_ASSIGNED',
      payload: {
        playerId: player._id,
        playerName: player.name,
        teamId: team._id,
        teamName: team.name,
        amount,
      },
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: `Admin assigned ${player.name} to ${team.name} for ₹${amount.toLocaleString()}`,
    });

    // Broadcast via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      const engine = require('../services/auctionEngine');
      const state = await engine.buildAuctionState(req.auction);
      io.of('/auction').to(`auction:${req.auction._id}`).emit('auction:state', state);
    }

    res.json({ success: true, data: player });
  } catch (error) {
    console.error('Assign player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN: REASSIGN PLAYER TO DIFFERENT TEAM
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players/:playerId/reassign
 * Admin moves a sold player from one team to another at a new amount.
 */
router.post('/:playerId/reassign', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { newTeamId, newAmount } = req.body;
    if (!newTeamId || newAmount == null || newAmount < 0) {
      return res.status(400).json({ success: false, error: 'newTeamId and newAmount are required' });
    }

    const player = await AuctionPlayer.findOne({
      _id: req.params.playerId,
      auctionId: req.auction._id,
    });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    if (player.status !== 'sold' || !player.soldTo) {
      return res.status(400).json({ success: false, error: 'Player must be sold to reassign' });
    }

    const oldTeamId = player.soldTo;
    const oldAmount = player.soldAmount || 0;

    if (oldTeamId.toString() === newTeamId) {
      return res.status(400).json({ success: false, error: 'Player is already on this team' });
    }

    const newTeam = await AuctionTeam.findOne({ _id: newTeamId, auctionId: req.auction._id, isActive: true });
    if (!newTeam) {
      return res.status(404).json({ success: false, error: 'New team not found' });
    }
    if (newTeam.purseRemaining < newAmount) {
      return res.status(400).json({ success: false, error: `Insufficient purse. ${newTeam.name} has ₹${newTeam.purseRemaining.toLocaleString()}, needs ₹${newAmount.toLocaleString()}` });
    }

    // Refund old team
    const oldTeam = await AuctionTeam.findById(oldTeamId);
    if (oldTeam) {
      oldTeam.purseRemaining += oldAmount;
      oldTeam.players = oldTeam.players.filter(p => !p.playerId.equals(player._id));
      await oldTeam.save();
    }

    // Charge new team
    newTeam.purseRemaining -= newAmount;
    newTeam.players.push({ playerId: player._id, boughtFor: newAmount });
    await newTeam.save();

    // Update player
    player.soldTo = newTeam._id;
    player.soldAmount = newAmount;
    await player.save();

    // Log action
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'ADMIN_PLAYER_REASSIGNED',
      payload: {
        playerId: player._id,
        playerName: player.name,
        oldTeamId,
        oldTeamName: oldTeam?.name,
        oldAmount,
        newTeamId: newTeam._id,
        newTeamName: newTeam.name,
        newAmount,
      },
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: `Admin reassigned ${player.name} from ${oldTeam?.name || 'Unknown'} to ${newTeam.name} for ₹${newAmount.toLocaleString()}`,
    });

    // Broadcast via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const engine = require('../services/auctionEngine');
      const state = await engine.buildAuctionState(req.auction);
      io.of('/auction').to(`auction:${req.auction._id}`).emit('auction:state', state);
    }

    res.json({ success: true, data: player, refundedTeam: oldTeam?.name, refundAmount: oldAmount });
  } catch (error) {
    console.error('Reassign player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN: RETURN SOLD PLAYER TO POOL
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players/:playerId/return-to-pool
 * Admin returns a sold player back to the pool, refunding the team's purse.
 */
router.post('/:playerId/return-to-pool', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const player = await AuctionPlayer.findOne({
      _id: req.params.playerId,
      auctionId: req.auction._id,
    });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    if (player.status !== 'sold' || !player.soldTo) {
      return res.status(400).json({ success: false, error: 'Player must be sold to return to pool' });
    }

    const refundAmount = player.soldAmount || 0;
    const teamId = player.soldTo;

    // Refund team
    const team = await AuctionTeam.findById(teamId);
    if (team) {
      team.purseRemaining += refundAmount;
      team.players = team.players.filter(p => !p.playerId.equals(player._id));
      await team.save();
    }

    // Reset player to pool
    player.status = 'pool';
    player.soldTo = null;
    player.soldAmount = null;
    player.soldInRound = null;
    await player.save();

    // Add back to remaining pool if auction is live/paused
    if (['live', 'paused'].includes(req.auction.status)) {
      await Auction.findByIdAndUpdate(req.auction._id, {
        $addToSet: { remainingPlayerIds: player._id },
      });
    }

    // Log action
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'ADMIN_PLAYER_RETURNED_TO_POOL',
      payload: {
        playerId: player._id,
        playerName: player.name,
        teamId,
        teamName: team?.name,
        refundAmount,
      },
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: `Admin returned ${player.name} to pool. ₹${refundAmount.toLocaleString()} refunded to ${team?.name || 'Unknown'}`,
    });

    // Broadcast via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const engine = require('../services/auctionEngine');
      const state = await engine.buildAuctionState(req.auction);
      io.of('/auction').to(`auction:${req.auction._id}`).emit('auction:state', state);
    }

    res.json({ success: true, data: player, refundAmount, refundedTeam: team?.name });
  } catch (error) {
    console.error('Return to pool error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN: REORDER AUCTION POOL
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/players/pool-order
 * Get the current remaining pool order with player details.
 */
router.get('/pool-order', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const auction = await Auction.findById(req.auction._id).select('remainingPlayerIds status').lean();
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    const remainingIds = auction.remainingPlayerIds || [];
    if (remainingIds.length === 0) {
      return res.json({ success: true, data: [], status: auction.status });
    }

    const players = await AuctionPlayer.find({ _id: { $in: remainingIds } })
      .select('_id name playerNumber role imageUrl')
      .lean();

    // Maintain the order from remainingPlayerIds
    const playerMap = new Map(players.map(p => [p._id.toString(), p]));
    const ordered = remainingIds
      .map(id => playerMap.get(id.toString()))
      .filter(Boolean);

    res.json({ success: true, data: ordered, status: auction.status });
  } catch (error) {
    console.error('Pool order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/auctions/:auctionId/players/reorder
 * Set the order of remaining player IDs.
 * Body: { playerIds: string[] } — full ordered list of remaining pool player IDs
 */
router.put('/reorder', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { playerIds } = req.body;
    if (!Array.isArray(playerIds)) {
      return res.status(400).json({ success: false, error: 'playerIds[] required' });
    }

    const auction = await Auction.findById(req.auction._id);
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }

    // Validate all IDs are in the current remaining pool
    const currentIds = new Set(auction.remainingPlayerIds.map(id => id.toString()));
    const newIds = playerIds.map(id => id.toString());

    // Must be same set of IDs
    if (newIds.length !== currentIds.size || !newIds.every(id => currentIds.has(id))) {
      return res.status(400).json({ success: false, error: 'playerIds must contain exactly the same IDs as the current remaining pool' });
    }

    auction.remainingPlayerIds = newIds;
    await auction.save();

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      const engine = require('../services/auctionEngine');
      const state = await engine.buildAuctionState(auction);
      io.of('/auction').to(`auction:${auction._id}`).emit('auction:state', state);
    }

    res.json({ success: true, message: 'Pool order updated' });
  } catch (error) {
    console.error('Reorder pool error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN: BULK PLAYER OPERATIONS
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players/bulk
 * Bulk operations: delete, mark-ineligible, return-to-pool
 * Body: { action: 'delete' | 'mark-ineligible' | 'return-to-pool', playerIds: string[], reason?: string }
 */
router.post('/bulk', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { action, playerIds, reason } = req.body;
    if (!action || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({ success: false, error: 'action and playerIds[] required' });
    }
    if (!['delete', 'mark-ineligible', 'return-to-pool'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    const players = await AuctionPlayer.find({
      _id: { $in: playerIds },
      auctionId: req.auction._id,
      isDeleted: { $ne: true },
    });

    if (players.length === 0) {
      return res.status(404).json({ success: false, error: 'No matching players found' });
    }

    let processed = 0;
    let totalRefund = 0;

    for (const player of players) {
      let refundAmount = 0;

      // Refund sold players
      if (player.status === 'sold' && player.soldTo && player.soldAmount) {
        const team = await AuctionTeam.findById(player.soldTo);
        if (team) {
          refundAmount = player.soldAmount;
          totalRefund += refundAmount;
          team.purseRemaining += refundAmount;
          team.players = team.players.filter(p => !p.playerId.equals(player._id));
          await team.save();
        }
      }

      // Remove from remaining pool
      await Auction.findByIdAndUpdate(req.auction._id, {
        $pull: { remainingPlayerIds: player._id },
      });

      if (action === 'delete') {
        player.isDeleted = true;
        player.deletedAt = new Date();
        player.deletedBy = req.user._id;
        player.status = 'disqualified';
      } else if (action === 'mark-ineligible') {
        if (['disqualified', 'ineligible'].includes(player.status)) continue;
        player.status = 'ineligible';
        player.isIneligible = true;
        player.ineligibleAt = new Date();
        player.ineligibleBy = req.user._id;
        player.ineligibilityReason = reason || '';
        player.soldTo = null;
        player.soldAmount = null;
        player.soldInRound = null;
      } else if (action === 'return-to-pool') {
        if (player.status !== 'sold') continue;
        player.status = 'pool';
        player.soldTo = null;
        player.soldAmount = null;
        player.soldInRound = null;
        // Re-add to remaining pool
        await Auction.findByIdAndUpdate(req.auction._id, {
          $addToSet: { remainingPlayerIds: player._id },
        });
      }

      await player.save();
      processed++;
    }

    // Log bulk action
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'MANUAL_OVERRIDE',
      payload: {
        action: `BULK_${action.toUpperCase().replace(/-/g, '_')}`,
        playerCount: processed,
        playerIds: players.map(p => p._id),
        totalRefund,
        reason: reason || '',
      },
      performedBy: req.user._id,
      isPublic: false,
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      const engine = require('../services/auctionEngine');
      const state = await engine.buildAuctionState(req.auction);
      io.of('/auction').to(`auction:${req.auction._id}`).emit('auction:state', state);
    }

    res.json({ success: true, processed, totalRefund });
  } catch (error) {
    console.error('Bulk player operation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN: SOFT DELETE PLAYER
// ============================================================

/**
 * DELETE /api/v1/auctions/:auctionId/players/:playerId
 * Soft-delete a player in any status. If sold, refunds purse.
 */
router.delete('/:playerId', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const player = await AuctionPlayer.findOne({
      _id: req.params.playerId,
      auctionId: req.auction._id,
      isDeleted: { $ne: true },
    });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    let refundAmount = 0;
    let refundTeamName = null;

    // If sold, refund purse to team
    if (player.status === 'sold' && player.soldTo && player.soldAmount) {
      const team = await AuctionTeam.findById(player.soldTo);
      if (team) {
        refundAmount = player.soldAmount;
        refundTeamName = team.name;
        team.purseRemaining += refundAmount;
        team.players = team.players.filter(p => !p.playerId.equals(player._id));
        await team.save();
      }
    }

    // Remove from remaining pool
    await Auction.findByIdAndUpdate(req.auction._id, {
      $pull: { remainingPlayerIds: player._id },
    });

    // Soft delete
    player.isDeleted = true;
    player.deletedAt = new Date();
    player.deletedBy = req.user._id;
    player.status = 'disqualified'; // reuse existing status for query filtering
    await player.save();

    // Log action
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'PLAYER_DELETED',
      payload: {
        playerId: player._id,
        playerName: player.name,
        refundAmount,
        refundTeamName,
      },
      performedBy: req.user._id,
      isPublic: false,
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      const engine = require('../services/auctionEngine');
      const state = await engine.buildAuctionState(req.auction);
      io.of('/auction').to(`auction:${req.auction._id}`).emit('auction:state', state);
    }

    res.json({ success: true, message: 'Player deleted', refundAmount, refundTeamName });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN: REINSTATE PLAYER
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players/:playerId/reinstate
 * Reverse a disqualification or ineligibility. Player returns to pool.
 */
router.post('/:playerId/reinstate', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const player = await AuctionPlayer.findOne({
      _id: req.params.playerId,
      auctionId: req.auction._id,
      isDeleted: { $ne: true },
    });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    if (!['disqualified', 'ineligible'].includes(player.status)) {
      return res.status(400).json({ success: false, error: `Player is ${player.status}, must be disqualified or ineligible to reinstate` });
    }

    const previousStatus = player.status;

    // Reset status
    player.status = 'pool';
    player.isDisqualified = false;
    player.disqualifiedAt = null;
    player.disqualifiedBy = null;
    player.disqualificationReason = '';
    player.isIneligible = false;
    player.ineligibleAt = null;
    player.ineligibleBy = null;
    player.ineligibilityReason = '';
    await player.save();

    // Add back to remaining pool if auction is live/paused
    if (['live', 'paused'].includes(req.auction.status)) {
      await Auction.findByIdAndUpdate(req.auction._id, {
        $addToSet: { remainingPlayerIds: player._id },
      });
    }

    // Log action
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'PLAYER_REINSTATED',
      payload: {
        playerId: player._id,
        playerName: player.name,
        previousStatus,
      },
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: `${player.name} has been reinstated to the player pool`,
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      const engine = require('../services/auctionEngine');
      const state = await engine.buildAuctionState(req.auction);
      io.of('/auction').to(`auction:${req.auction._id}`).emit('auction:state', state);
    }

    res.json({ success: true, data: player });
  } catch (error) {
    console.error('Reinstate player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADMIN: MARK PLAYER INELIGIBLE
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/players/:playerId/mark-ineligible
 * Mark a player as ineligible (soft block). If sold, refunds purse.
 */
router.post('/:playerId/mark-ineligible', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const player = await AuctionPlayer.findOne({
      _id: req.params.playerId,
      auctionId: req.auction._id,
      isDeleted: { $ne: true },
    });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }
    if (['disqualified', 'ineligible'].includes(player.status)) {
      return res.status(400).json({ success: false, error: `Player is already ${player.status}` });
    }

    let refundAmount = 0;
    let refundTeamName = null;

    // If sold, refund purse
    if (player.status === 'sold' && player.soldTo && player.soldAmount) {
      const team = await AuctionTeam.findById(player.soldTo);
      if (team) {
        refundAmount = player.soldAmount;
        refundTeamName = team.name;
        team.purseRemaining += refundAmount;
        team.players = team.players.filter(p => !p.playerId.equals(player._id));
        await team.save();
      }
    }

    // Remove from remaining pool
    await Auction.findByIdAndUpdate(req.auction._id, {
      $pull: { remainingPlayerIds: player._id },
    });

    // Mark ineligible
    player.status = 'ineligible';
    player.isIneligible = true;
    player.ineligibleAt = new Date();
    player.ineligibleBy = req.user._id;
    player.ineligibilityReason = reason || '';
    player.soldTo = null;
    player.soldAmount = null;
    player.soldInRound = null;
    await player.save();

    // Log action
    await ActionEvent.create({
      auctionId: req.auction._id,
      sequenceNumber: await ActionEvent.getNextSequence(req.auction._id),
      type: 'PLAYER_MARKED_INELIGIBLE',
      payload: {
        playerId: player._id,
        playerName: player.name,
        reason: reason || '',
        refundAmount,
        refundTeamName,
      },
      performedBy: req.user._id,
      isPublic: true,
      publicMessage: `${player.name} has been marked ineligible${reason ? `: ${reason}` : ''}`,
    });

    // Broadcast
    const io = req.app.get('io');
    if (io) {
      const engine = require('../services/auctionEngine');
      const state = await engine.buildAuctionState(req.auction);
      io.of('/auction').to(`auction:${req.auction._id}`).emit('auction:state', state);
    }

    res.json({ success: true, data: player, refundAmount, refundTeamName });
  } catch (error) {
    console.error('Mark ineligible error:', error);
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
 * Infer field type by scanning sample values from imported players.
 * Returns 'number', 'url', 'date', or 'text'.
 */
function inferFieldType(players, key) {
  const samples = players
    .map(p => (p.customFields || {})[key])
    .filter(v => v !== undefined && v !== null && v !== '');

  if (samples.length === 0) return 'text';

  // Check if >80% are numeric
  const numericCount = samples.filter(v => !isNaN(Number(v))).length;
  if (numericCount / samples.length >= 0.8) return 'number';

  // Check if looks like URLs
  const urlCount = samples.filter(v => /^https?:\/\//i.test(String(v))).length;
  if (urlCount / samples.length >= 0.8) return 'url';

  return 'text';
}

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
