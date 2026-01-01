const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

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

// GET /api/feedback - Get all feedback submissions (non-deleted only)
router.get('/', async (req, res) => {
  try {
    const feedback = await Feedback.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      error: 'Failed to fetch feedback',
      details: error.message
    });
  }
});

// GET /api/feedback/stats - Get aggregated statistics (non-deleted only)
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

// Get deleted feedback (trash)
router.get('/trash', async (req, res) => {
  try {
    const deletedFeedback = await Feedback.find({ isDeleted: true })
      .sort({ deletedAt: -1 });
    
    res.json(deletedFeedback);
  } catch (error) {
    console.error('Error fetching deleted feedback:', error);
    res.status(500).json({ error: 'Failed to fetch deleted feedback' });
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
