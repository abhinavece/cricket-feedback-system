const mongoose = require('mongoose');

const whatsAppCostConfigSchema = new mongoose.Schema({
  // Singleton identifier
  _id: {
    type: String,
    default: 'whatsapp_cost_config'
  },

  // Template costs by category (in INR)
  templateCosts: {
    utility: {
      type: Number,
      default: 0.35
    },
    marketing: {
      type: Number,
      default: 0.75
    },
    authentication: {
      type: Number,
      default: 0.30
    },
    service: {
      type: Number,
      default: 0.00
    }
  },

  // Currency
  currency: {
    type: String,
    default: 'INR'
  },

  // Audit trail
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Static method to get or create singleton config
whatsAppCostConfigSchema.statics.getConfig = async function() {
  let config = await this.findById('whatsapp_cost_config');
  if (!config) {
    config = await this.create({ _id: 'whatsapp_cost_config' });
  }
  return config;
};

// Static method to update config
whatsAppCostConfigSchema.statics.updateConfig = async function(updates, userId) {
  const config = await this.getConfig();

  if (updates.templateCosts) {
    if (typeof updates.templateCosts.utility === 'number') {
      config.templateCosts.utility = updates.templateCosts.utility;
    }
    if (typeof updates.templateCosts.marketing === 'number') {
      config.templateCosts.marketing = updates.templateCosts.marketing;
    }
    if (typeof updates.templateCosts.authentication === 'number') {
      config.templateCosts.authentication = updates.templateCosts.authentication;
    }
    if (typeof updates.templateCosts.service === 'number') {
      config.templateCosts.service = updates.templateCosts.service;
    }
  }

  if (updates.currency) {
    config.currency = updates.currency;
  }

  config.lastModifiedBy = userId;
  config.lastModifiedAt = new Date();

  await config.save();
  return config;
};

// Static method to get cost for a template category
whatsAppCostConfigSchema.statics.getCostForCategory = async function(category) {
  const config = await this.getConfig();
  const normalizedCategory = category?.toLowerCase() || 'utility';
  return config.templateCosts[normalizedCategory] || config.templateCosts.utility;
};

module.exports = mongoose.model('WhatsAppCostConfig', whatsAppCostConfigSchema);
