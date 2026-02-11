/**
 * @fileoverview Auction Model
 * 
 * Core model for the CricSmart Auction system.
 * Represents a cricket player auction with configuration, state machine,
 * real-time bidding state, and resource-level admin roles.
 * 
 * V1: Fully standalone (organizationId optional).
 * 
 * @module models/Auction
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

// --- Sub-schemas ---

const bidIncrementTierSchema = new mongoose.Schema({
  upTo: {
    type: Number,
    default: null, // null = applies to everything above previous tier
  },
  increment: {
    type: Number,
    required: true,
  },
}, { _id: false });

const auctionConfigSchema = new mongoose.Schema({
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  purseValue: {
    type: Number,
    required: true,
    min: 0,
  },
  bidIncrementTiers: {
    type: [bidIncrementTierSchema],
    default: [
      { upTo: 100000, increment: 10000 },
      { upTo: 500000, increment: 25000 },
      { upTo: null, increment: 50000 },
    ],
  },
  bidIncrementPreset: {
    type: String,
    enum: ['standard', 'premium', 'budget', 'custom'],
    default: 'standard',
  },
  timerDuration: {
    type: Number,
    default: 30, // seconds for initial bidding window
    min: 10,
    max: 120,
  },
  bidResetTimer: {
    type: Number,
    default: 15, // seconds after each bid
    min: 5,
    max: 60,
  },
  goingOnceTimer: {
    type: Number,
    default: 5,
    min: 3,
    max: 15,
  },
  goingTwiceTimer: {
    type: Number,
    default: 5,
    min: 3,
    max: 15,
  },
  minSquadSize: {
    type: Number,
    required: true,
    min: 1,
  },
  maxSquadSize: {
    type: Number,
    required: true,
    min: 1,
  },
  maxRounds: {
    type: Number,
    default: 3,
    min: 1,
    max: 10,
  },
  playerRevealDelay: {
    type: Number,
    default: 3, // seconds to show player before bidding opens
    min: 1,
    max: 10,
  },
  retentionEnabled: {
    type: Boolean,
    default: false,
  },
  maxRetentions: {
    type: Number,
    default: 3,
    min: 0,
  },
  retentionCost: {
    type: Number,
    default: 0, // 0 initially, configurable later
  },
  maxTradesPerTeam: {
    type: Number,
    default: 2,
    min: 0,
  },
  tradeWindowHours: {
    type: Number,
    default: 48,
    min: 1,
  },
  maxUndoActions: {
    type: Number,
    default: 3,
    min: 0,
    max: 10,
  },
}, { _id: false });

const currentBiddingStateSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionPlayer',
    default: null,
  },
  status: {
    type: String,
    enum: ['waiting', 'revealed', 'open', 'going_once', 'going_twice', 'sold', 'unsold'],
    default: 'waiting',
  },
  currentBid: {
    type: Number,
    default: 0,
  },
  currentBidTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionTeam',
    default: null,
  },
  bidHistory: [{
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionTeam' },
    amount: Number,
    timestamp: { type: Date, default: Date.now },
  }],
  timerExpiresAt: {
    type: Date,
    default: null,
  },
  timerStartedAt: {
    type: Date,
    default: null,
  },
}, { _id: false });

const displayConfigSchema = new mongoose.Schema({
  visibleColumns: {
    type: [String],
    default: ['name', 'role'],
  },
  sortableColumns: {
    type: [String],
    default: ['name', 'role'],
  },
  filterableColumns: {
    type: [String],
    default: ['role'],
  },
}, { _id: false });

const adminEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin'],
    default: 'admin',
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// --- Main Schema ---

const auctionSchema = new mongoose.Schema({
  // V1: standalone. Optional org/tournament linkage for future.
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true,
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    default: null,
  },

  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },

  status: {
    type: String,
    enum: ['draft', 'configured', 'live', 'paused', 'completed', 'trade_window', 'finalized'],
    default: 'draft',
    index: true,
  },

  config: {
    type: auctionConfigSchema,
    required: true,
  },

  currentRound: {
    type: Number,
    default: 1,
    min: 1,
  },
  remainingPlayerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionPlayer',
  }],
  currentBiddingState: {
    type: currentBiddingStateSchema,
    default: () => ({}),
  },

  // Resource-level admin roles (standalone auth)
  admins: {
    type: [adminEntrySchema],
    default: [],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Lifecycle timestamps
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  tradeWindowEndsAt: {
    type: Date,
    default: null,
  },
  finalizedAt: {
    type: Date,
    default: null,
  },

  // Post-auction analytics (populated at completion)
  analytics: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  displayConfig: {
    type: displayConfigSchema,
    default: () => ({}),
  },

  // Scheduling
  scheduledStartTime: {
    type: Date,
    default: null,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// --- Indexes ---

auctionSchema.index({ slug: 1 }, { unique: true });
auctionSchema.index({ createdBy: 1, isDeleted: 1, status: 1 });
auctionSchema.index({ 'admins.userId': 1, isDeleted: 1 });
auctionSchema.index({ status: 1, isActive: 1, isDeleted: 1 });
auctionSchema.index({ organizationId: 1, isDeleted: 1 }, { sparse: true });

// --- Statics ---

/**
 * Generate a URL-safe slug from auction name
 */
auctionSchema.statics.generateSlug = function(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
};

/**
 * Bid increment tier presets
 */
auctionSchema.statics.BID_INCREMENT_PRESETS = {
  budget: {
    label: 'Budget League',
    tiers: [
      { upTo: 50000, increment: 5000 },
      { upTo: 200000, increment: 10000 },
      { upTo: null, increment: 20000 },
    ],
  },
  standard: {
    label: 'Standard League',
    tiers: [
      { upTo: 100000, increment: 10000 },
      { upTo: 500000, increment: 25000 },
      { upTo: null, increment: 50000 },
    ],
  },
  premium: {
    label: 'Premium League',
    tiers: [
      { upTo: 500000, increment: 25000 },
      { upTo: 2000000, increment: 50000 },
      { upTo: null, increment: 100000 },
    ],
  },
};

// --- Instance Methods ---

/**
 * Check if a user is an admin of this auction
 */
auctionSchema.methods.isAdminUser = function(userId) {
  return this.admins.some(a => a.userId.equals(userId));
};

/**
 * Get admin role for a user
 */
auctionSchema.methods.getAdminRole = function(userId) {
  const entry = this.admins.find(a => a.userId.equals(userId));
  return entry ? entry.role : null;
};

/**
 * Check if auction is publicly viewable
 */
auctionSchema.methods.isPubliclyViewable = function() {
  return this.isActive && !this.isDeleted && this.status !== 'draft';
};

/**
 * Get the bid increment for a given current bid amount
 */
auctionSchema.methods.getBidIncrement = function(currentBid) {
  const tiers = this.config.bidIncrementTiers;
  if (!tiers || tiers.length === 0) return 10000; // fallback
  for (const tier of tiers) {
    if (tier.upTo === null || currentBid < tier.upTo) {
      return tier.increment;
    }
  }
  return tiers[tiers.length - 1].increment;
};

module.exports = mongoose.model('Auction', auctionSchema);
