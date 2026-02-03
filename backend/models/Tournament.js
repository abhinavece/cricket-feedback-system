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

const tournamentSchema = new mongoose.Schema({
  // Multi-tenant: Organization that hosts this tournament
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
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

// Indexes for multi-tenant queries
tournamentSchema.index({ organizationId: 1, isDeleted: 1, status: 1 });
tournamentSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
tournamentSchema.index({ organizationId: 1, createdAt: -1 });
tournamentSchema.index({ publicToken: 1 }, { sparse: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
