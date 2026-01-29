const mongoose = require('mongoose');

/**
 * Ground Schema
 * Represents a cricket ground with location, amenities, and aggregated ratings
 */
const groundSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Location Details
  location: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    }
  },

  // Photos (URLs - disabled upload for now, sample photos only)
  photos: [{
    type: String,
    trim: true
  }],

  // Amenities Checklist
  amenities: {
    hasFloodlights: { type: Boolean, default: false },
    hasNets: { type: Boolean, default: false },
    hasParking: { type: Boolean, default: false },
    hasChangingRoom: { type: Boolean, default: false },
    hasToilets: { type: Boolean, default: false },
    hasDrinkingWater: { type: Boolean, default: false },
    hasScoreboard: { type: Boolean, default: false },
    hasPavilion: { type: Boolean, default: false }
  },

  // Ground Characteristics (for discovery/filtering)
  characteristics: {
    pitchType: {
      type: String,
      enum: ['turf', 'matting', 'cement', 'astroturf', 'mixed', 'unknown'],
      default: 'unknown'
    },
    groundSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'unknown'],
      default: 'unknown'
    },
    boundaryType: {
      type: String,
      enum: ['rope', 'fence', 'natural', 'mixed', 'unknown'],
      default: 'unknown'
    }
  },

  // Aggregated Ratings (computed from reviews)
  aggregatedRatings: {
    pitch: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    outfield: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    lighting: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    routeAccess: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    locationAccessibility: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    nets: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    parking: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    amenities: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    management: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } }
  },

  // Computed overall score (weighted average)
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  // Review statistics
  reviewCount: {
    type: Number,
    default: 0
  },
  verifiedReviewCount: {
    type: Number,
    default: 0
  },

  // Trend data (last updated by aggregation job or on review submission)
  trends: {
    last30Days: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    last90Days: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    last365Days: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } }
  },

  // Popular tags (aggregated from reviews)
  popularTags: [{
    tag: String,
    count: Number
  }],

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: String

}, {
  timestamps: true
});

// Indexes for efficient queries
groundSchema.index({ 'location.city': 1, isActive: 1 });
groundSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index for nearby search
groundSchema.index({ overallScore: -1, reviewCount: -1 }); // For sorting by popularity
groundSchema.index({ name: 'text', 'location.address': 'text', 'location.city': 'text' }); // Text search
groundSchema.index({ isDeleted: 1, isActive: 1, createdAt: -1 }); // Active grounds listing

// Virtual for formatted location
groundSchema.virtual('formattedLocation').get(function() {
  const parts = [this.location.address];
  if (this.location.city) parts.push(this.location.city);
  if (this.location.state) parts.push(this.location.state);
  return parts.join(', ');
});

// Virtual for Google Maps URL
groundSchema.virtual('mapsUrl').get(function() {
  if (this.location.coordinates.lat && this.location.coordinates.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${this.location.coordinates.lat},${this.location.coordinates.lng}`;
  }
  return null;
});

// Ensure virtuals are included in JSON output
groundSchema.set('toJSON', { virtuals: true });
groundSchema.set('toObject', { virtuals: true });

const Ground = mongoose.model('Ground', groundSchema);

module.exports = Ground;
