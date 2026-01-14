const mongoose = require('mongoose');
const crypto = require('crypto');

const publicLinkSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['match', 'payment']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'resourceType'
  },
  viewType: {
    type: String,
    default: 'full',
    enum: ['full', 'squad', 'overview', 'payment']
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
    'payment': 'MatchPayment'
  };
  return modelMap[this.resourceType];
});

// Index for efficient queries
publicLinkSchema.index({ resourceType: 1, resourceId: 1 });
publicLinkSchema.index({ createdBy: 1 });
publicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PublicLink = mongoose.model('PublicLink', publicLinkSchema);

module.exports = PublicLink;
