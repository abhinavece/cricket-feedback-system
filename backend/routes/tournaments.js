/**
 * @fileoverview Tournament Routes
 * 
 * API endpoints for tournament management and player entries.
 * Supports bulk upload, CRUD operations, and public link generation.
 * 
 * @module routes/tournaments
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const Tournament = require('../models/Tournament');
const TournamentEntry = require('../models/TournamentEntry');
const Franchise = require('../models/Franchise');
const { auth } = require('../middleware/auth');
const { resolveTenant, requireOrgAdmin, ensureTournamentOrg } = require('../middleware/tenantResolver');
const { tenantQuery, tenantCreate } = require('../utils/tenantQuery');
const fileParserService = require('../services/fileParserService');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv',
      'application/csv'
    ];
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
    }
  }
});

// ============================================
// TOURNAMENT CRUD OPERATIONS
// ============================================

/**
 * GET /api/tournaments
 * List all tournaments for the organization
 */
router.get('/', auth, ensureTournamentOrg, resolveTenant, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);

    const query = { isDeleted: false };
    if (status) {
      query.status = status;
    }

    const tournaments = await Tournament.find(tenantQuery(req, query))
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    // Get player and franchise counts for all tournaments in one query
    const tournamentIds = tournaments.map(t => t._id);
    
    const [entryCounts, franchiseCounts] = await Promise.all([
      TournamentEntry.aggregate([
        { $match: { tournamentId: { $in: tournamentIds }, isDeleted: false } },
        { $group: { _id: '$tournamentId', count: { $sum: 1 } } }
      ]),
      Franchise.aggregate([
        { $match: { tournamentId: { $in: tournamentIds }, isDeleted: false } },
        { $group: { _id: '$tournamentId', count: { $sum: 1 } } }
      ])
    ]);

    // Create lookup maps
    const entryCountMap = entryCounts.reduce((acc, { _id, count }) => {
      acc[_id.toString()] = count;
      return acc;
    }, {});
    const franchiseCountMap = franchiseCounts.reduce((acc, { _id, count }) => {
      acc[_id.toString()] = count;
      return acc;
    }, {});

    // Add counts to tournaments
    const tournamentsWithStats = tournaments.map(t => ({
      ...t,
      playerCount: entryCountMap[t._id.toString()] || 0,
      franchiseCount: franchiseCountMap[t._id.toString()] || 0
    }));

    const total = await Tournament.countDocuments(tenantQuery(req, query));
    const hasMore = (pageNum * limitNum) < total;

    res.json({
      success: true,
      data: tournamentsWithStats,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error listing tournaments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tournaments/:id
 * Get single tournament with stats
 */
router.get('/:id', auth, ensureTournamentOrg, resolveTenant, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    })).populate('createdBy', 'name email');

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get all stats in parallel
    const [teamStats, roleStats, playerCount, franchiseCount] = await Promise.all([
      // Team breakdown
      TournamentEntry.aggregate([
        { $match: { tournamentId: tournament._id, isDeleted: false } },
        { $group: { _id: '$entryData.teamName', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Role breakdown
      TournamentEntry.aggregate([
        { $match: { tournamentId: tournament._id, isDeleted: false } },
        { $group: { _id: '$entryData.role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Total player count
      TournamentEntry.countDocuments({ tournamentId: tournament._id, isDeleted: false }),
      // Total franchise count
      Franchise.countDocuments({ tournamentId: tournament._id, isDeleted: false })
    ]);

    res.json({
      success: true,
      data: {
        ...tournament.toObject(),
        playerCount,
        franchiseCount,
        stats: {
          entryCount: playerCount,
          teamCount: teamStats.filter(t => t._id).length // Unique team names
        },
        teamStats: teamStats.map(t => ({ teamName: t._id || 'Unassigned', count: t.count })),
        roleStats: roleStats.map(r => ({ role: r._id || 'player', count: r.count }))
      }
    });
  } catch (error) {
    console.error('Error getting tournament:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments
 * Create new tournament (admin only)
 */
router.post('/', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { name, description, startDate, endDate, branding, settings } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tournament name is required' });
    }

    // Generate slug
    let slug = Tournament.generateSlug(name);
    
    // Check for slug uniqueness within org
    let slugExists = await Tournament.findOne(tenantQuery(req, { slug }));
    let counter = 1;
    const baseSlug = slug;
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await Tournament.findOne(tenantQuery(req, { slug }));
      counter++;
    }

    // Generate public token
    const publicToken = Tournament.generateToken();

    const tournament = new Tournament(tenantCreate(req, {
      name,
      slug,
      description: description || '',
      startDate: startDate || null,
      endDate: endDate || null,
      branding: branding || {},
      settings: settings || {},
      publicToken,
      createdBy: req.user._id,
      status: 'draft'
    }));

    await tournament.save();

    const populatedTournament = await Tournament.findById(tournament._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedTournament
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tournaments/:id
 * Update tournament (admin only)
 */
router.put('/:id', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const { name, description, startDate, endDate, status, branding, settings } = req.body;

    // Update fields
    if (name !== undefined) tournament.name = name;
    if (description !== undefined) tournament.description = description;
    if (startDate !== undefined) tournament.startDate = startDate;
    if (endDate !== undefined) tournament.endDate = endDate;
    if (status !== undefined) tournament.status = status;
    if (branding !== undefined) {
      tournament.branding = { ...tournament.branding.toObject(), ...branding };
    }
    if (settings !== undefined) {
      tournament.settings = { ...tournament.settings.toObject(), ...settings };
    }

    await tournament.save();

    const updatedTournament = await Tournament.findById(tournament._id)
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: updatedTournament
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:id/publish
 * Publish tournament and generate/return public link
 */
router.post('/:id/publish', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Generate public token if not exists
    if (!tournament.publicToken) {
      tournament.publicToken = Tournament.generateToken();
    }

    // Update status to published if draft
    if (tournament.status === 'draft') {
      tournament.status = 'published';
    }

    tournament.isActive = true;
    await tournament.save();

    res.json({
      success: true,
      data: {
        publicToken: tournament.publicToken,
        status: tournament.status,
      }
    });
  } catch (error) {
    console.error('Error publishing tournament:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/tournaments/:id
 * Soft delete tournament (admin only)
 */
router.delete('/:id', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Soft delete
    tournament.isDeleted = true;
    tournament.deletedAt = new Date();
    tournament.deletedBy = req.user._id;
    await tournament.save();

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:id/regenerate-token
 * Regenerate public token (admin only)
 */
router.post('/:id/regenerate-token', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    tournament.publicToken = Tournament.generateToken();
    await tournament.save();

    res.json({
      success: true,
      data: {
        publicToken: tournament.publicToken
      }
    });
  } catch (error) {
    console.error('Error regenerating token:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TOURNAMENT ENTRIES OPERATIONS
// ============================================

/**
 * GET /api/tournaments/:id/entries
 * List tournament entries with pagination
 */
router.get('/:id/entries', auth, ensureTournamentOrg, resolveTenant, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const { page = 1, limit = 50, search, role, teamName } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    // Verify tournament exists
    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Build query
    const query = {
      tournamentId: tournament._id,
      isDeleted: false
    };

    if (role) {
      query['entryData.role'] = role;
    }

    if (teamName) {
      query['entryData.teamName'] = teamName;
    }

    // Text search across multiple fields
    let entries;
    let total;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'entryData.name': searchRegex },
        { 'entryData.phone': searchRegex },
        { 'entryData.email': searchRegex },
        { 'entryData.cricHeroesId': searchRegex },
        { 'entryData.companyName': searchRegex },
        { 'entryData.teamName': searchRegex }
      ];
    }

    entries = await TournamentEntry.find(tenantQuery(req, query))
      .sort({ 'entryData.teamName': 1, 'entryData.name': 1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    total = await TournamentEntry.countDocuments(tenantQuery(req, query));

    const hasMore = (pageNum * limitNum) < total;

    // Get unique teams and roles for filters
    const teams = await TournamentEntry.distinct('entryData.teamName', tenantQuery(req, {
      tournamentId: tournament._id,
      isDeleted: false
    }));

    const roles = await TournamentEntry.distinct('entryData.role', tenantQuery(req, {
      tournamentId: tournament._id,
      isDeleted: false
    }));

    res.json({
      success: true,
      data: entries,
      filters: {
        teams: teams.filter(Boolean).sort(),
        roles: roles.filter(Boolean).sort()
      },
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error listing entries:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:id/entries
 * Add single entry (admin only)
 */
router.post('/:id/entries', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const { entryData } = req.body;

    if (!entryData || !entryData.name) {
      return res.status(400).json({ error: 'Entry name is required' });
    }

    const entry = new TournamentEntry(tenantCreate(req, {
      tournamentId: tournament._id,
      entryData: {
        name: entryData.name,
        phone: entryData.phone || '',
        email: entryData.email || '',
        dateOfBirth: entryData.dateOfBirth || null,
        cricHeroesId: entryData.cricHeroesId || '',
        role: entryData.role || 'player',
        companyName: entryData.companyName || '',
        address: entryData.address || '',
        teamName: entryData.teamName || '',
        jerseyNumber: entryData.jerseyNumber || null
      },
      createdBy: req.user._id
    }));

    await entry.save();

    // Update tournament stats
    await updateTournamentStats(tournament._id);

    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error adding entry:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:id/entries/bulk/preview
 * Preview bulk upload (parse file and show mapping)
 */
router.post('/:id/entries/bulk/preview', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Parse file
    const parsed = fileParserService.parseFile(req.file.buffer, req.file.originalname);
    
    // Return preview data
    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        headers: parsed.headers,
        rowCount: parsed.rowCount,
        suggestedMapping: parsed.suggestedMapping,
        preview: parsed.rows.slice(0, 5) // First 5 rows for preview
      }
    });
  } catch (error) {
    console.error('Error previewing file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:id/entries/bulk
 * Bulk import entries from file (admin only)
 */
router.post('/:id/entries/bulk', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get column mapping from request body (or use suggested)
    let columnMapping = {};
    try {
      columnMapping = req.body.columnMapping ? JSON.parse(req.body.columnMapping) : null;
    } catch {
      columnMapping = null;
    }

    // Parse file
    const parsed = fileParserService.parseFile(req.file.buffer, req.file.originalname);
    
    // Use provided mapping or suggested
    const mapping = columnMapping || parsed.suggestedMapping;
    
    if (!mapping.name) {
      return res.status(400).json({ 
        error: 'Name column mapping is required',
        suggestedMapping: parsed.suggestedMapping
      });
    }

    // Transform rows
    const transformed = fileParserService.transformRows(parsed.rows, mapping);
    
    // Validate entries
    const validation = fileParserService.validateEntries(transformed);
    
    // Generate batch ID for tracking
    const importBatchId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check for existing entries (by phone or email) in this tournament
    const existingPhones = await TournamentEntry.find(tenantQuery(req, {
      tournamentId: tournament._id,
      isDeleted: false,
      'entryData.phone': { $ne: '' }
    })).select('entryData.phone').lean();
    
    const existingEmails = await TournamentEntry.find(tenantQuery(req, {
      tournamentId: tournament._id,
      isDeleted: false,
      'entryData.email': { $ne: '' }
    })).select('entryData.email').lean();
    
    const existingPhoneSet = new Set(existingPhones.map(e => e.entryData.phone));
    const existingEmailSet = new Set(existingEmails.map(e => e.entryData.email?.toLowerCase()));
    
    // Filter out entries that already exist
    const newEntries = validation.valid.filter(entry => {
      if (entry.phone && existingPhoneSet.has(entry.phone)) {
        validation.duplicates.push({
          entry,
          reason: 'Phone already exists in tournament'
        });
        return false;
      }
      if (entry.email && existingEmailSet.has(entry.email.toLowerCase())) {
        validation.duplicates.push({
          entry,
          reason: 'Email already exists in tournament'
        });
        return false;
      }
      return true;
    });
    
    // Create entries
    const entriesToCreate = newEntries.map(entry => ({
      organizationId: req.organization._id,
      tournamentId: tournament._id,
      entryData: {
        name: entry.name || '',
        phone: entry.phone || '',
        email: entry.email || '',
        dateOfBirth: entry.dateOfBirth || null,
        cricHeroesId: entry.cricHeroesId || '',
        role: entry.role || 'player',
        companyName: entry.companyName || '',
        address: entry.address || '',
        teamName: entry.teamName || '',
        jerseyNumber: entry.jerseyNumber || null
      },
      importBatchId,
      importRowNumber: entry._rowNumber,
      createdBy: req.user._id
    }));
    
    let insertedCount = 0;
    if (entriesToCreate.length > 0) {
      const result = await TournamentEntry.insertMany(entriesToCreate, { ordered: false });
      insertedCount = result.length;
    }
    
    // Update tournament stats
    await updateTournamentStats(tournament._id);
    
    res.json({
      success: true,
      data: {
        totalRows: parsed.rowCount,
        imported: insertedCount,
        skipped: validation.duplicates.length,
        invalid: validation.invalid.length,
        importBatchId,
        details: {
          duplicates: validation.duplicates.slice(0, 10), // First 10 duplicates
          invalid: validation.invalid.slice(0, 10) // First 10 invalid
        }
      }
    });
  } catch (error) {
    console.error('Error bulk importing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tournaments/:id/entries/:entryId
 * Update entry (admin only)
 */
router.put('/:id/entries/:entryId', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || 
        !mongoose.Types.ObjectId.isValid(req.params.entryId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const entry = await TournamentEntry.findOne(tenantQuery(req, {
      _id: req.params.entryId,
      tournamentId: req.params.id,
      isDeleted: false
    }));

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const { entryData, status } = req.body;

    // Update entry data fields
    if (entryData) {
      Object.keys(entryData).forEach(key => {
        if (entryData[key] !== undefined) {
          entry.entryData[key] = entryData[key];
        }
      });
    }

    if (status !== undefined) {
      entry.status = status;
    }

    entry.updatedBy = req.user._id;
    await entry.save();

    // Update tournament stats if team changed
    await updateTournamentStats(entry.tournamentId);

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/tournaments/:id/entries/:entryId
 * Soft delete entry (admin only)
 */
router.delete('/:id/entries/:entryId', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || 
        !mongoose.Types.ObjectId.isValid(req.params.entryId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const entry = await TournamentEntry.findOne(tenantQuery(req, {
      _id: req.params.entryId,
      tournamentId: req.params.id,
      isDeleted: false
    }));

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    entry.isDeleted = true;
    entry.deletedAt = new Date();
    entry.deletedBy = req.user._id;
    await entry.save();

    // Update tournament stats
    await updateTournamentStats(entry.tournamentId);

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/tournaments/:id/entries
 * Bulk delete entries (admin only)
 */
router.delete('/:id/entries', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { entryIds } = req.body;

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({ error: 'Entry IDs array is required' });
    }

    const result = await TournamentEntry.updateMany(
      tenantQuery(req, {
        _id: { $in: entryIds },
        tournamentId: req.params.id,
        isDeleted: false
      }),
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id
      }
    );

    // Update tournament stats
    await updateTournamentStats(req.params.id);

    res.json({
      success: true,
      message: `${result.modifiedCount} entries deleted`
    });
  } catch (error) {
    console.error('Error bulk deleting entries:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FRANCHISE (TEAM) MANAGEMENT
// ============================================

/**
 * GET /api/tournaments/:id/franchises
 * List franchises/teams in tournament
 */
router.get('/:id/franchises', auth, ensureTournamentOrg, resolveTenant, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get franchises from database
    const franchises = await Franchise.find(tenantQuery(req, {
      tournamentId: tournament._id,
      isDeleted: false
    })).sort({ name: 1 }).lean();

    // Get player counts for each franchise
    const playerCounts = await TournamentEntry.aggregate([
      {
        $match: {
          organizationId: req.organization._id,
          tournamentId: tournament._id,
          isDeleted: false,
          franchiseId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$franchiseId',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    playerCounts.forEach(pc => {
      countMap[pc._id.toString()] = pc.count;
    });

    // Add player count to each franchise
    const franchisesWithCounts = franchises.map(f => ({
      ...f,
      playerCount: countMap[f._id.toString()] || 0
    }));

    res.json({ success: true, data: franchisesWithCounts });
  } catch (error) {
    console.error('Error listing franchises:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:id/franchises
 * Create a new franchise/team
 */
router.post('/:id/franchises', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const { name, shortName, primaryColor, secondaryColor, logo, owner, budget } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    // Check for duplicate shortName in tournament
    const existingShortName = await Franchise.findOne(tenantQuery(req, {
      tournamentId: tournament._id,
      shortName: (shortName || name.substring(0, 3)).toUpperCase(),
      isDeleted: false
    }));

    if (existingShortName) {
      return res.status(400).json({ error: 'A team with this short name already exists' });
    }

    const franchise = new Franchise(tenantCreate(req, {
      tournamentId: tournament._id,
      name,
      shortName: shortName || name.substring(0, 3).toUpperCase(),
      primaryColor: primaryColor || '#14b8a6',
      secondaryColor: secondaryColor || '#0f172a',
      logo: logo || '',
      owner: owner || {},
      budget: budget || 100000,
      remainingBudget: budget || 100000,
      createdBy: req.user._id
    }));

    await franchise.save();

    res.status(201).json({ 
      success: true, 
      data: {
        ...franchise.toObject(),
        playerCount: 0
      }
    });
  } catch (error) {
    console.error('Error creating franchise:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tournaments/:id/franchises/:franchiseId
 * Update franchise details
 */
router.put('/:id/franchises/:franchiseId', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || 
        !mongoose.Types.ObjectId.isValid(req.params.franchiseId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const franchise = await Franchise.findOne(tenantQuery(req, {
      _id: req.params.franchiseId,
      tournamentId: req.params.id,
      isDeleted: false
    }));

    if (!franchise) {
      return res.status(404).json({ error: 'Franchise not found' });
    }

    const { name, shortName, primaryColor, secondaryColor, logo, owner, budget, remainingBudget, captain } = req.body;

    if (name !== undefined) franchise.name = name;
    if (shortName !== undefined) franchise.shortName = shortName.toUpperCase();
    if (primaryColor !== undefined) franchise.primaryColor = primaryColor;
    if (secondaryColor !== undefined) franchise.secondaryColor = secondaryColor;
    if (logo !== undefined) franchise.logo = logo;
    if (owner !== undefined) franchise.owner = owner;
    if (budget !== undefined) franchise.budget = budget;
    if (remainingBudget !== undefined) franchise.remainingBudget = remainingBudget;
    if (captain !== undefined) franchise.captain = captain;

    franchise.updatedBy = req.user._id;
    await franchise.save();

    // Get player count
    const playerCount = await TournamentEntry.countDocuments(tenantQuery(req, {
      franchiseId: franchise._id,
      isDeleted: false
    }));

    res.json({ 
      success: true, 
      data: {
        ...franchise.toObject(),
        playerCount
      }
    });
  } catch (error) {
    console.error('Error updating franchise:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/tournaments/:id/franchises/:franchiseId
 * Soft delete franchise
 */
router.delete('/:id/franchises/:franchiseId', auth, ensureTournamentOrg, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || 
        !mongoose.Types.ObjectId.isValid(req.params.franchiseId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const franchise = await Franchise.findOne(tenantQuery(req, {
      _id: req.params.franchiseId,
      tournamentId: req.params.id,
      isDeleted: false
    }));

    if (!franchise) {
      return res.status(404).json({ error: 'Franchise not found' });
    }

    // Remove franchise assignment from all entries
    await TournamentEntry.updateMany(
      tenantQuery(req, { franchiseId: franchise._id }),
      { $unset: { franchiseId: '' } }
    );

    // Soft delete
    franchise.isDeleted = true;
    franchise.deletedAt = new Date();
    franchise.deletedBy = req.user._id;
    await franchise.save();

    res.json({ success: true, message: 'Franchise deleted successfully' });
  } catch (error) {
    console.error('Error deleting franchise:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FEEDBACK MANAGEMENT
// ============================================

/**
 * GET /api/tournaments/:id/feedback
 * List feedback for tournament entries
 */
router.get('/:id/feedback', auth, ensureTournamentOrg, resolveTenant, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await Tournament.findOne(tenantQuery(req, {
      _id: req.params.id,
      isDeleted: false
    }));

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // For now, tournament feedback is stored in entry customFields or a separate collection
    // Return empty array - can be extended later
    res.json({
      success: true,
      data: [],
      pagination: { current: 1, pages: 0, total: 0, hasMore: false }
    });
  } catch (error) {
    console.error('Error listing feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tournaments/:id/feedback/stats
 * Get feedback statistics
 */
router.get('/:id/feedback/stats', auth, ensureTournamentOrg, resolveTenant, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalFeedback: 0,
        avgBatting: null,
        avgBowling: null,
        avgFielding: null,
        avgTeamSpirit: null,
      }
    });
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tournaments/:id/feedback
 * Add feedback for a player
 */
router.post('/:id/feedback', auth, ensureTournamentOrg, resolveTenant, async (req, res) => {
  try {
    const { playerId, batting, bowling, fielding, teamSpirit, comments } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Feedback is stored inline for now - could be a separate collection
    const feedback = {
      _id: `feedback-${Date.now()}`,
      tournamentId: req.params.id,
      playerId,
      batting,
      bowling,
      fielding,
      teamSpirit,
      comments,
      submittedBy: req.user._id,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PUBLIC TOURNAMENT VIEW
// ============================================

/**
 * GET /api/tournaments/public/:token
 * Public tournament view (no auth required)
 */
router.get('/public/:token', async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      publicToken: req.params.token,
      isDeleted: false,
      $or: [{ isActive: true }, { status: { $in: ['published', 'ongoing', 'active'] } }]
    }).lean();

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get entries for public display
    const entries = await TournamentEntry.find({
      tournamentId: tournament._id,
      isDeleted: false
    })
      .sort({ 'entryData.teamName': 1, 'entryData.name': 1 })
      .lean();

    // Apply privacy settings
    const publicEntries = entries.map(e => {
      const data = { ...e.entryData };
      if (!tournament.settings?.showPhone) {
        data.phone = data.phone ? data.phone.replace(/\d(?=\d{4})/g, '*') : '';
      }
      if (!tournament.settings?.showEmail) {
        data.email = data.email ? data.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '';
      }
      return {
        _id: e._id,
        ...data,
        status: e.status,
      };
    });

    // Get team stats
    const teams = await TournamentEntry.aggregate([
      { $match: { tournamentId: tournament._id, isDeleted: false } },
      { $group: { _id: '$entryData.teamName', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        tournament: {
          _id: tournament._id,
          name: tournament.name,
          description: tournament.description,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          status: tournament.status,
          branding: tournament.branding,
          stats: {
            entryCount: entries.length,
            teamCount: teams.filter(t => t._id).length,
          },
        },
        entries: publicEntries,
        teams: teams.filter(t => t._id).map(t => ({ name: t._id, playerCount: t.count })),
      }
    });
  } catch (error) {
    console.error('Error fetching public tournament:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update tournament stats (entry count and team count)
 */
async function updateTournamentStats(tournamentId) {
  try {
    const entryCount = await TournamentEntry.countDocuments({
      tournamentId,
      isDeleted: false
    });

    const teams = await TournamentEntry.distinct('entryData.teamName', {
      tournamentId,
      isDeleted: false
    });

    const teamCount = teams.filter(Boolean).length;

    await Tournament.findByIdAndUpdate(tournamentId, {
      'stats.entryCount': entryCount,
      'stats.teamCount': teamCount
    });
  } catch (error) {
    console.error('Error updating tournament stats:', error);
  }
}

module.exports = router;
