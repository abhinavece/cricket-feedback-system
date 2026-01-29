/**
 * Ground Service
 * Centralized business logic for ground and review operations
 */

const Ground = require('../models/Ground');
const GroundReview = require('../models/GroundReview');
const mongoose = require('mongoose');

/**
 * Rating weights for overall score calculation
 * Pitch and Outfield have highest weights
 * Lighting is conditional (only if ground has floodlights)
 */
const RATING_WEIGHTS = {
  pitch: 0.25,           // Highest - most important for cricket
  outfield: 0.20,        // High - affects gameplay significantly
  lighting: 0.12,        // Medium-high (conditional)
  management: 0.12,      // Medium-high - affects overall experience
  routeAccess: 0.08,     // Medium - convenience factor
  locationAccessibility: 0.08,
  nets: 0.08,            // Medium (conditional)
  parking: 0.04,         // Lower - convenience
  amenities: 0.03        // Lower - nice to have
};

/**
 * Calculate weighted overall score from ratings
 * @param {Object} ratings - Rating values for each category
 * @param {boolean} hasFloodlights - Whether ground has floodlights
 * @param {boolean} hasNets - Whether ground has nets
 * @returns {number} Weighted average score (1-5)
 */
const calculateWeightedScore = (ratings, hasFloodlights = false, hasNets = false) => {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [category, weight] of Object.entries(RATING_WEIGHTS)) {
    const rating = ratings[category];

    // Skip lighting if ground doesn't have floodlights
    if (category === 'lighting' && !hasFloodlights) continue;

    // Skip nets if ground doesn't have nets
    if (category === 'nets' && !hasNets) continue;

    if (rating !== null && rating !== undefined && rating > 0) {
      weightedSum += rating * weight;
      totalWeight += weight;
    }
  }

  // Normalize to 1-5 scale
  return totalWeight > 0 ? parseFloat((weightedSum / totalWeight).toFixed(2)) : 0;
};

/**
 * Recalculate aggregated ratings for a ground
 * Called after a review is added/updated/deleted
 * @param {string} groundId - Ground ObjectId
 * @returns {Object} Updated aggregated ratings
 */
const recalculateGroundRatings = async (groundId) => {
  const ground = await Ground.findById(groundId);
  if (!ground) {
    throw new Error('Ground not found');
  }

  // Aggregate all non-deleted reviews
  const aggregation = await GroundReview.aggregate([
    {
      $match: {
        groundId: new mongoose.Types.ObjectId(groundId),
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        // Count reviews
        totalReviews: { $sum: 1 },
        verifiedReviews: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        },
        // Average each rating category (excluding nulls)
        avgPitch: { $avg: '$ratings.pitch' },
        countPitch: { $sum: { $cond: [{ $ne: ['$ratings.pitch', null] }, 1, 0] } },
        avgOutfield: { $avg: '$ratings.outfield' },
        countOutfield: { $sum: { $cond: [{ $ne: ['$ratings.outfield', null] }, 1, 0] } },
        avgLighting: { $avg: { $cond: [{ $ne: ['$ratings.lighting', null] }, '$ratings.lighting', null] } },
        countLighting: { $sum: { $cond: [{ $ne: ['$ratings.lighting', null] }, 1, 0] } },
        avgRouteAccess: { $avg: '$ratings.routeAccess' },
        countRouteAccess: { $sum: { $cond: [{ $ne: ['$ratings.routeAccess', null] }, 1, 0] } },
        avgLocationAccessibility: { $avg: '$ratings.locationAccessibility' },
        countLocationAccessibility: { $sum: { $cond: [{ $ne: ['$ratings.locationAccessibility', null] }, 1, 0] } },
        avgNets: { $avg: { $cond: [{ $ne: ['$ratings.nets', null] }, '$ratings.nets', null] } },
        countNets: { $sum: { $cond: [{ $ne: ['$ratings.nets', null] }, 1, 0] } },
        avgParking: { $avg: '$ratings.parking' },
        countParking: { $sum: { $cond: [{ $ne: ['$ratings.parking', null] }, 1, 0] } },
        avgAmenities: { $avg: '$ratings.amenities' },
        countAmenities: { $sum: { $cond: [{ $ne: ['$ratings.amenities', null] }, 1, 0] } },
        avgManagement: { $avg: '$ratings.management' },
        countManagement: { $sum: { $cond: [{ $ne: ['$ratings.management', null] }, 1, 0] } },
        // Collect all tags
        allTags: { $push: '$tags' }
      }
    }
  ]);

  if (aggregation.length === 0) {
    // No reviews, reset to defaults
    ground.aggregatedRatings = {
      pitch: { avg: 0, count: 0 },
      outfield: { avg: 0, count: 0 },
      lighting: { avg: 0, count: 0 },
      routeAccess: { avg: 0, count: 0 },
      locationAccessibility: { avg: 0, count: 0 },
      nets: { avg: 0, count: 0 },
      parking: { avg: 0, count: 0 },
      amenities: { avg: 0, count: 0 },
      management: { avg: 0, count: 0 }
    };
    ground.overallScore = 0;
    ground.reviewCount = 0;
    ground.verifiedReviewCount = 0;
    ground.popularTags = [];
    await ground.save();
    return ground;
  }

  const stats = aggregation[0];

  // Update aggregated ratings
  ground.aggregatedRatings = {
    pitch: { avg: parseFloat((stats.avgPitch || 0).toFixed(2)), count: stats.countPitch },
    outfield: { avg: parseFloat((stats.avgOutfield || 0).toFixed(2)), count: stats.countOutfield },
    lighting: { avg: parseFloat((stats.avgLighting || 0).toFixed(2)), count: stats.countLighting },
    routeAccess: { avg: parseFloat((stats.avgRouteAccess || 0).toFixed(2)), count: stats.countRouteAccess },
    locationAccessibility: { avg: parseFloat((stats.avgLocationAccessibility || 0).toFixed(2)), count: stats.countLocationAccessibility },
    nets: { avg: parseFloat((stats.avgNets || 0).toFixed(2)), count: stats.countNets },
    parking: { avg: parseFloat((stats.avgParking || 0).toFixed(2)), count: stats.countParking },
    amenities: { avg: parseFloat((stats.avgAmenities || 0).toFixed(2)), count: stats.countAmenities },
    management: { avg: parseFloat((stats.avgManagement || 0).toFixed(2)), count: stats.countManagement }
  };

  // Calculate weighted overall score
  const avgRatings = {
    pitch: stats.avgPitch,
    outfield: stats.avgOutfield,
    lighting: stats.avgLighting,
    routeAccess: stats.avgRouteAccess,
    locationAccessibility: stats.avgLocationAccessibility,
    nets: stats.avgNets,
    parking: stats.avgParking,
    amenities: stats.avgAmenities,
    management: stats.avgManagement
  };
  ground.overallScore = calculateWeightedScore(
    avgRatings,
    ground.amenities.hasFloodlights,
    ground.amenities.hasNets
  );

  // Update review counts
  ground.reviewCount = stats.totalReviews;
  ground.verifiedReviewCount = stats.verifiedReviews;

  // Calculate popular tags
  const flatTags = stats.allTags.flat();
  const tagCounts = {};
  flatTags.forEach(tag => {
    if (tag) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  });
  ground.popularTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 tags

  await ground.save();
  return ground;
};

/**
 * Calculate trend data for a ground
 * @param {string} groundId - Ground ObjectId
 * @returns {Object} Trend data for 30/90/365 days
 */
const calculateTrends = async (groundId) => {
  const now = new Date();
  const periods = [
    { key: 'last30Days', days: 30 },
    { key: 'last90Days', days: 90 },
    { key: 'last365Days', days: 365 }
  ];

  const trends = {};

  for (const period of periods) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - period.days);

    const result = await GroundReview.aggregate([
      {
        $match: {
          groundId: new mongoose.Types.ObjectId(groundId),
          isDeleted: false,
          visitDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgPitch: { $avg: '$ratings.pitch' },
          avgOutfield: { $avg: '$ratings.outfield' }
        }
      }
    ]);

    if (result.length > 0) {
      // Simple average of pitch and outfield for trend (main indicators)
      const avg = (result[0].avgPitch + result[0].avgOutfield) / 2;
      trends[period.key] = {
        avg: parseFloat(avg.toFixed(2)),
        count: result[0].count
      };
    } else {
      trends[period.key] = { avg: 0, count: 0 };
    }
  }

  // Update ground with trends
  await Ground.findByIdAndUpdate(groundId, { trends });

  return trends;
};

/**
 * Get ground with reviews (paginated)
 * @param {string} groundId - Ground ObjectId
 * @param {Object} options - Pagination options
 * @returns {Object} Ground with reviews and pagination
 */
const getGroundWithReviews = async (groundId, options = {}) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = options;
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);

  const ground = await Ground.findById(groundId)
    .where('isDeleted').equals(false)
    .lean();

  if (!ground) {
    return null;
  }

  const query = { groundId, isDeleted: false };
  const sort = { [sortBy]: sortOrder };

  const [reviews, total] = await Promise.all([
    GroundReview.find(query)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    GroundReview.countDocuments(query)
  ]);

  return {
    ground,
    reviews,
    pagination: {
      current: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      hasMore: pageNum * limitNum < total
    }
  };
};

/**
 * Search grounds by name, city, or address
 * @param {string} searchTerm - Search query
 * @param {Object} options - Pagination and filter options
 * @returns {Object} Search results with pagination
 */
const searchGrounds = async (searchTerm, options = {}) => {
  const { page = 1, limit = 20, city, sortBy = 'overallScore' } = options;
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);

  const query = { isDeleted: false, isActive: true };

  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { 'location.address': { $regex: searchTerm, $options: 'i' } },
      { 'location.city': { $regex: searchTerm, $options: 'i' } }
    ];
  }

  if (city) {
    query['location.city'] = { $regex: city, $options: 'i' };
  }

  const sort = sortBy === 'overallScore'
    ? { overallScore: -1, reviewCount: -1 }
    : { createdAt: -1 };

  const [grounds, total] = await Promise.all([
    Ground.find(query)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Ground.countDocuments(query)
  ]);

  return {
    grounds,
    pagination: {
      current: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      hasMore: pageNum * limitNum < total
    }
  };
};

/**
 * Find nearby grounds using geospatial query
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} maxDistanceKm - Maximum distance in kilometers
 * @param {number} limit - Maximum results
 * @returns {Array} Nearby grounds with distance
 */
const findNearbyGrounds = async (lat, lng, maxDistanceKm = 50, limit = 20) => {
  const grounds = await Ground.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        maxDistance: maxDistanceKm * 1000, // Convert to meters
        spherical: true,
        query: { isDeleted: false, isActive: true }
      }
    },
    { $limit: limit },
    {
      $addFields: {
        distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 1] }
      }
    }
  ]);

  return grounds;
};

/**
 * Get user's reviews
 * @param {string} userId - User ObjectId
 * @param {Object} options - Pagination options
 * @returns {Object} User's reviews with pagination
 */
const getUserReviews = async (userId, options = {}) => {
  const { page = 1, limit = 10 } = options;
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);

  const query = { reviewerId: userId, isDeleted: false };

  const [reviews, total] = await Promise.all([
    GroundReview.find(query)
      .populate('groundId', 'name location.city location.address')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    GroundReview.countDocuments(query)
  ]);

  return {
    reviews,
    pagination: {
      current: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      hasMore: pageNum * limitNum < total
    }
  };
};

/**
 * Format ground for public display (sanitize sensitive data)
 * @param {Object} ground - Ground document
 * @returns {Object} Sanitized ground data
 */
const formatGroundForDisplay = (ground) => {
  return {
    id: ground._id,
    name: ground.name,
    location: ground.location,
    formattedLocation: ground.formattedLocation,
    mapsUrl: ground.mapsUrl,
    photos: ground.photos,
    amenities: ground.amenities,
    characteristics: ground.characteristics,
    aggregatedRatings: ground.aggregatedRatings,
    overallScore: ground.overallScore,
    reviewCount: ground.reviewCount,
    verifiedReviewCount: ground.verifiedReviewCount,
    trends: ground.trends,
    popularTags: ground.popularTags
  };
};

/**
 * Format review for display
 * @param {Object} review - Review document
 * @returns {Object} Formatted review
 */
const formatReviewForDisplay = (review) => {
  return {
    id: review._id,
    groundId: review.groundId,
    reviewerName: review.reviewerName,
    isVerified: review.isVerified,
    ratings: review.ratings,
    tags: review.tags,
    comment: review.comment,
    visitDate: review.visitDate,
    visitType: review.visitType,
    timeSlot: review.timeSlot,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt
  };
};

module.exports = {
  RATING_WEIGHTS,
  calculateWeightedScore,
  recalculateGroundRatings,
  calculateTrends,
  getGroundWithReviews,
  searchGrounds,
  findNearbyGrounds,
  getUserReviews,
  formatGroundForDisplay,
  formatReviewForDisplay
};
