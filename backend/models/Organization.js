/**
 * @fileoverview Organization Model (Tenant)
 * 
 * Represents a team/organization in the multi-tenant system.
 * Each organization has its own players, matches, payments, and WhatsApp configuration.
 * 
 * @module models/Organization
 */

const mongoose = require('mongoose');

/**
 * WhatsApp configuration schema for BYOT (Bring Your Own Token)
 */
const whatsappConfigSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false,
  },
  phoneNumberId: {
    type: String,
    default: null,
  },
  // Access token - should be encrypted in production
  accessToken: {
    type: String,
    default: null,
  },
  verifyToken: {
    type: String,
    default: null,
  },
  webhookSecret: {
    type: String,
    default: null,
  },
  businessAccountId: {
    type: String,
    default: null,
  },
  // Human-readable phone number (e.g., +91 98765 43210)
  displayPhoneNumber: {
    type: String,
    default: null,
  },
  connectedAt: {
    type: Date,
    default: null,
  },
  connectionStatus: {
    type: String,
    enum: ['pending', 'connected', 'disconnected', 'error'],
    default: 'pending',
  },
  // API version for WhatsApp
  apiVersion: {
    type: String,
    default: 'v19.0',
  },
}, { _id: false });

/**
 * Organization limits based on plan
 */
const limitsSchema = new mongoose.Schema({
  maxPlayers: {
    type: Number,
    default: 50, // Free tier default
  },
  maxMatches: {
    type: Number,
    default: 100, // Free tier default
  },
  maxAdmins: {
    type: Number,
    default: 3,
  },
  maxEditors: {
    type: Number,
    default: 5,
  },
}, { _id: false });

/**
 * Organization settings
 */
const settingsSchema = new mongoose.Schema({
  defaultTimeSlot: {
    type: String,
    enum: ['morning', 'evening', 'night', 'custom'],
    default: 'morning',
  },
  defaultGround: {
    type: String,
    default: null,
  },
  feedbackEnabled: {
    type: Boolean,
    default: true,
  },
  paymentTrackingEnabled: {
    type: Boolean,
    default: true,
  },
  availabilityTrackingEnabled: {
    type: Boolean,
    default: true,
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata',
  },
}, { _id: false });

/**
 * Main Organization Schema
 */
const organizationSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Organization slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    maxlength: [50, 'Slug cannot exceed 50 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  logo: {
    type: String, // URL to logo image
    default: null,
  },
  
  // Owner - the user who created the organization
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // WhatsApp Configuration (BYOT)
  whatsapp: {
    type: whatsappConfigSchema,
    default: () => ({}),
  },
  
  // Subscription Plan
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'free',
  },
  
  // Limits based on plan
  limits: {
    type: limitsSchema,
    default: () => ({}),
  },
  
  // Organization Settings
  settings: {
    type: settingsSchema,
    default: () => ({}),
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  
  // Stats (denormalized for quick access)
  stats: {
    playerCount: { type: Number, default: 0 },
    matchCount: { type: Number, default: 0 },
    memberCount: { type: Number, default: 1 }, // At least owner
  },
}, {
  timestamps: true,
});

// Indexes
// Note: slug already has unique: true in field definition
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ isActive: 1, isDeleted: 1 });
organizationSchema.index({ 'whatsapp.phoneNumberId': 1 }, { sparse: true });
organizationSchema.index({ plan: 1 });

// Virtual for getting members (populated separately)
organizationSchema.virtual('members', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organizations.organizationId',
});

// Instance method: Check if user is owner
organizationSchema.methods.isOwner = function(userId) {
  return this.ownerId.equals(userId);
};

// Instance method: Check if WhatsApp is configured
organizationSchema.methods.hasWhatsAppConfigured = function() {
  return this.whatsapp.enabled && 
         this.whatsapp.phoneNumberId && 
         this.whatsapp.accessToken &&
         this.whatsapp.connectionStatus === 'connected';
};

// Static method: Find by slug
organizationSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true, isDeleted: false });
};

// Static method: Find by WhatsApp phone number ID (for webhook routing)
organizationSchema.statics.findByWhatsAppPhoneNumberId = function(phoneNumberId) {
  return this.findOne({ 
    'whatsapp.phoneNumberId': phoneNumberId,
    'whatsapp.connectionStatus': 'connected',
    isActive: true,
    isDeleted: false
  });
};

// Pre-save: Generate slug from name if not provided
organizationSchema.pre('save', function() {
  if (this.isNew && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

module.exports = mongoose.model('Organization', organizationSchema);
