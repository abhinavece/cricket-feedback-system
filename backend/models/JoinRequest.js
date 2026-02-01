/**
 * @fileoverview Join Request Model
 * 
 * Manages requests from users to join organizations/teams.
 * Supports approval workflow for team admins.
 * 
 * @module models/JoinRequest
 */

const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
  // Organization being requested to join
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  
  // User making the request
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Denormalized user info for quick display
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
  },
  
  // Request status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true,
  },
  
  // Optional message from the requester
  message: {
    type: String,
    maxlength: 500,
  },
  
  // Role to assign if approved (default viewer for safety)
  requestedRole: {
    type: String,
    enum: ['viewer', 'editor'],
    default: 'viewer',
  },
  
  // Admin review information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  reviewNote: {
    type: String,
    maxlength: 500,
  },
  
  // How the user found this team
  discoveryMethod: {
    type: String,
    enum: ['search', 'cricheroes_id', 'direct_link', 'other'],
    default: 'search',
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate pending requests
joinRequestSchema.index(
  { organizationId: 1, userId: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

// Index for efficient admin queries
joinRequestSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

/**
 * Check if user already has a pending request for this org
 */
joinRequestSchema.statics.hasPendingRequest = async function(userId, organizationId) {
  const count = await this.countDocuments({
    userId,
    organizationId,
    status: 'pending',
  });
  return count > 0;
};

/**
 * Get pending requests for an organization
 */
joinRequestSchema.statics.getPendingForOrg = async function(organizationId, options = {}) {
  const { page = 1, limit = 20 } = options;
  
  const requests = await this.find({
    organizationId,
    status: 'pending',
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments({
    organizationId,
    status: 'pending',
  });
  
  return { requests, total, hasMore: page * limit < total };
};

/**
 * Approve a join request
 */
joinRequestSchema.methods.approve = async function(reviewerId, role = 'viewer', note = '') {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNote = note;
  this.requestedRole = role;
  await this.save();
  return this;
};

/**
 * Reject a join request
 */
joinRequestSchema.methods.reject = async function(reviewerId, note = '') {
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNote = note;
  await this.save();
  return this;
};

/**
 * Cancel a join request (by the requester)
 */
joinRequestSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  await this.save();
  return this;
};

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);

module.exports = JoinRequest;
