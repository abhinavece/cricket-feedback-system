/**
 * @fileoverview Franchise (Team) Model for Tournament
 * 
 * Represents a franchise/team within a tournament for player allocation
 * and auction management.
 * 
 * @module models/Franchise
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const franchiseSchema = new Schema({
  // Organization context (multi-tenancy)
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  // Tournament this franchise belongs to
  tournamentId: {
    type: Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true
  },

  // Franchise details
  name: {
    type: String,
    required: true,
    trim: true
  },

  shortName: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 5
  },

  // Branding
  primaryColor: {
    type: String,
    default: '#14b8a6' // Teal
  },

  secondaryColor: {
    type: String,
    default: '#0f172a' // Dark slate
  },

  logo: {
    type: String,
    default: ''
  },

  // Team management
  owner: {
    name: String,
    email: String,
    phone: String
  },

  captain: {
    type: Schema.Types.ObjectId,
    ref: 'TournamentEntry'
  },

  // Budget tracking (for auctions)
  budget: {
    type: Number,
    default: 100000
  },

  remainingBudget: {
    type: Number,
    default: 100000
  },

  // Player slots
  maxPlayers: {
    type: Number,
    default: 15
  },

  minPlayers: {
    type: Number,
    default: 11
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  deletedAt: Date,
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  // Audit
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
franchiseSchema.index({ organizationId: 1, tournamentId: 1, isDeleted: 1 });
franchiseSchema.index({ tournamentId: 1, shortName: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// Virtual for player count (computed from TournamentEntry)
franchiseSchema.virtual('playerCount', {
  ref: 'TournamentEntry',
  localField: '_id',
  foreignField: 'franchiseId',
  count: true,
  match: { isDeleted: false }
});

// Pre-save: generate shortName if not provided
franchiseSchema.pre('save', function() {
  if (!this.shortName && this.name) {
    this.shortName = this.name.substring(0, 3).toUpperCase();
  }
  // No need to call next() in async-style middleware
});

module.exports = mongoose.model('Franchise', franchiseSchema);
