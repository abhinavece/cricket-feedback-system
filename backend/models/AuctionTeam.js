/**
 * @fileoverview AuctionTeam Model
 * 
 * Represents a team participating in a cricket auction.
 * Tracks purse, squad, retained players, and team authentication.
 * 
 * @module models/AuctionTeam
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const retainedPlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper'],
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isCaptain: {
    type: Boolean,
    default: false,
  },
  retentionCost: {
    type: Number,
    default: 0,
  },
}, { _id: true });

const boughtPlayerSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionPlayer',
    required: true,
  },
  boughtAt: {
    type: Number,
    required: true,
  },
  round: {
    type: Number,
    required: true,
  },
  boughtTimestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const auctionTeamSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true,
    index: true,
  },

  name: {
    type: String,
    required: true,
    trim: true,
  },
  shortName: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 5,
  },
  logo: {
    type: String,
    default: '',
  },
  primaryColor: {
    type: String,
    default: '#14b8a6',
  },
  secondaryColor: {
    type: String,
    default: '#0f172a',
  },

  owner: {
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
  },

  // Auth: unique access code for team bidding login
  accessCode: {
    type: String,
    select: false, // never return in queries by default
  },
  accessToken: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Financials
  purseValue: {
    type: Number,
    required: true,
    min: 0,
  },
  purseRemaining: {
    type: Number,
    required: true,
    min: 0,
  },

  // Squad — bought players
  players: {
    type: [boughtPlayerSchema],
    default: [],
  },

  // Retained players (added separately, not from pool)
  retainedPlayers: {
    type: [retainedPlayerSchema],
    default: [],
  },

  // Trading
  tradesUsed: {
    type: Number,
    default: 0,
    min: 0,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// --- Virtuals ---

/**
 * Total squad size (bought + retained)
 */
auctionTeamSchema.virtual('squadSize').get(function() {
  return (this.players ? this.players.length : 0) +
         (this.retainedPlayers ? this.retainedPlayers.length : 0);
});

// --- Indexes ---

auctionTeamSchema.index({ auctionId: 1, isActive: 1 });
auctionTeamSchema.index({ auctionId: 1, shortName: 1 }, { unique: true });
// accessToken index already created by unique+sparse on field definition

// --- Statics ---

/**
 * Generate a 6-character alphanumeric access code
 */
auctionTeamSchema.statics.generateAccessCode = function() {
  return crypto.randomBytes(4).toString('base64url').substring(0, 6).toUpperCase();
};

/**
 * Generate a unique access token for magic link
 */
auctionTeamSchema.statics.generateAccessToken = function() {
  return crypto.randomBytes(24).toString('base64url');
};

// --- Instance Methods ---

/**
 * Calculate max bid for this team given auction config
 * @param {Object} auctionConfig - auction.config object
 * @returns {number} Maximum bid amount this team can place
 */
auctionTeamSchema.methods.calculateMaxBid = function(auctionConfig) {
  const { basePrice, minSquadSize } = auctionConfig;
  const squadSize = this.squadSize;

  // If min squad already met, full purse available
  if (squadSize >= minSquadSize) {
    return this.purseRemaining;
  }

  // Reserve basePrice for each remaining slot (excluding current player being bid on)
  const slotsToFill = minSquadSize - squadSize - 1;
  const reserved = slotsToFill * basePrice;
  const maxBid = this.purseRemaining - reserved;

  // Clamp: at least basePrice (if affordable), otherwise 0
  if (maxBid < basePrice) {
    return this.purseRemaining >= basePrice ? basePrice : 0;
  }

  return maxBid;
};

/**
 * Check if team can afford to bid at all
 * @param {number} basePrice - auction base price
 * @returns {boolean}
 */
auctionTeamSchema.methods.canAffordBasePrice = function(basePrice) {
  return this.purseRemaining >= basePrice;
};

module.exports = mongoose.model('AuctionTeam', auctionTeamSchema);
