const mongoose = require('mongoose');

/**
 * WebhookProxyConfig Schema
 * Stores configuration for webhook routing between production and local development
 * 
 * Key features:
 * - All events ALWAYS go to production (no data loss)
 * - Configured phone numbers get events ALSO forwarded to local dev
 * - One-click toggle for local routing
 * - Configurable local server URL
 */
const webhookProxyConfigSchema = new mongoose.Schema({
  // Singleton identifier - only one config document
  configId: {
    type: String,
    default: 'main',
    unique: true
  },
  
  // Master toggle for local routing
  localRoutingEnabled: {
    type: Boolean,
    default: false
  },
  
  // Local development server URL (e.g., http://192.168.1.100:5002)
  localServerUrl: {
    type: String,
    default: 'http://localhost:5002'
  },
  
  // Phone numbers that should be routed to local (in addition to prod)
  // Format: ['918087102325', '919876543210']
  localRoutingPhones: [{
    type: String,
    trim: true
  }],
  
  // Production webhook URL (internal k8s service URL)
  // For k8s: http://cricket-feedback-backend-service:5001/api/whatsapp/webhook
  // For local Docker: http://backend:5000/api/whatsapp/webhook
  productionWebhookUrl: {
    type: String,
    default: 'http://cricket-feedback-backend-service:5001/api/whatsapp/webhook'
  },
  
  // Audit trail
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  lastModifiedAt: {
    type: Date,
    default: Date.now
  },
  
  // Routing statistics
  stats: {
    totalEventsReceived: { type: Number, default: 0 },
    eventsRoutedToLocal: { type: Number, default: 0 },
    eventsRoutedToProd: { type: Number, default: 0 },
    lastEventAt: { type: Date },
    lastLocalRouteAt: { type: Date }
  }
}, {
  timestamps: true
});

// Static method to get or create singleton config
webhookProxyConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne({ configId: 'main' });
  if (!config) {
    config = await this.create({ configId: 'main' });
  }
  return config;
};

// Instance method to check if a phone should be routed locally
webhookProxyConfigSchema.methods.shouldRouteToLocal = function(phone) {
  if (!this.localRoutingEnabled) return false;
  if (!phone) return false;
  
  // Normalize phone number (remove non-digits)
  const normalizedPhone = phone.replace(/\D/g, '');
  
  // Check if any configured phone matches
  return this.localRoutingPhones.some(configuredPhone => {
    const normalizedConfigured = configuredPhone.replace(/\D/g, '');
    // Match last 10 digits to handle different country code formats
    return normalizedPhone.slice(-10) === normalizedConfigured.slice(-10);
  });
};

module.exports = mongoose.model('WebhookProxyConfig', webhookProxyConfigSchema);
