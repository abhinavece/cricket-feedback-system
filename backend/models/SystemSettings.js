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
  }

  // Audit trail
  settings.lastModifiedBy = userId;
  settings.lastModifiedAt = new Date();

  await settings.save();
  return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;
