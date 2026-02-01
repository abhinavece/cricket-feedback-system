/**
 * @fileoverview Organization Invite Model
 * 
 * Manages invite links for teams. Admins can generate invite links
 * that allow new users to join their organization.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const organizationInviteSchema = new mongoose.Schema({
  // The organization this invite is for
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },

  // Unique invite code (URL-safe)
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Role that invited users will get
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer',
  },

  // Who created this invite
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Optional: limit number of uses
  maxUses: {
    type: Number,
    default: null, // null = unlimited
  },

  // How many times this invite has been used
  useCount: {
    type: Number,
    default: 0,
  },

  // Expiration date (null = never expires)
  expiresAt: {
    type: Date,
    default: null,
  },

  // Soft delete
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  // Optional description/label for the invite
  label: {
    type: String,
    maxlength: 100,
  },

  // Track who used this invite
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now },
  }],

}, { timestamps: true });

// Compound index for looking up active invites
organizationInviteSchema.index({ organizationId: 1, isActive: 1 });
organizationInviteSchema.index({ code: 1, isActive: 1 });

/**
 * Generate a unique invite code
 */
organizationInviteSchema.statics.generateCode = function() {
  // Generate a URL-safe code: 8 characters, easy to share
  return crypto.randomBytes(6).toString('base64url').substring(0, 8);
};

/**
 * Check if invite is valid (not expired, not maxed out)
 */
organizationInviteSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  
  // Check expiration
  if (this.expiresAt && new Date() > this.expiresAt) {
    return false;
  }
  
  // Check max uses
  if (this.maxUses !== null && this.useCount >= this.maxUses) {
    return false;
  }
  
  return true;
};

/**
 * Record a use of this invite
 */
organizationInviteSchema.methods.recordUse = async function(userId) {
  this.useCount += 1;
  this.usedBy.push({ userId, usedAt: new Date() });
  await this.save();
};

/**
 * Find a valid invite by code
 */
organizationInviteSchema.statics.findValidByCode = async function(code) {
  const invite = await this.findOne({ code, isActive: true })
    .populate('organizationId', 'name slug logo');
  
  if (!invite) return null;
  if (!invite.isValid()) return null;
  
  return invite;
};

const OrganizationInvite = mongoose.model('OrganizationInvite', organizationInviteSchema);

module.exports = OrganizationInvite;
