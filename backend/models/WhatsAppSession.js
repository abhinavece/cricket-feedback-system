const mongoose = require('mongoose');

const whatsAppSessionSchema = new mongoose.Schema({
  // Phone number (normalized format)
  phone: {
    type: String,
    required: true,
    unique: true,
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
whatsAppSessionSchema.statics.extendSession = async function(phone, messageId, playerId = null, playerName = null) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  const existingSession = await this.findOne({ phone });

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

  // Create new session
  const session = await this.create({
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
whatsAppSessionSchema.statics.getSessionStatus = async function(phone) {
  const session = await this.findOne({ phone });
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
whatsAppSessionSchema.statics.getActiveSessions = async function(options = {}) {
  const { page = 1, limit = 20 } = options;
  const now = new Date();

  // First, update all expired sessions
  await this.updateMany(
    { expiresAt: { $lte: now }, status: 'active' },
    { $set: { status: 'expired' } }
  );

  const query = { expiresAt: { $gt: now } };

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
whatsAppSessionSchema.statics.incrementBusinessMessageCount = async function(phone) {
  await this.updateOne(
    { phone },
    { $inc: { businessMessageCount: 1 } }
  );
};

module.exports = mongoose.model('WhatsAppSession', whatsAppSessionSchema);
