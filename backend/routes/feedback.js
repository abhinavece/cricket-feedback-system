/**
 * @fileoverview Feedback Routes
 * 
 * Handles all feedback-related API endpoints including:
 * - Submitting general feedback (non-match-specific)
 * - Retrieving feedback with pagination and role-based redaction
 * - Getting aggregated statistics
 * - Soft delete and restore operations
 * 
 * @module routes/feedback
 */

const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const FeedbackLink = require('../models/FeedbackLink');
const Match = require('../models/Match');
const Player = require('../models/Player');
const { auth, requireEditor, requireAdmin } = require('../middleware/auth');
const feedbackService = require('../services/feedbackService');

// Use unified feedback service for redaction
const { redactFeedbackItem, redactFeedbackList } = feedbackService;

/**
 * POST /api/feedback
 * Submit new general feedback (NOT match-specific)
 * 
 * @route POST /api/feedback
 * @access Public (no auth required for general feedback)
 * @param {Object} req.body - Feedback data
 * @param {string} req.body.playerName - Player name
 * @param {string} req.body.matchDate - Match date (ISO format)
 * @param {number} req.body.batting - Batting rating (1-5)
 * @param {number} req.body.bowling - Bowling rating (1-5)
 * @param {number} req.body.fielding - Fielding rating (1-5)
 * @param {number} req.body.teamSpirit - Team spirit rating (1-5)
 * @param {string} req.body.feedbackText - Feedback text
 * @param {Object} req.body.issues - Issues object
 * @param {string} req.body.additionalComments - Additional comments
 * @returns {Object} 201 - Created feedback object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 500 - Server error
 */
router.post('/', async (req, res) => {
  try {
    const {
      playerName,
      matchDate,
      batting,
      bowling,
      fielding,
      teamSpirit,
      feedbackText,
      issues,
      additionalComments,
      feedbackType,
      matchId
    } = req.body;

    // Reject match feedback through regular endpoint - must use feedback link
    if (feedbackType === 'match' || matchId) {
      return res.status(400).json({
        error: 'Match feedback must be submitted through a feedback link'
      });
    }

    // Validate required fields
    if (!playerName || !matchDate || !feedbackText) {
      return res.status(400).json({
        error: 'Missing required fields: playerName, matchDate, feedbackText'
      });
    }

    // Validate ratings
    const ratings = { batting, bowling, fielding, teamSpirit };
    for (const [key, value] of Object.entries(ratings)) {
      if (!value || value < 1 || value > 5) {
        return res.status(400).json({
          error: `${key} rating must be between 1 and 5`
        });
      }
    }

    const feedback = new Feedback({
      playerName,
      matchDate: new Date(matchDate),
      batting,
      bowling,
      fielding,
      teamSpirit,
      feedbackText,
      issues: issues || {
        venue: false,
        equipment: false,
        timing: false,
        umpiring: false,
        other: false,
      },
      additionalComments: additionalComments || '',
    });

    const savedFeedback = await feedback.save();
    res.status(201).json(savedFeedback);
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({
      error: 'Failed to save feedback',
      details: error.message
    });
  }
});

/**
 * GET /api/feedback/stats
 * Get aggregated feedback statistics (non-deleted only)
 * 
 * @route GET /api/feedback/stats
 * @access Public (no auth required)
 * @returns {Object} 200 - Statistics object with averages and issue counts
 * @returns {Object} 500 - Server error
 * 
 * @note Must be defined BEFORE the main GET / route to avoid route matching issues
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          avgBatting: { $avg: '$batting' },
          avgBowling: { $avg: '$bowling' },
          avgFielding: { $avg: '$fielding' },
          avgTeamSpirit: { $avg: '$teamSpirit' },
          venueIssues: { $sum: { $cond: ['$issues.venue', 1, 0] } },
          equipmentIssues: { $sum: { $cond: ['$issues.equipment', 1, 0] } },
          timingIssues: { $sum: { $cond: ['$issues.timing', 1, 0] } },
          umpiringIssues: { $sum: { $cond: ['$issues.umpiring', 1, 0] } },
          otherIssues: { $sum: { $cond: ['$issues.other', 1, 0] } },
        }
      }
    ]);

    const result = stats[0] || {
      totalSubmissions: 0,
      avgBatting: 0,
      avgBowling: 0,
      avgFielding: 0,
      avgTeamSpirit: 0,
      venueIssues: 0,
      equipmentIssues: 0,
      timingIssues: 0,
      umpiringIssues: 0,
      otherIssues: 0,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error.message
    });
  }
});

/**
 * GET /api/feedback/summary
 * Get lightweight feedback summary (excludes large text fields for performance)
 * 
 * @route GET /api/feedback/summary
 * @access Private (requires authentication)
 * @param {number} req.query.page - Page number (default: 1)
 * @param {number} req.query.limit - Items per page (default: 10, max: 100)
 * @param {Object} req.user - Authenticated user (from auth middleware)
 * @returns {Object} 200 - Paginated feedback list with role-based redaction
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 */
router.get('/summary', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Select only essential fields for list view - exclude feedbackText and additionalComments
    const feedback = await Feedback.find({ isDeleted: false })
      .select('_id playerName matchDate batting bowling fielding teamSpirit issues createdAt feedbackType matchId feedbackLinkId')
      .populate('matchId', 'opponent date time ground slot')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean(); // Use lean() for faster query - returns plain JS objects

    const total = await Feedback.countDocuments({ isDeleted: false });
    const hasMore = (pageNum * limitNum) < total;

    // Redact playerName for viewer role
    console.log('[Feedback Summary] User:', req.user.email, 'Role:', req.user.role, '- Redacting:', req.user.role === 'viewer');
    const redactedFeedback = redactFeedbackList(feedback, req.user.role);

    res.json({
      feedback: redactedFeedback,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore: hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching feedback summary:', error);
    res.status(500).json({
      error: 'Failed to fetch feedback summary',
      details: error.message
    });
  }
});

// GET /api/feedback/trash - Get deleted feedback with pagination (must come before /:id route)
router.get('/trash', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Exclude large text fields for list view - use /:id for full details
    const deletedFeedback = await Feedback.find({ isDeleted: true })
      .select('_id playerName matchDate batting bowling fielding teamSpirit issues deletedAt deletedBy createdAt feedbackType matchId feedbackLinkId')
      .populate('matchId', 'opponent date time ground slot')
      .sort({ deletedAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();
    
    const total = await Feedback.countDocuments({ isDeleted: true });
    const hasMore = (pageNum * limitNum) < total;

    // Redact playerName for viewer role
    const redactedFeedback = redactFeedbackList(deletedFeedback, req.user.role);

    res.json({
      feedback: redactedFeedback,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching deleted feedback:', error);
    res.status(500).json({ error: 'Failed to fetch deleted feedback' });
  }
});

// GET /api/feedback/:id - Get single feedback with full details
router.get('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).lean();

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Redact playerName for viewer role
    const redactedFeedback = redactFeedbackItem(feedback, req.user.role);

    res.json(redactedFeedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      error: 'Failed to fetch feedback',
      details: error.message
    });
  }
});

// GET /api/feedback - Get all feedback submissions with pagination (non-deleted only)
// Full data including feedbackText and additionalComments - use for detail view
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const feedback = await Feedback.find({ isDeleted: false })
      .populate('matchId', 'opponent date time ground slot')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean(); // Use lean() for faster query

    const total = await Feedback.countDocuments({ isDeleted: false });
    const hasMore = (pageNum * limitNum) < total;

    // Redact playerName for viewer role
    const redactedFeedback = redactFeedbackList(feedback, req.user.role);

    res.json({
      feedback: redactedFeedback,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore: hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      error: 'Failed to fetch feedback',
      details: error.message
    });
  }
});

// Soft delete feedback (requires authentication)
router.delete('/:id', auth, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { deletedBy } = req.body; // Optional admin identifier

    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (feedback.isDeleted) {
      return res.status(400).json({ error: 'Feedback already deleted' });
    }

    // Soft delete
    feedback.isDeleted = true;
    feedback.deletedAt = new Date();
    feedback.deletedBy = deletedBy || 'admin';
    
    await feedback.save();

    res.json({ 
      message: 'Feedback moved to trash successfully',
      feedbackId: id 
    });
  } catch (error) {
    console.error('Error soft deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// Restore feedback from trash (requires authentication)
router.post('/:id/restore', auth, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (!feedback.isDeleted) {
      return res.status(400).json({ error: 'Feedback is not in trash' });
    }

    // Restore feedback
    feedback.isDeleted = false;
    feedback.deletedAt = undefined;
    feedback.deletedBy = undefined;
    
    await feedback.save();

    res.json({ 
      message: 'Feedback restored successfully',
      feedbackId: id 
    });
  } catch (error) {
    console.error('Error restoring feedback:', error);
    res.status(500).json({ error: 'Failed to restore feedback' });
  }
});

// Permanently delete feedback (requires authentication)
router.delete('/:id/permanent', auth, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (!feedback.isDeleted) {
      return res.status(400).json({ error: 'Feedback must be in trash before permanent deletion' });
    }

    await Feedback.findByIdAndDelete(id);

    res.json({
      message: 'Feedback permanently deleted',
      feedbackId: id
    });
  } catch (error) {
    console.error('Error permanently deleting feedback:', error);
    res.status(500).json({ error: 'Failed to permanently delete feedback' });
  }
});

// ============================================================================
// FEEDBACK LINK ENDPOINTS (Match-Specific Feedback)
// ============================================================================

// POST /api/feedback/link/generate - Generate a feedback link for a match (Admin only)
router.post('/link/generate', auth, requireAdmin, async (req, res) => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required' });
    }

    // Validate match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check for existing active link for this match
    let feedbackLink = await FeedbackLink.findOne({
      matchId: matchId,
      isActive: true
    });

    if (feedbackLink) {
      // Reuse existing active link
      return res.json({
        success: true,
        token: feedbackLink.token,
        url: `/feedback/${feedbackLink.token}`,
        expiresAt: feedbackLink.expiresAt,
        isExisting: true,
        matchInfo: {
          opponent: match.opponent,
          date: match.date,
          ground: match.ground
        },
        submissionCount: feedbackLink.submissionCount,
        accessCount: feedbackLink.accessCount
      });
    }

    // Generate new token
    const token = FeedbackLink.generateToken();

    // Set expiry to match date + 7 days
    const matchDate = new Date(match.date);
    const expiresAt = new Date(matchDate.getTime() + (7 * 24 * 60 * 60 * 1000));

    // Create new feedback link
    feedbackLink = new FeedbackLink({
      token,
      matchId: matchId,
      expiresAt,
      createdBy: req.user.id
    });

    await feedbackLink.save();

    res.status(201).json({
      success: true,
      token: feedbackLink.token,
      url: `/feedback/${feedbackLink.token}`,
      expiresAt: feedbackLink.expiresAt,
      isExisting: false,
      matchInfo: {
        opponent: match.opponent,
        date: match.date,
        ground: match.ground
      }
    });
  } catch (error) {
    console.error('Error generating feedback link:', error);
    res.status(500).json({
      error: 'Failed to generate feedback link',
      details: error.message
    });
  }
});

// GET /api/feedback/link/:token - Get match info for a feedback link (Public)
router.get('/link/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { playerName } = req.query;

    const feedbackLink = await FeedbackLink.findOne({ token }).populate('matchId');

    if (!feedbackLink) {
      return res.status(404).json({ error: 'Feedback link not found' });
    }

    // Validate link is active and not expired
    if (!feedbackLink.isValid()) {
      return res.status(410).json({
        error: 'Feedback link has expired or been deactivated'
      });
    }

    // Increment access count
    feedbackLink.accessCount += 1;
    await feedbackLink.save();

    const match = feedbackLink.matchId;

    // Check if player can submit (if playerName provided)
    let canSubmit = true;
    let alreadySubmitted = false;
    if (playerName) {
      canSubmit = feedbackLink.canPlayerSubmit(playerName);
      alreadySubmitted = !canSubmit;
    }

    res.json({
      success: true,
      match: {
        opponent: match.opponent || 'TBD',
        date: match.date,
        time: match.time || '',
        ground: match.ground,
        slot: match.slot
      },
      canSubmit,
      alreadySubmitted,
      expiresAt: feedbackLink.expiresAt
    });
  } catch (error) {
    console.error('Error fetching feedback link:', error);
    res.status(500).json({
      error: 'Failed to fetch feedback link info',
      details: error.message
    });
  }
});

// POST /api/feedback/link/:token/submit - Submit feedback via link (Public)
router.post('/link/:token/submit', async (req, res) => {
  try {
    const { token } = req.params;
    const {
      playerName,
      batting,
      bowling,
      fielding,
      teamSpirit,
      feedbackText,
      issues,
      additionalComments
    } = req.body;

    // Validate required fields
    if (!playerName || !feedbackText) {
      return res.status(400).json({
        error: 'Missing required fields: playerName, feedbackText'
      });
    }

    // Validate ratings
    const ratings = { batting, bowling, fielding, teamSpirit };
    for (const [key, value] of Object.entries(ratings)) {
      if (!value || value < 1 || value > 5) {
        return res.status(400).json({
          error: `${key} rating must be between 1 and 5`
        });
      }
    }

    // Find and validate feedback link
    const feedbackLink = await FeedbackLink.findOne({ token }).populate('matchId');

    if (!feedbackLink) {
      return res.status(404).json({ error: 'Feedback link not found' });
    }

    if (!feedbackLink.isValid()) {
      return res.status(410).json({
        error: 'Feedback link has expired or been deactivated'
      });
    }

    // Check if player already submitted
    if (!feedbackLink.canPlayerSubmit(playerName)) {
      return res.status(409).json({
        error: 'You have already submitted feedback for this match'
      });
    }

    const match = feedbackLink.matchId;

    // Try to link playerName to Player model (case-insensitive search)
    let playerId = null;
    const player = await Player.findOne({
      name: { $regex: new RegExp(`^${playerName.trim()}$`, 'i') }
    });
    if (player) {
      playerId = player._id;
    }

    // Create feedback with match binding
    const feedback = new Feedback({
      playerName: playerName.trim(),
      matchDate: match.date,
      batting,
      bowling,
      fielding,
      teamSpirit,
      feedbackText,
      issues: issues || {
        venue: false,
        equipment: false,
        timing: false,
        umpiring: false,
        other: false,
      },
      additionalComments: additionalComments || '',
      // Match-specific fields
      feedbackType: 'match',
      matchId: match._id,
      feedbackLinkId: feedbackLink._id,
      playerId
    });

    await feedback.save();

    // Record submission on link
    feedbackLink.recordSubmission(playerName);
    await feedbackLink.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id
    });
  } catch (error) {
    console.error('Error submitting feedback via link:', error);
    res.status(500).json({
      error: 'Failed to submit feedback',
      details: error.message
    });
  }
});

// GET /api/feedback/link/:matchId/links - Get all feedback links for a match (Admin only)
router.get('/link/:matchId/links', auth, requireAdmin, async (req, res) => {
  try {
    const { matchId } = req.params;

    const links = await FeedbackLink.find({ matchId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      links
    });
  } catch (error) {
    console.error('Error fetching feedback links:', error);
    res.status(500).json({
      error: 'Failed to fetch feedback links',
      details: error.message
    });
  }
});

// DELETE /api/feedback/link/:token - Deactivate a feedback link (Admin only)
router.delete('/link/:token', auth, requireAdmin, async (req, res) => {
  try {
    const { token } = req.params;

    const feedbackLink = await FeedbackLink.findOne({ token });

    if (!feedbackLink) {
      return res.status(404).json({ error: 'Feedback link not found' });
    }

    feedbackLink.isActive = false;
    await feedbackLink.save();

    res.json({
      success: true,
      message: 'Feedback link deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating feedback link:', error);
    res.status(500).json({
      error: 'Failed to deactivate feedback link',
      details: error.message
    });
  }
});

module.exports = router;
