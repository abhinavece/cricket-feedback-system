const mongoose = require('mongoose');

const whatsAppSessionSchema = new mongoose.Schema({
  // Multi-tenant isolation - required for all tenant-scoped data
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  // Phone number (normalized format) - unique per organization
  phone: {
    type: String,
    required: true,
    index: true
  },

  // Player reference
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    index: true
  },
  playerName: {
    type: String
  },

  // ROLLING WINDOW: Updated on EVERY incoming message from this user
  lastUserMessageAt: {
    type: Date,
    required: true,
    index: true
  },

  // Calculated: lastUserMessageAt + 24 hours
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },

  // First message that started current session chain
  sessionStartedAt: {
    type: Date,
    required: true
  },

  // Message that initiated the current session
  initiatingMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  // Stats for this session
  userMessageCount: {
    type: Number,
    default: 1
  },
  businessMessageCount: {
    type: Number,
    default: 0
  },

  // Computed status (active if now < expiresAt)
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Static method to extend or create a session
// organizationId is required for multi-tenant isolation
whatsAppSessionSchema.statics.extendSession = async function(phone, organizationId, messageId, playerId = null, playerName = null) {
  if (!organizationId) {
    throw new Error('organizationId is required for session management');
  }
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  const existingSession = await this.findOne({ phone, organizationId });

  if (existingSession) {
    // Extend existing session
    existingSession.lastUserMessageAt = now;
    existingSession.expiresAt = expiresAt;
    existingSession.userMessageCount += 1;
    existingSession.status = 'active';
    if (playerId) existingSession.playerId = playerId;
    if (playerName) existingSession.playerName = playerName;
    await existingSession.save();
    return existingSession;
  }

  // Create new session with organizationId
  const session = await this.create({
    organizationId,
    phone,
    playerId,
    playerName,
    lastUserMessageAt: now,
    expiresAt,
    sessionStartedAt: now,
    initiatingMessageId: messageId,
    userMessageCount: 1,
    businessMessageCount: 0,
    status: 'active'
  });

  return session;
};

// Static method to check if a session is active
// organizationId is required for multi-tenant isolation
whatsAppSessionSchema.statics.getSessionStatus = async function(phone, organizationId) {
  if (!organizationId) {
    // Return default inactive status if no organizationId
    console.warn('getSessionStatus called without organizationId');
    return {
      isActive: false,
      hasSession: false,
      expiresAt: null,
      remainingMinutes: 0,
      isFree: false,
      noOrganization: true
    };
  }
  
  const session = await this.findOne({ phone, organizationId });
  const now = new Date();

  if (!session) {
    return {
      isActive: false,
      hasSession: false,
      expiresAt: null,
      remainingMinutes: 0,
      isFree: false
    };
  }

  const isActive = now < session.expiresAt;
  const remainingMs = Math.max(0, session.expiresAt.getTime() - now.getTime());
  const remainingMinutes = Math.floor(remainingMs / (60 * 1000));

  // Update status if expired
  if (!isActive && session.status === 'active') {
    session.status = 'expired';
    await session.save();
  }

  return {
    isActive,
    hasSession: true,
    expiresAt: session.expiresAt,
    remainingMinutes,
    isFree: isActive, // Within active session = FREE messages
    sessionStartedAt: session.sessionStartedAt,
    userMessageCount: session.userMessageCount,
    businessMessageCount: session.businessMessageCount,
    playerId: session.playerId,
    playerName: session.playerName
  };
};

// Static method to get all active sessions
// organizationId is required for multi-tenant isolation
whatsAppSessionSchema.statics.getActiveSessions = async function(organizationId, options = {}) {
  if (!organizationId) {
    throw new Error('organizationId is required for listing sessions');
  }
  
  const { page = 1, limit = 20 } = options;
  const now = new Date();

  // First, update all expired sessions for this organization
  await this.updateMany(
    { organizationId, expiresAt: { $lte: now }, status: 'active' },
    { $set: { status: 'expired' } }
  );

  const query = { organizationId, expiresAt: { $gt: now } };

  const sessions = await this.find(query)
    .sort({ expiresAt: 1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('playerId', 'name phone')
    .lean();

  const total = await this.countDocuments(query);

  return {
    sessions: sessions.map(s => ({
      ...s,
      remainingMinutes: Math.floor((new Date(s.expiresAt).getTime() - now.getTime()) / (60 * 1000))
    })),
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasMore: page * limit < total
    }
  };
};

// Static method to increment business message count
// organizationId is required for multi-tenant isolation
whatsAppSessionSchema.statics.incrementBusinessMessageCount = async function(phone, organizationId) {
  if (!organizationId) {
    console.warn('incrementBusinessMessageCount called without organizationId - skipping');
    return;
  }
  
  await this.updateOne(
    { phone, organizationId },
    { $inc: { businessMessageCount: 1 } }
  );
};

// Compound indexes for multi-tenant queries
whatsAppSessionSchema.index({ organizationId: 1, phone: 1 }, { unique: true });
whatsAppSessionSchema.index({ organizationId: 1, expiresAt: 1 });
whatsAppSessionSchema.index({ organizationId: 1, status: 1 });
whatsAppSessionSchema.index({ organizationId: 1, playerId: 1 });

module.exports = mongoose.model('WhatsAppSession', whatsAppSessionSchema);
