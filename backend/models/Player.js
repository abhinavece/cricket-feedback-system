/**
 * @fileoverview Player Model
 * 
 * Represents cricket players within an organization.
 * Players are scoped to organizations - same phone number can exist in different orgs.
 * 
 * @module models/Player
 */

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  // Multi-tenant: Organization this player belongs to
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
  phone: {
    type: String,
    required: true,
    trim: true,
    // Note: unique constraint removed - now unique per organization (see compound index)
  },
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper', 'player'],
    default: 'player',
  },
  team: {
    type: String,
    required: false,
    trim: true,
    default: 'Unknown Team'
  },
  notes: {
    type: String,
    required: false,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Link to User account (if player has registered)
  // Note: unique constraint removed for multi-tenant - same user can be player in multiple orgs
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  cricHeroesId: {
    type: String,
    trim: true
  },
  about: {
    type: String,
    maxLength: 500,
    trim: true
  },
  battingStyle: {
    type: String,
    enum: ['right-handed', 'left-handed', null],
    default: null
  },
  bowlingStyle: {
    type: String,
    enum: ['right-arm-fast', 'right-arm-medium', 'right-arm-spin', 'left-arm-fast', 'left-arm-medium', 'left-arm-spin', 'none', null],
    default: null
  },
  dateOfBirth: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for multi-tenant queries
// Phone number is unique within an organization (same player can exist in multiple orgs)
playerSchema.index({ organizationId: 1, phone: 1 }, { unique: true });
// For finding players by organization
playerSchema.index({ organizationId: 1, isActive: 1, name: 1 });
// For linking user to player within organization
playerSchema.index({ organizationId: 1, userId: 1 }, { sparse: true });

module.exports = mongoose.model('Player', playerSchema);
