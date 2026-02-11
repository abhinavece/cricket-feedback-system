/**
 * @fileoverview BidAuditLog Model
 * 
 * Tracks all bid attempts (accepted, rejected, voided) for transparency.
 * Rejection reasons are public — all spectators can see why a bid was rejected.
 * 
 * @module models/BidAuditLog
 */

const mongoose = require('mongoose');

const bidAuditLogSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true,
    index: true,
  },

  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionTeam',
    required: true,
  },

  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionPlayer',
    required: true,
  },

  type: {
    type: String,
    enum: ['bid_accepted', 'bid_rejected', 'bid_voided'],
    required: true,
    index: true,
  },

  attemptedAmount: {
    type: Number,
    required: true,
  },

  reason: {
    type: String,
    default: '',
  },

  purseAtTime: {
    type: Number,
    default: 0,
  },

  maxBidAtTime: {
    type: Number,
    default: 0,
  },

  // Public — everyone sees rejection reasons
  isPublic: {
    type: Boolean,
    default: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false, // use explicit timestamp field
});

// --- Indexes ---

bidAuditLogSchema.index({ auctionId: 1, teamId: 1, timestamp: -1 });
bidAuditLogSchema.index({ auctionId: 1, playerId: 1, timestamp: -1 });
bidAuditLogSchema.index({ auctionId: 1, type: 1, timestamp: -1 });

module.exports = mongoose.model('BidAuditLog', bidAuditLogSchema);
