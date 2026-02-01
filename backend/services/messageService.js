/**
 * @fileoverview Message Service for Multi-Tenant WhatsApp Messaging
 * 
 * Provides helper functions for creating Message documents with proper
 * organizationId handling for multi-tenant isolation.
 * 
 * @module services/messageService
 */

const Message = require('../models/Message');
const Player = require('../models/Player');
const Match = require('../models/Match');
const MatchPayment = require('../models/MatchPayment');

/**
 * Default organization ID for fallback (Mavericks XI)
 * This should be used only when no other organization can be determined
 */
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || '697fb2430f8ac0eaeab6e3b8';

/**
 * Resolve organizationId from various context sources
 * 
 * Priority order:
 * 1. Explicit organizationId in metadata
 * 2. From matchId (if provided)
 * 3. From paymentId (if provided)
 * 4. From playerId (if provided)
 * 5. From phone number (lookup player)
 * 6. Default organization (fallback)
 * 
 * @param {Object} context - Context object with potential org references
 * @param {string} context.organizationId - Explicit organization ID
 * @param {string} context.matchId - Match ID to resolve org from
 * @param {string} context.paymentId - Payment ID to resolve org from
 * @param {string} context.playerId - Player ID to resolve org from
 * @param {string} context.phone - Phone number to lookup player
 * @returns {Promise<string>} - Resolved organizationId
 */
async function resolveOrganizationId(context = {}) {
  // 1. Explicit organizationId
  if (context.organizationId) {
    return context.organizationId;
  }

  // 2. From matchId
  if (context.matchId) {
    try {
      const match = await Match.findById(context.matchId).select('organizationId').lean();
      if (match?.organizationId) {
        return match.organizationId;
      }
    } catch (err) {
      console.warn(`Failed to resolve org from matchId: ${err.message}`);
    }
  }

  // 3. From paymentId
  if (context.paymentId) {
    try {
      const payment = await MatchPayment.findById(context.paymentId).select('organizationId').lean();
      if (payment?.organizationId) {
        return payment.organizationId;
      }
    } catch (err) {
      console.warn(`Failed to resolve org from paymentId: ${err.message}`);
    }
  }

  // 4. From playerId
  if (context.playerId) {
    try {
      const player = await Player.findById(context.playerId).select('organizationId').lean();
      if (player?.organizationId) {
        return player.organizationId;
      }
    } catch (err) {
      console.warn(`Failed to resolve org from playerId: ${err.message}`);
    }
  }

  // 5. From phone number (try multiple formats)
  if (context.phone) {
    try {
      const formattedPhone = formatPhone(context.phone);
      // Try exact match first, then regex on last 10 digits
      let player = await Player.findOne({ phone: formattedPhone }).select('organizationId').lean();
      if (!player && formattedPhone.length >= 10) {
        const last10 = formattedPhone.slice(-10);
        player = await Player.findOne({ 
          phone: { $regex: last10 + '$' } 
        }).select('organizationId').lean();
      }
      if (player?.organizationId) {
        return player.organizationId;
      }
    } catch (err) {
      console.warn(`Failed to resolve org from phone: ${err.message}`);
    }
  }

  // 6. Default fallback
  console.warn(`Could not resolve organizationId, using default: ${DEFAULT_ORG_ID}`);
  return DEFAULT_ORG_ID;
}

/**
 * Format phone number to standard format
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
function formatPhone(phone) {
  if (!phone) return '';
  let formatted = phone.replace(/\D/g, '');
  if (!formatted.startsWith('91') && formatted.length === 10) {
    formatted = '91' + formatted;
  }
  return formatted;
}

/**
 * Create an outgoing message with proper organizationId
 * 
 * @param {Object} params - Message parameters
 * @param {string} params.from - Sender (WhatsApp phone number ID)
 * @param {string} params.to - Recipient phone number
 * @param {string} params.text - Message text
 * @param {string} params.messageId - WhatsApp message ID
 * @param {Object} params.metadata - Additional metadata
 * @param {Object} context - Context for organizationId resolution
 * @returns {Promise<Message>} - Created message document
 */
async function createOutgoingMessage(params, context = {}) {
  const { from, to, text, messageId, metadata = {} } = params;
  
  const organizationId = await resolveOrganizationId({
    ...context,
    organizationId: metadata.organizationId,
    matchId: metadata.matchId,
    paymentId: metadata.paymentId,
    playerId: metadata.playerId,
    phone: to,
  });

  const messageData = {
    organizationId,
    from,
    to,
    text,
    direction: 'outgoing',
    messageId,
    whatsappMessageId: messageId,
    status: 'sent',
    statusUpdatedAt: new Date(),
    timestamp: new Date(),
    messageType: metadata.messageType || 'general',
    matchId: metadata.matchId || null,
    paymentId: metadata.paymentId || null,
    playerId: metadata.playerId || null,
    playerName: metadata.playerName || null,
    matchTitle: metadata.matchTitle || null,
  };

  const savedMsg = await Message.create(messageData);
  return savedMsg;
}

/**
 * Create an incoming message with proper organizationId
 * 
 * @param {Object} params - Message parameters
 * @param {string} params.from - Sender phone number
 * @param {string} params.to - Recipient (WhatsApp phone number ID)
 * @param {string} params.text - Message text
 * @param {string} params.messageId - WhatsApp message ID
 * @param {Object} params.metadata - Additional metadata
 * @param {Object} context - Context for organizationId resolution
 * @returns {Promise<Message>} - Created message document
 */
async function createIncomingMessage(params, context = {}) {
  const { from, to, text, messageId, metadata = {} } = params;
  
  const organizationId = await resolveOrganizationId({
    ...context,
    organizationId: metadata.organizationId,
    matchId: metadata.matchId,
    paymentId: metadata.paymentId,
    playerId: metadata.playerId,
    phone: from,
  });

  const messageData = {
    organizationId,
    from,
    to,
    text,
    direction: 'incoming',
    messageId,
    timestamp: new Date(),
    messageType: metadata.messageType || 'general',
    matchId: metadata.matchId || null,
    paymentId: metadata.paymentId || null,
    playerId: metadata.playerId || null,
    playerName: metadata.playerName || null,
    imageId: metadata.imageId || null,
    imageUrl: metadata.imageUrl || null,
    contextId: metadata.contextId || null,
  };

  const savedMsg = await Message.create(messageData);
  return savedMsg;
}

/**
 * Find or create a message (idempotent)
 * Useful for webhook processing where the same message might be received multiple times
 * 
 * @param {string} messageId - WhatsApp message ID
 * @param {Object} messageData - Message data to create if not found
 * @param {Object} context - Context for organizationId resolution
 * @returns {Promise<{message: Message, created: boolean}>}
 */
async function findOrCreateMessage(messageId, messageData, context = {}) {
  // Check if message already exists
  const existing = await Message.findOne({ messageId });
  if (existing) {
    return { message: existing, created: false };
  }

  // Resolve organizationId
  const organizationId = await resolveOrganizationId({
    ...context,
    organizationId: messageData.organizationId,
    matchId: messageData.matchId,
    paymentId: messageData.paymentId,
    playerId: messageData.playerId,
    phone: messageData.from || messageData.to,
  });

  // Create new message
  const message = await Message.create({
    ...messageData,
    organizationId,
    messageId,
    timestamp: messageData.timestamp || new Date(),
  });

  return { message, created: true };
}

module.exports = {
  resolveOrganizationId,
  createOutgoingMessage,
  createIncomingMessage,
  findOrCreateMessage,
  formatPhone,
  DEFAULT_ORG_ID,
};
