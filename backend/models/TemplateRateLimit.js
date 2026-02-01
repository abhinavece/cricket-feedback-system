const mongoose = require('mongoose');

const templateRateLimitSchema = new mongoose.Schema({
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
// organizationId is required for multi-tenant isolation
templateRateLimitSchema.statics.checkRateLimit = async function(phone, organizationId, cooldownHours = 12) {
  if (!organizationId) {
    throw new Error('organizationId is required for rate limit check');
  }
  
  const record = await this.findOne({ phone, organizationId });

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
// organizationId is required for multi-tenant isolation
templateRateLimitSchema.statics.recordTemplateSent = async function(phone, organizationId, templateName, messageId, playerId = null, playerName = null) {
  if (!organizationId) {
    throw new Error('organizationId is required for recording template send');
  }
  
  const now = new Date();

  const result = await this.findOneAndUpdate(
    { phone, organizationId },
    {
      $set: {
        lastTemplateSentAt: now,
        lastTemplateName: templateName,
        lastMessageId: messageId,
        playerId,
        playerName,
        organizationId  // Ensure organizationId is set on upsert
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
// organizationId is required for multi-tenant isolation
templateRateLimitSchema.statics.getCooldownRemaining = async function(phone, organizationId, cooldownHours = 12) {
  if (!organizationId) {
    throw new Error('organizationId is required for cooldown check');
  }
  
  const check = await this.checkRateLimit(phone, organizationId, cooldownHours);
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
// organizationId is required for multi-tenant isolation
templateRateLimitSchema.statics.getAllRecords = async function(organizationId, options = {}) {
  if (!organizationId) {
    throw new Error('organizationId is required for listing records');
  }
  
  const { page = 1, limit = 20 } = options;

  const records = await this.find({ organizationId })
    .sort({ lastTemplateSentAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('playerId', 'name phone')
    .lean();

  const total = await this.countDocuments({ organizationId });

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

// Compound indexes for multi-tenant queries
templateRateLimitSchema.index({ organizationId: 1, phone: 1 }, { unique: true });
templateRateLimitSchema.index({ organizationId: 1, lastTemplateSentAt: -1 });
templateRateLimitSchema.index({ organizationId: 1, playerId: 1 });

module.exports = mongoose.model('TemplateRateLimit', templateRateLimitSchema);
