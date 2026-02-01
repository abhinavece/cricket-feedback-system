/**
 * @fileoverview Match Model
 * 
 * Represents cricket matches within an organization.
 * Tracks squad, availability, and match status.
 * 
 * @module models/Match
 */

const mongoose = require('mongoose');

const squadResponseSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  response: {
    type: String,
    enum: ['yes', 'no', 'tentative', 'pending'],
    default: 'pending'
  },
  respondedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  // Multi-tenant: Organization this match belongs to
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  
  matchId: {
    type: String,
    required: false,
    // Note: unique constraint should be per-organization
    // Will be handled by compound index
    trim: true
  },
  cricHeroesMatchId: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    trim: true,
    default: ''
  },
  slot: {
    type: String,
    enum: ['morning', 'evening', 'night', 'custom'],
    required: true
  },
  opponent: {
    type: String,
    trim: true,
    default: ''
  },
  ground: {
    type: String,
    required: true,
    trim: true
  },
  locationLink: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'cancelled', 'completed'],
    default: 'draft'
  },
  matchType: {
    type: String,
    enum: ['practice', 'tournament', 'friendly'],
    default: 'practice'
  },
  squad: [squadResponseSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // NEW: Availability tracking fields
  availabilitySent: {
    type: Boolean,
    default: false
  },
  availabilitySentAt: {
    type: Date
  },
  totalPlayersRequested: {
    type: Number,
    default: 0
  },
  confirmedPlayers: {
    type: Number,
    default: 0
  },
  declinedPlayers: {
    type: Number,
    default: 0
  },
  tentativePlayers: {
    type: Number,
    default: 0
  },
  noResponsePlayers: {
    type: Number,
    default: 0
  },
  lastAvailabilityUpdate: {
    type: Date
  },
  squadStatus: {
    type: String,
    enum: ['pending', 'partial', 'full'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for multi-tenant queries
matchSchema.index({ organizationId: 1, date: -1 });
matchSchema.index({ organizationId: 1, status: 1 });
matchSchema.index({ organizationId: 1, 'squad.player': 1 });
// matchId is unique within an organization
matchSchema.index({ organizationId: 1, matchId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Match', matchSchema);
