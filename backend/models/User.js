/**
 * @fileoverview User Model
 * 
 * Represents authenticated users in the system.
 * Users can belong to multiple organizations with different roles in each.
 * 
 * @module models/User
 */

const mongoose = require('mongoose');

/**
 * Organization membership schema - defines user's role within an organization
 */
const organizationMembershipSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  // Role within this specific organization
  role: {
    type: String,
    enum: ['owner', 'admin', 'editor', 'viewer'],
    default: 'viewer',
  },
  // Player profile linked to this user in this organization
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Invitation status for pending invites
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'active',
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  
  // DEPRECATED: Legacy single-organization role
  // Kept for backward compatibility during migration
  // Use organizations[].role instead
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer',
  },
  
  // DEPRECATED: Legacy single-organization playerId
  // Kept for backward compatibility during migration
  // Use organizations[].playerId instead
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null,
  },
  
  // Multi-tenant: Organizations this user belongs to
  organizations: {
    type: [organizationMembershipSchema],
    default: [],
  },
  
  // Currently active organization (for session)
  activeOrganizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  },
  
  // Platform-level role (super admin for platform management)
  platformRole: {
    type: String,
    enum: ['user', 'platform_admin'],
    default: 'user',
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  profileComplete: {
    type: Boolean,
    default: false,
  },
  hasDeveloperAccess: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ 'organizations.organizationId': 1 });
userSchema.index({ activeOrganizationId: 1 });
userSchema.index({ platformRole: 1 });

/**
 * Instance method: Get user's role in a specific organization
 * @param {ObjectId} organizationId - Organization ID
 * @returns {string|null} Role in organization or null if not a member
 */
userSchema.methods.getRoleInOrganization = function(organizationId) {
  const membership = this.organizations.find(
    m => m.organizationId.equals(organizationId)
  );
  return membership ? membership.role : null;
};

/**
 * Instance method: Check if user is a member of an organization
 * @param {ObjectId} organizationId - Organization ID
 * @returns {boolean}
 */
userSchema.methods.isMemberOf = function(organizationId) {
  return this.organizations.some(
    m => m.organizationId.equals(organizationId) && m.status === 'active'
  );
};

/**
 * Instance method: Check if user is owner of an organization
 * @param {ObjectId} organizationId - Organization ID
 * @returns {boolean}
 */
userSchema.methods.isOwnerOf = function(organizationId) {
  const membership = this.organizations.find(
    m => m.organizationId.equals(organizationId)
  );
  return membership && membership.role === 'owner';
};

/**
 * Instance method: Check if user is admin or owner of an organization
 * @param {ObjectId} organizationId - Organization ID
 * @returns {boolean}
 */
userSchema.methods.isAdminOf = function(organizationId) {
  const membership = this.organizations.find(
    m => m.organizationId.equals(organizationId)
  );
  return membership && ['owner', 'admin'].includes(membership.role);
};

/**
 * Instance method: Check if user can edit in an organization (editor, admin, or owner)
 * @param {ObjectId} organizationId - Organization ID
 * @returns {boolean}
 */
userSchema.methods.canEditIn = function(organizationId) {
  const membership = this.organizations.find(
    m => m.organizationId.equals(organizationId)
  );
  return membership && ['owner', 'admin', 'editor'].includes(membership.role);
};

/**
 * Instance method: Get player ID for a specific organization
 * @param {ObjectId} organizationId - Organization ID
 * @returns {ObjectId|null}
 */
userSchema.methods.getPlayerIdInOrganization = function(organizationId) {
  const membership = this.organizations.find(
    m => m.organizationId.equals(organizationId)
  );
  return membership ? membership.playerId : null;
};

/**
 * Instance method: Add user to an organization
 * @param {ObjectId} organizationId - Organization ID
 * @param {string} role - Role in organization
 * @param {ObjectId} invitedBy - User who invited
 * @returns {Object} The membership object
 */
userSchema.methods.addToOrganization = function(organizationId, role = 'viewer', invitedBy = null) {
  // Check if already a member
  const existingIdx = this.organizations.findIndex(
    m => m.organizationId.equals(organizationId)
  );
  
  if (existingIdx >= 0) {
    // Update existing membership
    this.organizations[existingIdx].role = role;
    this.organizations[existingIdx].status = 'active';
    return this.organizations[existingIdx];
  }
  
  // Add new membership
  const membership = {
    organizationId,
    role,
    invitedBy,
    joinedAt: new Date(),
    status: 'active',
  };
  this.organizations.push(membership);
  
  // Set as active if first organization
  if (this.organizations.length === 1) {
    this.activeOrganizationId = organizationId;
  }
  
  return membership;
};

/**
 * Instance method: Remove user from an organization
 * @param {ObjectId} organizationId - Organization ID
 * @returns {boolean} True if removed
 */
userSchema.methods.removeFromOrganization = function(organizationId) {
  const idx = this.organizations.findIndex(
    m => m.organizationId.equals(organizationId)
  );
  
  if (idx < 0) return false;
  
  this.organizations.splice(idx, 1);
  
  // Clear active org if it was this one
  if (this.activeOrganizationId && this.activeOrganizationId.equals(organizationId)) {
    this.activeOrganizationId = this.organizations.length > 0 
      ? this.organizations[0].organizationId 
      : null;
  }
  
  return true;
};

/**
 * Instance method: Check if user is a platform admin
 * @returns {boolean}
 */
userSchema.methods.isPlatformAdmin = function() {
  return this.platformRole === 'platform_admin';
};

module.exports = mongoose.model('User', userSchema);
