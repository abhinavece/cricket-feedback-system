const WhatsAppSession = require('../models/WhatsAppSession');
const TemplateRateLimit = require('../models/TemplateRateLimit');
const WhatsAppCostConfig = require('../models/WhatsAppCostConfig');
const Message = require('../models/Message');
const SystemSettings = require('../models/SystemSettings');

/**
 * WhatsApp Analytics Service
 * Handles session tracking, rate limiting, cost calculation, and analytics
 */

// ============================================================
// SESSION MANAGEMENT (Rolling 24-hour Window)
// ============================================================

/**
 * Extend or create a session when a user sends a message
 * @param {string} phone - Phone number
 * @param {ObjectId} messageId - The message that triggered this
 * @param {ObjectId} playerId - Optional player ID
 * @param {string} playerName - Optional player name
 */
async function extendSession(phone, messageId, playerId = null, playerName = null) {
  const settings = await SystemSettings.getSettings();
  if (!settings.whatsapp.sessionTrackingEnabled) {
    return null;
  }
  return WhatsAppSession.extendSession(phone, messageId, playerId, playerName);
}

/**
 * Get session status for a phone number
 * @param {string} phone - Phone number
 * @returns {Object} Session status with isActive, expiresAt, remainingMinutes, isFree
 */
async function getSessionStatus(phone) {
  return WhatsAppSession.getSessionStatus(phone);
}

/**
 * Get all active sessions with pagination
 * @param {Object} options - Pagination options { page, limit }
 */
async function getActiveSessions(options = {}) {
  return WhatsAppSession.getActiveSessions(options);
}

/**
 * Check if a phone has an active session
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
async function hasActiveSession(phone) {
  const status = await getSessionStatus(phone);
  return status.isActive;
}

/**
 * Increment business message count for a session
 * @param {string} phone - Phone number
 */
async function incrementBusinessMessageCount(phone) {
  return WhatsAppSession.incrementBusinessMessageCount(phone);
}

// ============================================================
// RATE LIMITING (Template Cooldown)
// ============================================================

/**
 * Check if a template can be sent to a phone (respecting cooldown)
 * @param {string} phone - Phone number
 * @returns {Object} { canSend, lastSentAt, cooldownRemaining, totalSent }
 */
async function checkTemplateRateLimit(phone) {
  const settings = await SystemSettings.getSettings();
  if (!settings.whatsapp.rateLimitingEnabled) {
    return { canSend: true, rateLimitingDisabled: true };
  }
  return TemplateRateLimit.checkRateLimit(phone, settings.whatsapp.templateCooldownHours);
}

/**
 * Record that a template was sent
 * @param {string} phone - Phone number
 * @param {string} templateName - Template name
 * @param {ObjectId} messageId - Message ID
 * @param {ObjectId} playerId - Optional player ID
 * @param {string} playerName - Optional player name
 */
async function recordTemplateSent(phone, templateName, messageId, playerId = null, playerName = null) {
  return TemplateRateLimit.recordTemplateSent(phone, templateName, messageId, playerId, playerName);
}

/**
 * Get cooldown remaining for a phone
 * @param {string} phone - Phone number
 */
async function getCooldownRemaining(phone) {
  const settings = await SystemSettings.getSettings();
  return TemplateRateLimit.getCooldownRemaining(phone, settings.whatsapp.templateCooldownHours);
}

// ============================================================
// COST CALCULATION
// ============================================================

/**
 * Calculate the cost of sending a message
 * @param {string} phone - Phone number
 * @param {boolean} isTemplate - Is this a template message?
 * @param {string} templateCategory - Template category (utility, marketing, etc.)
 * @returns {Object} { cost, reason, sessionExpiresAt?, canSend }
 */
async function calculateMessageCost(phone, isTemplate, templateCategory = 'utility') {
  const settings = await SystemSettings.getSettings();

  // If cost tracking is disabled, return 0
  if (!settings.whatsapp.costTrackingEnabled) {
    return { cost: 0, reason: 'cost_tracking_disabled', canSend: true };
  }

  const session = await getSessionStatus(phone);

  if (session.isActive) {
    // Within 24hr window = FREE (template or free-form)
    return {
      cost: 0,
      reason: 'within_session',
      sessionExpiresAt: session.expiresAt,
      remainingMinutes: session.remainingMinutes,
      canSend: true
    };
  }

  if (!isTemplate) {
    // No session + no template = BLOCKED (can't send free-form)
    return {
      cost: null,
      reason: 'session_required',
      canSend: !settings.whatsapp.blockOutOfSessionMessages,
      blocked: settings.whatsapp.blockOutOfSessionMessages
    };
  }

  // No session + template = CHARGED
  const cost = await WhatsAppCostConfig.getCostForCategory(templateCategory);
  const config = await WhatsAppCostConfig.getConfig();

  return {
    cost,
    reason: 'new_conversation',
    category: templateCategory,
    currency: config.currency,
    canSend: true
  };
}

/**
 * Get cost for a template category
 * @param {string} category - Template category
 */
async function getCostForCategory(category) {
  return WhatsAppCostConfig.getCostForCategory(category);
}

// ============================================================
// MESSAGE STATUS & ERROR TRACKING
// ============================================================

/**
 * Update message status from webhook
 * @param {string} whatsappMessageId - WhatsApp message ID
 * @param {string} status - New status (sent, delivered, read, failed)
 * @param {Date} timestamp - Status timestamp
 */
async function updateMessageStatus(whatsappMessageId, status, timestamp) {
  const message = await Message.findOneAndUpdate(
    { whatsappMessageId },
    {
      $set: {
        status,
        statusUpdatedAt: timestamp || new Date()
      }
    },
    { new: true }
  );
  return message;
}

/**
 * Record a message error
 * @param {ObjectId} messageId - Message ID
 * @param {string} code - Error code
 * @param {string} errorMessage - Error message
 * @param {Object} details - Additional error details
 */
async function recordMessageError(messageId, code, errorMessage, details = null) {
  const message = await Message.findByIdAndUpdate(
    messageId,
    {
      $set: {
        status: 'failed',
        statusUpdatedAt: new Date(),
        errorCode: code,
        errorMessage: errorMessage,
        errorDetails: details
      }
    },
    { new: true }
  );
  return message;
}

/**
 * Record message cost
 * @param {ObjectId} messageId - Message ID
 * @param {number} cost - Cost amount
 * @param {string} category - Template category
 */
async function recordMessageCost(messageId, cost, category = null) {
  const message = await Message.findByIdAndUpdate(
    messageId,
    {
      $set: {
        messageCost: cost,
        templateCategory: category
      }
    },
    { new: true }
  );
  return message;
}

// ============================================================
// ANALYTICS & REPORTING
// ============================================================

/**
 * Get dashboard overview analytics
 */
async function getDashboardOverview() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Message stats
  const [
    totalMessages,
    last30DaysMessages,
    last7DaysMessages,
    messagesByDirection,
    messagesByStatus,
    activeSessionsCount,
    totalCost
  ] = await Promise.all([
    Message.countDocuments({ direction: 'outgoing' }),
    Message.countDocuments({ direction: 'outgoing', createdAt: { $gte: thirtyDaysAgo } }),
    Message.countDocuments({ direction: 'outgoing', createdAt: { $gte: sevenDaysAgo } }),
    Message.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$direction', count: { $sum: 1 } } }
    ]),
    Message.aggregate([
      { $match: { direction: 'outgoing', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    WhatsAppSession.countDocuments({ expiresAt: { $gt: now } }),
    Message.aggregate([
      { $match: { direction: 'outgoing', messageCost: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$messageCost' } } }
    ])
  ]);

  // Calculate delivery/read rates
  const outgoingTotal = messagesByStatus.reduce((sum, s) => sum + s.count, 0);
  const delivered = messagesByStatus.find(s => s._id === 'delivered')?.count || 0;
  const read = messagesByStatus.find(s => s._id === 'read')?.count || 0;
  const failed = messagesByStatus.find(s => s._id === 'failed')?.count || 0;

  const config = await WhatsAppCostConfig.getConfig();

  return {
    messages: {
      total: totalMessages,
      last30Days: last30DaysMessages,
      last7Days: last7DaysMessages,
      byDirection: messagesByDirection.reduce((acc, d) => {
        acc[d._id] = d.count;
        return acc;
      }, {}),
      byStatus: messagesByStatus.reduce((acc, s) => {
        acc[s._id || 'unknown'] = s.count;
        return acc;
      }, {})
    },
    rates: {
      deliveryRate: outgoingTotal > 0 ? ((delivered + read) / outgoingTotal * 100).toFixed(1) : 0,
      readRate: outgoingTotal > 0 ? (read / outgoingTotal * 100).toFixed(1) : 0,
      failureRate: outgoingTotal > 0 ? (failed / outgoingTotal * 100).toFixed(1) : 0
    },
    sessions: {
      active: activeSessionsCount
    },
    costs: {
      total: totalCost[0]?.total || 0,
      currency: config.currency
    }
  };
}

/**
 * Get cost analytics
 * @param {Object} options - { startDate, endDate, page, limit }
 */
async function getCostAnalytics(options = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate = new Date(),
    page = 1,
    limit = 20
  } = options;

  const config = await WhatsAppCostConfig.getConfig();

  // Aggregate costs by category
  const byCategory = await Message.aggregate([
    {
      $match: {
        direction: 'outgoing',
        messageCost: { $gt: 0 },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$templateCategory',
        count: { $sum: 1 },
        totalCost: { $sum: '$messageCost' }
      }
    },
    { $sort: { totalCost: -1 } }
  ]);

  // Aggregate costs by user (phone)
  const byUser = await Message.aggregate([
    {
      $match: {
        direction: 'outgoing',
        messageCost: { $gt: 0 },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$to',
        playerName: { $first: '$playerName' },
        count: { $sum: 1 },
        totalCost: { $sum: '$messageCost' }
      }
    },
    { $sort: { totalCost: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit }
  ]);

  const totalUsers = await Message.aggregate([
    {
      $match: {
        direction: 'outgoing',
        messageCost: { $gt: 0 },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    { $group: { _id: '$to' } },
    { $count: 'total' }
  ]);

  // Total cost in period
  const totalCost = byCategory.reduce((sum, c) => sum + c.totalCost, 0);

  return {
    period: { startDate, endDate },
    summary: {
      totalCost,
      currency: config.currency,
      totalMessages: byCategory.reduce((sum, c) => sum + c.count, 0)
    },
    byCategory,
    byUser,
    pagination: {
      current: page,
      pages: Math.ceil((totalUsers[0]?.total || 0) / limit),
      total: totalUsers[0]?.total || 0,
      hasMore: page * limit < (totalUsers[0]?.total || 0)
    }
  };
}

/**
 * Get cost summary for a specific user
 * @param {string} phone - Phone number
 */
async function getUserCostSummary(phone) {
  const config = await WhatsAppCostConfig.getConfig();

  const costs = await Message.aggregate([
    {
      $match: {
        direction: 'outgoing',
        to: phone
      }
    },
    {
      $group: {
        _id: '$templateCategory',
        count: { $sum: 1 },
        totalCost: { $sum: '$messageCost' }
      }
    }
  ]);

  const totalCost = costs.reduce((sum, c) => sum + c.totalCost, 0);
  const totalMessages = costs.reduce((sum, c) => sum + c.count, 0);

  return {
    phone,
    totalCost,
    totalMessages,
    currency: config.currency,
    byCategory: costs
  };
}

/**
 * Get failed messages with pagination
 * @param {Object} options - { page, limit, startDate, endDate }
 */
async function getFailedMessages(options = {}) {
  const {
    page = 1,
    limit = 20,
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate = new Date()
  } = options;

  const query = {
    direction: 'outgoing',
    status: 'failed',
    createdAt: { $gte: startDate, $lte: endDate }
  };

  const [messages, total] = await Promise.all([
    Message.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('playerId', 'name phone')
      .lean(),
    Message.countDocuments(query)
  ]);

  return {
    messages,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasMore: page * limit < total
    }
  };
}

/**
 * Pre-flight check before sending a message
 * Returns all relevant information about session, rate limit, and cost
 * @param {string} phone - Phone number
 * @param {boolean} isTemplate - Is this a template message?
 * @param {string} templateName - Template name (if applicable)
 * @param {string} templateCategory - Template category
 */
async function preSendCheck(phone, isTemplate = false, templateName = null, templateCategory = 'utility') {
  const [sessionStatus, rateLimit, costInfo] = await Promise.all([
    getSessionStatus(phone),
    isTemplate ? checkTemplateRateLimit(phone) : { canSend: true },
    calculateMessageCost(phone, isTemplate, templateCategory)
  ]);

  return {
    phone,
    session: sessionStatus,
    rateLimit: isTemplate ? rateLimit : null,
    cost: costInfo,
    canSend: costInfo.canSend && (!isTemplate || rateLimit.canSend),
    blockedReason: !costInfo.canSend ? costInfo.reason : (!rateLimit.canSend ? 'rate_limited' : null)
  };
}

module.exports = {
  // Session management
  extendSession,
  getSessionStatus,
  getActiveSessions,
  hasActiveSession,
  incrementBusinessMessageCount,

  // Rate limiting
  checkTemplateRateLimit,
  recordTemplateSent,
  getCooldownRemaining,

  // Cost calculation
  calculateMessageCost,
  getCostForCategory,

  // Message tracking
  updateMessageStatus,
  recordMessageError,
  recordMessageCost,

  // Analytics
  getDashboardOverview,
  getCostAnalytics,
  getUserCostSummary,
  getFailedMessages,
  preSendCheck
};
