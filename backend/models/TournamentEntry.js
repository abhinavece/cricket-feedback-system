/**
 * @fileoverview TournamentEntry Model
 * 
 * Represents player entries in a tournament.
 * Each entry contains tournament-specific player data.
 * 
 * @module models/TournamentEntry
 */

const mongoose = require('mongoose');

const entryDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  cricHeroesId: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: [
      'batsman',
      'bowler',
      'all-rounder',
      'wicket-keeper',
      'captain',
      'vice-captain',
      'coach',
      'manager',
      'player'
    ],
    default: 'player'
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  teamName: {
    type: String,
    trim: true,
    default: ''
  },
  jerseyNumber: {
    type: Number,
    default: null
  },
  // Additional custom fields for flexibility
  customFields: {
    type: Map,
    of: String,
    default: new Map()
  }
}, { _id: false });

const tournamentEntrySchema = new mongoose.Schema({
  // Multi-tenant isolation
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true
  },
  
  // Optional link to Player model (for data reuse)
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },

  // Franchise/Team assignment
  franchiseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Franchise',
    default: null,
    index: true
  },

  // Auction details (when assigned to franchise)
  soldPrice: {
    type: Number,
    default: null
  },

  basePrice: {
    type: Number,
    default: null
  },
  
  // Tournament-specific data
  entryData: {
    type: entryDataSchema,
    required: true
  },
  
  status: {
    type: String,
    enum: ['registered', 'confirmed', 'withdrawn'],
    default: 'registered'
  },
  
  registeredAt: {
    type: Date,
    default: Date.now
  },
  
  // For bulk import tracking
  importBatchId: {
    type: String,
    default: null
  },
  
  // Row number from import (for reference)
  importRowNumber: {
    type: Number,
    default: null
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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

// Virtual for display name (handles various formats)
tournamentEntrySchema.virtual('displayName').get(function() {
  return this.entryData?.name || 'Unknown Player';
});

// Virtual for masked phone (for public display)
tournamentEntrySchema.virtual('maskedPhone').get(function() {
  const phone = this.entryData?.phone;
  if (!phone || phone.length < 4) return '';
  // Show last 4 digits only: +91 98XXX XX789
  const lastFour = phone.slice(-4);
  const prefix = phone.slice(0, -4).replace(/\d/g, 'X');
  return prefix + lastFour;
});

// Instance method to get public-safe data
tournamentEntrySchema.methods.toPublicJSON = function(showPhone = false, showEmail = false) {
  const data = {
    _id: this._id,
    name: this.entryData.name,
    role: this.entryData.role,
    teamName: this.entryData.teamName,
    companyName: this.entryData.companyName,
    cricHeroesId: this.entryData.cricHeroesId,
    jerseyNumber: this.entryData.jerseyNumber,
    status: this.status
  };
  
  if (showPhone && this.entryData.phone) {
    data.phone = this.maskedPhone;
  }
  
  if (showEmail && this.entryData.email) {
    data.email = this.entryData.email;
  }
  
  // Calculate age if DOB is available
  if (this.entryData.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.entryData.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    data.age = age;
  }
  
  return data;
};

// Indexes for multi-tenant queries
tournamentEntrySchema.index({ organizationId: 1, tournamentId: 1, isDeleted: 1 });
tournamentEntrySchema.index({ tournamentId: 1, 'entryData.teamName': 1 });
tournamentEntrySchema.index({ tournamentId: 1, 'entryData.role': 1 });
tournamentEntrySchema.index({ tournamentId: 1, 'entryData.name': 'text' });
// For deduplication during import
tournamentEntrySchema.index(
  { tournamentId: 1, 'entryData.phone': 1 }, 
  { sparse: true }
);
tournamentEntrySchema.index(
  { tournamentId: 1, 'entryData.email': 1 }, 
  { sparse: true }
);

module.exports = mongoose.model('TournamentEntry', tournamentEntrySchema);
