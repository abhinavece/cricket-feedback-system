const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Singleton identifier - only one document should exist
  _id: {
    type: String,
    default: 'system_settings'
  },

  // Payment settings
  payment: {
    bypassImageReview: {
      type: Boolean,
      default: false
    },
    bypassDuplicateCheck: {
      type: Boolean,
      default: false
    },
    forceAdminReviewThreshold: {
      type: Number,
      default: null // null means disabled, any positive number enables it
    }
  },

  // WhatsApp settings
  whatsapp: {
    enabled: {
      type: Boolean,
      default: true
    },
    // Template rate limiting
    templateCooldownHours: {
      type: Number,
      default: 12,
      min: 1,
      max: 72
    },
    rateLimitingEnabled: {
      type: Boolean,
      default: true
    },
    // Session tracking for 24-hour windows
    sessionTrackingEnabled: {
      type: Boolean,
      default: true
    },
    // Cost tracking for messages
    costTrackingEnabled: {
      type: Boolean,
      default: true
    },
    // Block free-text messages when no active session
    blockOutOfSessionMessages: {
      type: Boolean,
      default: false
    }
  },

  // Master developer email - only this user can grant developer access to others
  masterDeveloperEmail: {
    type: String,
    default: 'abhinavsinghd1404@gmail.com'
  },

  // Audit trail
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastModifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Static method to get or create singleton settings
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findById('system_settings');
  if (!settings) {
    settings = await this.create({ _id: 'system_settings' });
  }
  return settings;
};

// Static method to update settings
systemSettingsSchema.statics.updateSettings = async function(updates, userId) {
  const settings = await this.getSettings();
  
  // Update payment settings
  if (updates.payment) {
    if (typeof updates.payment.bypassImageReview === 'boolean') {
      settings.payment.bypassImageReview = updates.payment.bypassImageReview;
    }
    if (typeof updates.payment.bypassDuplicateCheck === 'boolean') {
      settings.payment.bypassDuplicateCheck = updates.payment.bypassDuplicateCheck;
    }
    if (updates.payment.forceAdminReviewThreshold !== undefined) {
      settings.payment.forceAdminReviewThreshold = updates.payment.forceAdminReviewThreshold;
    }
  }

  // Update WhatsApp settings
  if (updates.whatsapp) {
    if (typeof updates.whatsapp.enabled === 'boolean') {
      settings.whatsapp.enabled = updates.whatsapp.enabled;
    }
    if (typeof updates.whatsapp.templateCooldownHours === 'number') {
      settings.whatsapp.templateCooldownHours = Math.max(1, Math.min(72, updates.whatsapp.templateCooldownHours));
    }
    if (typeof updates.whatsapp.rateLimitingEnabled === 'boolean') {
      settings.whatsapp.rateLimitingEnabled = updates.whatsapp.rateLimitingEnabled;
    }
    if (typeof updates.whatsapp.sessionTrackingEnabled === 'boolean') {
      settings.whatsapp.sessionTrackingEnabled = updates.whatsapp.sessionTrackingEnabled;
    }
    if (typeof updates.whatsapp.costTrackingEnabled === 'boolean') {
      settings.whatsapp.costTrackingEnabled = updates.whatsapp.costTrackingEnabled;
    }
    if (typeof updates.whatsapp.blockOutOfSessionMessages === 'boolean') {
      settings.whatsapp.blockOutOfSessionMessages = updates.whatsapp.blockOutOfSessionMessages;
    }
  }

  // Audit trail
  settings.lastModifiedBy = userId;
  settings.lastModifiedAt = new Date();

  await settings.save();
  return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;
