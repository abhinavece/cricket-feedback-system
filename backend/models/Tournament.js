/**
 * @fileoverview Tournament Model
 * 
 * Represents tournaments hosted by organizations.
 * Tournaments can have multiple teams and player entries.
 * 
 * @module models/Tournament
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const brandingSchema = new mongoose.Schema({
  tagline: {
    type: String,
    trim: true,
    default: 'Powered by CricSmart AI'
  },
  logo: {
    type: String,
    trim: true,
    default: ''
  },
  coverImage: {
    type: String,
    trim: true,
    default: ''
  },
  primaryColor: {
    type: String,
    trim: true,
    default: '#10b981' // Emerald-500
  },
  theme: {
    type: String,
    enum: ['default', 'corporate', 'classic'],
    default: 'default'
  }
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  isPublic: {
    type: Boolean,
    default: true
  },
  allowTeamRegistration: {
    type: Boolean,
    default: false
  },
  maxTeams: {
    type: Number,
    default: null
  },
  // Which fields to display publicly (empty = all)
  playerFields: {
    type: [String],
    default: ['name', 'role', 'teamName', 'companyName']
  },
  // Privacy settings
  showPhone: {
    type: Boolean,
    default: false // Masked by default
  },
  showEmail: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const statsSchema = new mongoose.Schema({
  entryCount: {
    type: Number,
    default: 0
  },
  teamCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Admin role schema for resource-level authorization
const adminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'editor'],
    default: 'admin',
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { _id: false });

const tournamentSchema = new mongoose.Schema({
  // Multi-tenant: Organization that hosts this tournament (OPTIONAL for standalone tournaments)
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false, // Changed to optional - tournaments can exist without an org
    index: true,
  },
  
  // Resource-level admins (similar to Auction.admins[])
  // This allows tournament administration independent of organization roles
  admins: {
    type: [adminSchema],
    default: [],
    validate: {
      validator: function(v) {
        // At least one admin required after creation
        return this.isNew || v.length > 0;
      },
      message: 'Tournament must have at least one admin',
    },
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  description: {
    type: String,
    trim: true,
    default: ''
  },
  
  startDate: {
    type: Date,
    required: false
  },
  
  endDate: {
    type: Date,
    required: false
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed'],
    default: 'draft'
  },
  
  branding: {
    type: brandingSchema,
    default: () => ({})
  },
  
  settings: {
    type: settingsSchema,
    default: () => ({})
  },
  
  stats: {
    type: statsSchema,
    default: () => ({})
  },
  
  // Public link token for sharing
  publicToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Original creator (for audit purposes, never changes)
  originalCreator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  deletedAt: {
    type: Date,
    default: null
  },
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Generate a short, URL-safe token for public links
tournamentSchema.statics.generateToken = function() {
  return crypto.randomBytes(8).toString('base64url');
};

// Generate slug from name
tournamentSchema.statics.generateSlug = function(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
};

// Check if tournament is publicly accessible
tournamentSchema.methods.isPubliclyAccessible = function() {
  return this.isActive && 
         !this.isDeleted && 
         this.status !== 'draft' &&
         this.publicToken;
};

// Update stats
tournamentSchema.methods.updateStats = async function(entryCount, teamCount) {
  this.stats.entryCount = entryCount;
  this.stats.teamCount = teamCount;
  await this.save();
};

// Check if a user is an admin of this tournament
tournamentSchema.methods.isAdmin = function(userId) {
  if (!userId) return false;
  const userIdStr = userId.toString();
  return this.admins.some(a => a.userId?.toString() === userIdStr);
};

// Check if a user is an owner of this tournament
tournamentSchema.methods.isOwner = function(userId) {
  if (!userId) return false;
  const userIdStr = userId.toString();
  return this.admins.some(a => a.userId?.toString() === userIdStr && a.role === 'owner');
};

// Get user's role in this tournament
tournamentSchema.methods.getUserRole = function(userId) {
  if (!userId) return null;
  const userIdStr = userId.toString();
  const admin = this.admins.find(a => a.userId?.toString() === userIdStr);
  return admin?.role || null;
};

// Add an admin to the tournament
tournamentSchema.methods.addAdmin = function(userId, role = 'admin', addedBy = null) {
  if (this.isAdmin(userId)) return false; // Already an admin
  this.admins.push({ userId, role, addedAt: new Date(), addedBy });
  return true;
};

// Remove an admin from the tournament
tournamentSchema.methods.removeAdmin = function(userId) {
  const initialLength = this.admins.length;
  this.admins = this.admins.filter(a => a.userId?.toString() !== userId.toString());
  return this.admins.length < initialLength;
};

// Indexes for multi-tenant queries
tournamentSchema.index({ organizationId: 1, isDeleted: 1, status: 1 });
tournamentSchema.index({ organizationId: 1, slug: 1 }, { unique: true, sparse: true }); // sparse for null organizationId
tournamentSchema.index({ organizationId: 1, createdAt: -1 });
tournamentSchema.index({ publicToken: 1 }, { sparse: true });
// Index for admin queries (find tournaments user is admin of)
tournamentSchema.index({ 'admins.userId': 1, isDeleted: 1 });

module.exports = mongoose.model('Tournament', tournamentSchema);
