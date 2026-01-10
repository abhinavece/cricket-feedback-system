const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

// POST /api/feedback - Submit new feedback
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
      additionalComments
    } = req.body;

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

// GET /api/feedback/stats - Get aggregated statistics (non-deleted only)
// Must be defined BEFORE the main GET / route to avoid route matching issues
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

// GET /api/feedback/summary - Lightweight endpoint for list view (excludes large text fields)
router.get('/summary', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Select only essential fields for list view - exclude feedbackText and additionalComments
    const feedback = await Feedback.find({ isDeleted: false })
      .select('_id playerName matchDate batting bowling fielding teamSpirit issues createdAt')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean(); // Use lean() for faster query - returns plain JS objects
    
    const total = await Feedback.countDocuments({ isDeleted: false });
    const hasMore = (pageNum * limitNum) < total;
    
    res.json({
      feedback,
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

// GET /api/feedback/trash - Get deleted feedback (must come before /:id route)
router.get('/trash', auth, async (req, res) => {
  try {
    const deletedFeedback = await Feedback.find({ isDeleted: true })
      .sort({ deletedAt: -1 })
      .lean();
    
    res.json(deletedFeedback);
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
    
    res.json(feedback);
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
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean(); // Use lean() for faster query
    
    const total = await Feedback.countDocuments({ isDeleted: false });
    const hasMore = (pageNum * limitNum) < total;
    
    res.json({
      feedback,
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

// Soft delete feedback
router.delete('/:id', async (req, res) => {
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

// Restore feedback from trash
router.post('/:id/restore', async (req, res) => {
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

// Permanently delete feedback
router.delete('/:id/permanent', async (req, res) => {
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

module.exports = router;
