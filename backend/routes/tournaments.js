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
const { auth } = require('../middleware/auth');
const { resolveTenant, requireOrgAdmin } = require('../middleware/tenantResolver');
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
router.get('/', auth, resolveTenant, async (req, res) => {
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

    const total = await Tournament.countDocuments(tenantQuery(req, query));
    const hasMore = (pageNum * limitNum) < total;

    res.json({
      success: true,
      data: tournaments,
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
router.get('/:id', auth, resolveTenant, async (req, res) => {
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

    // Get team breakdown
    const teamStats = await TournamentEntry.aggregate([
      {
        $match: {
          tournamentId: tournament._id,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$entryData.teamName',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get role breakdown
    const roleStats = await TournamentEntry.aggregate([
      {
        $match: {
          tournamentId: tournament._id,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$entryData.role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        ...tournament.toObject(),
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
router.post('/', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
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
router.put('/:id', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
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
 * DELETE /api/tournaments/:id
 * Soft delete tournament (admin only)
 */
router.delete('/:id', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
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
router.post('/:id/regenerate-token', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
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
router.get('/:id/entries', auth, resolveTenant, async (req, res) => {
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
router.post('/:id/entries', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
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
router.post('/:id/entries/bulk/preview', auth, resolveTenant, requireOrgAdmin, upload.single('file'), async (req, res) => {
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
router.post('/:id/entries/bulk', auth, resolveTenant, requireOrgAdmin, upload.single('file'), async (req, res) => {
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
router.put('/:id/entries/:entryId', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
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
router.delete('/:id/entries/:entryId', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
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
router.delete('/:id/entries', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
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
