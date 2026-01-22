const mongoose = require('mongoose');

const templateRateLimitSchema = new mongoose.Schema({
  // Phone number (normalized format)
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Last template sent time
  lastTemplateSentAt: {
    type: Date,
    required: true
  },

  // Template details
  lastTemplateName: {
    type: String
  },
  lastMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
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

  // Total templates sent to this user
  totalTemplatesSent: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Static method to check if template can be sent (respecting cooldown)
templateRateLimitSchema.statics.checkRateLimit = async function(phone, cooldownHours = 12) {
  const record = await this.findOne({ phone });

  if (!record) {
    return {
      canSend: true,
      lastSentAt: null,
      cooldownRemaining: 0,
      totalSent: 0
    };
  }

  const now = new Date();
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const timeSinceLastSend = now.getTime() - record.lastTemplateSentAt.getTime();
  const cooldownRemaining = Math.max(0, cooldownMs - timeSinceLastSend);

  return {
    canSend: cooldownRemaining === 0,
    lastSentAt: record.lastTemplateSentAt,
    cooldownRemainingMs: cooldownRemaining,
    cooldownRemainingMinutes: Math.ceil(cooldownRemaining / (60 * 1000)),
    cooldownRemainingHours: Math.ceil(cooldownRemaining / (60 * 60 * 1000)),
    totalSent: record.totalTemplatesSent,
    lastTemplateName: record.lastTemplateName
  };
};

// Static method to record a template send
templateRateLimitSchema.statics.recordTemplateSent = async function(phone, templateName, messageId, playerId = null, playerName = null) {
  const now = new Date();

  const result = await this.findOneAndUpdate(
    { phone },
    {
      $set: {
        lastTemplateSentAt: now,
        lastTemplateName: templateName,
        lastMessageId: messageId,
        playerId,
        playerName
      },
      $inc: { totalTemplatesSent: 1 }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  return result;
};

// Static method to get cooldown remaining for a phone
templateRateLimitSchema.statics.getCooldownRemaining = async function(phone, cooldownHours = 12) {
  const check = await this.checkRateLimit(phone, cooldownHours);
  return {
    phone,
    cooldownRemainingMs: check.cooldownRemainingMs || 0,
    cooldownRemainingMinutes: check.cooldownRemainingMinutes || 0,
    cooldownRemainingHours: check.cooldownRemainingHours || 0,
    canSendTemplate: check.canSend,
    lastTemplateSentAt: check.lastSentAt,
    lastTemplateName: check.lastTemplateName
  };
};

// Static method to get all rate limit records with pagination
templateRateLimitSchema.statics.getAllRecords = async function(options = {}) {
  const { page = 1, limit = 20 } = options;

  const records = await this.find()
    .sort({ lastTemplateSentAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('playerId', 'name phone')
    .lean();

  const total = await this.countDocuments();

  return {
    records,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasMore: page * limit < total
    }
  };
};

module.exports = mongoose.model('TemplateRateLimit', templateRateLimitSchema);
