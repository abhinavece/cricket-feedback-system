const mongoose = require('mongoose');
const crypto = require('crypto');

const publicLinkSchema = new mongoose.Schema({
  // Multi-tenant isolation - required for all tenant-scoped data
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['match', 'payment', 'tournament']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'resourceType'
  },
  viewType: {
    type: String,
    default: 'full',
    enum: ['full', 'squad', 'overview', 'payment', 'players']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date,
    default: null // null = never expires
  },
  accessCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastAccessedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate a short, URL-safe token
publicLinkSchema.statics.generateToken = function() {
  return crypto.randomBytes(8).toString('base64url');
};

// Check if link is valid (active and not expired)
publicLinkSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

// Increment access count
publicLinkSchema.methods.recordAccess = async function() {
  this.accessCount += 1;
  this.lastAccessedAt = new Date();
  await this.save();
};

// Virtual to get the resource model name
publicLinkSchema.virtual('resourceModel').get(function() {
  const modelMap = {
    'match': 'Match',
    'payment': 'MatchPayment',
    'tournament': 'Tournament'
  };
  return modelMap[this.resourceType];
});

// Compound indexes for multi-tenant queries
publicLinkSchema.index({ organizationId: 1, resourceType: 1, resourceId: 1 });
publicLinkSchema.index({ organizationId: 1, createdBy: 1 });
publicLinkSchema.index({ organizationId: 1, isActive: 1, expiresAt: 1 });
publicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PublicLink = mongoose.model('PublicLink', publicLinkSchema);

module.exports = PublicLink;
