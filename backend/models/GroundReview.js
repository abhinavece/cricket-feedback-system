const mongoose = require('mongoose');

/**
 * Ground Review Schema
 * Individual reviews submitted by users for cricket grounds
 */

// Predefined tags for quick selection
const REVIEW_TAGS = [
  // Pitch characteristics
  'hard_pitch', 'soft_pitch', 'bouncy', 'slow', 'good_for_pacers', 'good_for_spinners',
  'unpredictable_bounce', 'true_bounce', 'cracked_pitch', 'well_maintained_pitch',

  // Outfield characteristics
  'fast_outfield', 'slow_outfield', 'uneven_outfield', 'grassy', 'patchy',

  // Lighting
  'excellent_lights', 'dim_lights', 'uneven_lighting', 'no_shadows',

  // General
  'professional', 'beginner_friendly', 'value_for_money', 'overpriced',
  'good_for_practice', 'match_quality', 'family_friendly', 'weekend_crowded',

  // Issues
  'drainage_issues', 'muddy_when_wet', 'dusty', 'mosquitoes', 'noisy_surroundings'
];

const groundReviewSchema = new mongoose.Schema({
  // Reference to ground
  groundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ground',
    required: true,
    index: true
  },

  // Reviewer information
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reviewerName: {
    type: String,
    required: true,
    trim: true
  },

  // Optional link to a match (for verified reviews)
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    sparse: true
  },

  // Is this a verified review (reviewer played a match at this ground)?
  isVerified: {
    type: Boolean,
    default: false
  },

  // Structured Ratings (1-5 scale, null if not applicable)
  ratings: {
    pitch: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    outfield: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    lighting: {
      type: Number,
      min: 1,
      max: 5,
      default: null  // null if ground doesn't have floodlights
    },
    routeAccess: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    locationAccessibility: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    nets: {
      type: Number,
      min: 1,
      max: 5,
      default: null  // null if ground doesn't have nets
    },
    parking: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    amenities: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    management: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },

  // Tags for quick filtering (from predefined list)
  tags: [{
    type: String,
    enum: REVIEW_TAGS
  }],

  // Free-text comment
  comment: {
    type: String,
    maxlength: 1000,
    trim: true
  },

  // Photos (disabled for MVP, placeholder for future)
  photos: [{
    type: String,
    trim: true
  }],

  // When the reviewer visited
  visitDate: {
    type: Date,
    required: true
  },

  // Was this a match or practice session?
  visitType: {
    type: String,
    enum: ['match', 'practice', 'casual', 'other'],
    default: 'match'
  },

  // Time slot of visit (for lighting relevance)
  timeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
    default: 'morning'
  },

  // Helpful votes (future feature)
  helpfulCount: {
    type: Number,
    default: 0
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

// Compound indexes for efficient queries
groundReviewSchema.index({ groundId: 1, createdAt: -1 }); // Reviews for a ground
groundReviewSchema.index({ groundId: 1, isDeleted: 1 }); // Active reviews for a ground
groundReviewSchema.index({ reviewerId: 1, createdAt: -1 }); // User's reviews
groundReviewSchema.index({ groundId: 1, isVerified: 1 }); // Verified reviews
groundReviewSchema.index({ visitDate: -1 }); // Trend calculations
groundReviewSchema.index({ groundId: 1, visitDate: -1, isDeleted: 1 }); // Trend queries

// Virtual for weighted overall score (used in aggregation)
groundReviewSchema.virtual('weightedScore').get(function() {
  const weights = {
    pitch: 0.25,
    outfield: 0.20,
    lighting: 0.12,
    management: 0.12,
    routeAccess: 0.08,
    nets: 0.08,
    parking: 0.08,
    amenities: 0.07
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const rating = this.ratings[key];
    if (rating !== null && rating !== undefined) {
      weightedSum += rating * weight;
      totalWeight += weight;
    }
  }

  // Add locationAccessibility (not in weights, uses same as routeAccess)
  if (this.ratings.locationAccessibility) {
    weightedSum += this.ratings.locationAccessibility * 0.08;
    totalWeight += 0.08;
  }

  return totalWeight > 0 ? (weightedSum / totalWeight) * (1 / 0.08 * totalWeight / 9) : 0;
});

// Ensure virtuals are included
groundReviewSchema.set('toJSON', { virtuals: true });
groundReviewSchema.set('toObject', { virtuals: true });

const GroundReview = mongoose.model('GroundReview', groundReviewSchema);

// Export tags for frontend use
module.exports = GroundReview;
module.exports.REVIEW_TAGS = REVIEW_TAGS;
