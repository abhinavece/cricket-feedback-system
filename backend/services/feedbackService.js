/**
 * Unified Feedback Service
 *
 * This service handles all feedback-related operations including:
 * - Redaction of player names based on user role
 * - Feedback data transformation
 * - Common feedback queries
 *
 * All feedback endpoints should use this service to ensure consistent
 * behavior across the application, especially for role-based access control.
 */

const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const FeedbackLink = require('../models/FeedbackLink');

/**
 * Redact player information from a single feedback item for viewer role
 * @param {Object} feedback - The feedback object to redact
 * @param {string} userRole - The role of the requesting user
 * @returns {Object} - The feedback with redacted info if applicable
 */
const redactFeedbackItem = (feedback, userRole) => {
  if (userRole === 'viewer') {
    return {
      ...feedback,
      playerName: 'Anonymous',
      isRedacted: true,
      // Also redact any populated player info
      playerId: feedback.playerId ? { _id: feedback.playerId._id || feedback.playerId } : null
    };
  }
  return { ...feedback, isRedacted: false };
};

/**
 * Redact player information from a list of feedback items for viewer role
 * @param {Array} feedbackList - Array of feedback objects
 * @param {string} userRole - The role of the requesting user
 * @returns {Array} - The feedback list with redacted info if applicable
 */
const redactFeedbackList = (feedbackList, userRole) => {
  if (userRole === 'viewer') {
    return feedbackList.map(item => ({
      ...item,
      playerName: 'Anonymous',
      isRedacted: true,
      // Also redact any populated player info
      playerId: item.playerId ? { _id: item.playerId._id || item.playerId } : null
    }));
  }
  return feedbackList.map(item => ({ ...item, isRedacted: false }));
};

/**
 * Get feedback for a specific match with role-based redaction
 * @param {string} matchId - The match ID
 * @param {Object} options - Query options (page, limit)
 * @param {string} userRole - The role of the requesting user
 * @returns {Object} - Paginated feedback list with redaction applied
 */
const getMatchFeedback = async (matchId, options = {}, userRole) => {
  const { page = 1, limit = 20 } = options;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const feedback = await Feedback.find({
    matchId: matchId,
    isDeleted: false
  })
    .populate('playerId', 'name')
    .populate('matchId', 'opponent date time ground slot')
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .lean();

  const total = await Feedback.countDocuments({
    matchId: matchId,
    isDeleted: false
  });

  const hasMore = (pageNum * limitNum) < total;

  // Apply role-based redaction
  const redactedFeedback = redactFeedbackList(feedback, userRole);

  return {
    feedback: redactedFeedback,
    pagination: {
      current: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      hasMore
    }
  };
};

/**
 * Get feedback for a specific player with role-based redaction
 * @param {Object} query - The query to find feedback (by playerId or playerName)
 * @param {Object} options - Query options (page, limit)
 * @param {string} userRole - The role of the requesting user
 * @returns {Object} - Paginated feedback list with redaction applied
 */
const getPlayerFeedback = async (query, options = {}, userRole) => {
  const { page = 1, limit = 20 } = options;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const feedback = await Feedback.find({ ...query, isDeleted: false })
    .populate('matchId', 'opponent date time ground slot')
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .lean();

  const total = await Feedback.countDocuments({ ...query, isDeleted: false });
  const hasMore = (pageNum * limitNum) < total;

  // Apply role-based redaction
  const redactedFeedback = redactFeedbackList(feedback, userRole);

  return {
    feedback: redactedFeedback,
    pagination: {
      current: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      hasMore
    }
  };
};

/**
 * Get aggregated stats for match feedback
 * @param {string} matchId - The match ID
 * @returns {Object} - Aggregated stats
 */
const getMatchFeedbackStats = async (matchId) => {
  const statsAggregation = await Feedback.aggregate([
    { $match: { matchId: new mongoose.Types.ObjectId(matchId), isDeleted: false } },
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
        otherIssues: { $sum: { $cond: ['$issues.other', 1, 0] } }
      }
    }
  ]);

  const stats = statsAggregation[0] || {
    totalSubmissions: 0,
    avgBatting: 0,
    avgBowling: 0,
    avgFielding: 0,
    avgTeamSpirit: 0,
    venueIssues: 0,
    equipmentIssues: 0,
    timingIssues: 0,
    umpiringIssues: 0,
    otherIssues: 0
  };

  return {
    totalSubmissions: stats.totalSubmissions,
    avgBatting: Math.round(stats.avgBatting * 10) / 10 || 0,
    avgBowling: Math.round(stats.avgBowling * 10) / 10 || 0,
    avgFielding: Math.round(stats.avgFielding * 10) / 10 || 0,
    avgTeamSpirit: Math.round(stats.avgTeamSpirit * 10) / 10 || 0,
    issues: {
      venue: stats.venueIssues,
      equipment: stats.equipmentIssues,
      timing: stats.timingIssues,
      umpiring: stats.umpiringIssues,
      other: stats.otherIssues
    }
  };
};

/**
 * Get aggregated stats for player feedback
 * @param {Object} query - The query to find feedback
 * @returns {Object} - Aggregated stats
 */
const getPlayerFeedbackStats = async (query) => {
  const statsAggregation = await Feedback.aggregate([
    { $match: { ...query, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        avgBatting: { $avg: '$batting' },
        avgBowling: { $avg: '$bowling' },
        avgFielding: { $avg: '$fielding' },
        avgTeamSpirit: { $avg: '$teamSpirit' }
      }
    }
  ]);

  const stats = statsAggregation[0] || {
    totalFeedback: 0,
    avgBatting: 0,
    avgBowling: 0,
    avgFielding: 0,
    avgTeamSpirit: 0
  };

  return {
    totalFeedback: stats.totalFeedback,
    avgBatting: Math.round(stats.avgBatting * 10) / 10 || 0,
    avgBowling: Math.round(stats.avgBowling * 10) / 10 || 0,
    avgFielding: Math.round(stats.avgFielding * 10) / 10 || 0,
    avgTeamSpirit: Math.round(stats.avgTeamSpirit * 10) / 10 || 0
  };
};

module.exports = {
  redactFeedbackItem,
  redactFeedbackList,
  getMatchFeedback,
  getPlayerFeedback,
  getMatchFeedbackStats,
  getPlayerFeedbackStats
};
