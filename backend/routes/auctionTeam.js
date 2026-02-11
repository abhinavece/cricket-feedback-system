/**
 * @fileoverview AuctionTeam Routes
 * 
 * Team management for auctions: create teams, generate access codes,
 * manage retained players with captain designation.
 * 
 * All routes require: auth + resolveAuctionAdmin
 * 
 * @module routes/auctionTeam
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const { resolveAuctionAdmin } = require('../middleware/auctionAuth');
const AuctionTeam = require('../models/AuctionTeam');

// ============================================================
// ADD TEAM
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/teams
 * Add a new team to the auction.
 */
router.post('/', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (!['draft', 'configured'].includes(req.auction.status)) {
      return res.status(400).json({
        success: false,
        error: 'Teams can only be added in draft or configured status',
      });
    }

    const { name, shortName, logo, primaryColor, secondaryColor, owner } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Team name is required' });
    }
    if (!shortName || !shortName.trim()) {
      return res.status(400).json({ success: false, error: 'Short name is required' });
    }

    // Generate access credentials
    const rawAccessCode = AuctionTeam.generateAccessCode();
    const accessToken = AuctionTeam.generateAccessToken();
    const hashedAccessCode = await bcrypt.hash(rawAccessCode, 10);

    const team = new AuctionTeam({
      auctionId: req.auction._id,
      name: name.trim(),
      shortName: shortName.trim().toUpperCase().substring(0, 5),
      logo: logo || '',
      primaryColor: primaryColor || '#14b8a6',
      secondaryColor: secondaryColor || '#0f172a',
      owner: owner || {},
      accessCode: hashedAccessCode,
      accessToken,
      purseValue: req.auction.config.purseValue,
      purseRemaining: req.auction.config.purseValue,
    });

    await team.save();

    res.status(201).json({
      success: true,
      data: {
        ...team.toObject(),
        accessCode: undefined, // don't return hashed code
        rawAccessCode, // return plain code once for admin to share
        accessToken,
        magicLink: `${process.env.AUCTION_FRONTEND_URL || 'https://auction.cricsmart.in'}/bid/${accessToken}`,
      },
    });
  } catch (error) {
    console.error('Add team error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: 'A team with this short name already exists in this auction' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// LIST TEAMS
// ============================================================

/**
 * GET /api/v1/auctions/:auctionId/teams
 * List all teams in the auction with squad details.
 */
router.get('/', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const teams = await AuctionTeam.find({
      auctionId: req.auction._id,
      isActive: true,
    })
      .select('-accessCode')
      .populate('players.playerId', 'name role imageUrl playerNumber')
      .lean();

    res.json({ success: true, data: teams });
  } catch (error) {
    console.error('List teams error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// UPDATE TEAM
// ============================================================

/**
 * PATCH /api/v1/auctions/:auctionId/teams/:teamId
 * Update team details.
 */
router.patch('/:teamId', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const team = await AuctionTeam.findOne({
      _id: req.params.teamId,
      auctionId: req.auction._id,
      isActive: true,
    });

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const allowedFields = ['name', 'shortName', 'logo', 'primaryColor', 'secondaryColor', 'owner'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'shortName') {
          team[field] = req.body[field].toUpperCase().substring(0, 5);
        } else {
          team[field] = req.body[field];
        }
      }
    }

    await team.save();

    res.json({ success: true, data: team });
  } catch (error) {
    console.error('Update team error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: 'A team with this short name already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// REGENERATE ACCESS CREDENTIALS
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/teams/:teamId/regenerate-access
 * Regenerate access code and token for a team.
 */
router.post('/:teamId/regenerate-access', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    const team = await AuctionTeam.findOne({
      _id: req.params.teamId,
      auctionId: req.auction._id,
      isActive: true,
    });

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const rawAccessCode = AuctionTeam.generateAccessCode();
    const accessToken = AuctionTeam.generateAccessToken();

    team.accessCode = await bcrypt.hash(rawAccessCode, 10);
    team.accessToken = accessToken;
    await team.save();

    res.json({
      success: true,
      data: {
        rawAccessCode,
        accessToken,
        magicLink: `${process.env.AUCTION_FRONTEND_URL || 'https://auction.cricsmart.in'}/bid/${accessToken}`,
      },
    });
  } catch (error) {
    console.error('Regenerate access error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ADD RETAINED PLAYER
// ============================================================

/**
 * POST /api/v1/auctions/:auctionId/teams/:teamId/retain
 * Add a retained player to a team (separate from pool).
 */
router.post('/:teamId/retain', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (!['draft', 'configured'].includes(req.auction.status)) {
      return res.status(400).json({
        success: false,
        error: 'Retained players can only be added in draft or configured status',
      });
    }

    if (!req.auction.config.retentionEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Retention is not enabled for this auction',
      });
    }

    const team = await AuctionTeam.findOne({
      _id: req.params.teamId,
      auctionId: req.auction._id,
      isActive: true,
    });

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Check max retentions
    if (team.retainedPlayers.length >= req.auction.config.maxRetentions) {
      return res.status(400).json({
        success: false,
        error: `Maximum ${req.auction.config.maxRetentions} retained players allowed per team`,
      });
    }

    const { name, role, imageUrl, stats, isCaptain } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Retained player name and role are required',
      });
    }

    // If isCaptain, unset any existing captain
    if (isCaptain) {
      team.retainedPlayers.forEach(p => { p.isCaptain = false; });
    }

    team.retainedPlayers.push({
      name: name.trim(),
      role,
      imageUrl: imageUrl || '',
      stats: stats || {},
      isCaptain: !!isCaptain,
      retentionCost: req.auction.config.retentionCost || 0,
    });

    // Deduct retention cost from purse if applicable
    const cost = req.auction.config.retentionCost || 0;
    if (cost > 0) {
      team.purseRemaining = Math.max(0, team.purseRemaining - cost);
    }

    await team.save();

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('Add retained player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// REMOVE RETAINED PLAYER
// ============================================================

/**
 * DELETE /api/v1/auctions/:auctionId/teams/:teamId/retain/:retainedId
 * Remove a retained player from a team.
 */
router.delete('/:teamId/retain/:retainedId', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (!['draft', 'configured'].includes(req.auction.status)) {
      return res.status(400).json({
        success: false,
        error: 'Retained players can only be removed in draft or configured status',
      });
    }

    const team = await AuctionTeam.findOne({
      _id: req.params.teamId,
      auctionId: req.auction._id,
      isActive: true,
    });

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const retainedIdx = team.retainedPlayers.findIndex(
      p => p._id.toString() === req.params.retainedId
    );

    if (retainedIdx === -1) {
      return res.status(404).json({ success: false, error: 'Retained player not found' });
    }

    // Refund retention cost
    const cost = team.retainedPlayers[retainedIdx].retentionCost || 0;
    if (cost > 0) {
      team.purseRemaining = Math.min(team.purseValue, team.purseRemaining + cost);
    }

    team.retainedPlayers.splice(retainedIdx, 1);
    await team.save();

    res.json({ success: true, data: team });
  } catch (error) {
    console.error('Remove retained player error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DELETE TEAM (Soft delete)
// ============================================================

/**
 * DELETE /api/v1/auctions/:auctionId/teams/:teamId
 * Deactivate a team. Only in draft status.
 */
router.delete('/:teamId', auth, resolveAuctionAdmin, async (req, res) => {
  try {
    if (req.auction.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Teams can only be removed in draft status',
      });
    }

    const team = await AuctionTeam.findOne({
      _id: req.params.teamId,
      auctionId: req.auction._id,
    });

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    team.isActive = false;
    await team.save();

    res.json({ success: true, message: 'Team removed' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// TEAM LOGIN (Access Code → JWT)
// ============================================================

/**
 * POST /api/v1/auctions/team-login
 * Authenticate a team using access code or magic link token.
 * Returns a team-scoped JWT.
 */
router.post('/team-login', async (req, res) => {
  try {
    const { accessToken, accessCode, auctionId } = req.body;

    let team;

    if (accessToken) {
      // Magic link login
      team = await AuctionTeam.findOne({ accessToken, isActive: true })
        .select('+accessCode');
    } else if (accessCode && auctionId) {
      // Access code login: find all teams in auction, compare codes
      const teams = await AuctionTeam.find({ auctionId, isActive: true })
        .select('+accessCode');

      for (const t of teams) {
        const match = await bcrypt.compare(accessCode, t.accessCode);
        if (match) {
          team = t;
          break;
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide either accessToken or accessCode+auctionId',
      });
    }

    if (!team) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access credentials',
      });
    }

    // Generate team-scoped JWT
    const token = jwt.sign(
      {
        teamId: team._id,
        auctionId: team.auctionId,
        teamName: team.name,
        type: 'team',
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
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

module.exports = router;
