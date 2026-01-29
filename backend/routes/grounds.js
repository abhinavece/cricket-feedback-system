const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Ground = require('../models/Ground.js');
const GroundReview = require('../models/GroundReview.js');
const { auth, requireAdmin, requireEditor } = require('../middleware/auth.js');
const groundService = require('../services/groundService');

// ============================================================================
// GROUND ROUTES
// ============================================================================

/**
 * GET /api/grounds
 * Get all active grounds with pagination and search
 * @access Public (auth required)
 */
router.get('/', auth, async (req, res) => {
  console.log('GET /api/grounds - Fetching grounds');
  try {
    const { search, city, page = 1, limit = 20, sortBy = 'overallScore' } = req.query;

    const result = await groundService.searchGrounds(search, {
      page,
      limit,
      city,
      sortBy
    });

    res.json({
      success: true,
      data: result.grounds,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching grounds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch grounds'
    });
  }
});

/**
 * GET /api/grounds/nearby
 * Find grounds near a location
 * @access Public (auth required)
 */
router.get('/nearby', auth, async (req, res) => {
  console.log('GET /api/grounds/nearby - Finding nearby grounds');
  try {
    const { lat, lng, maxDistance = 50, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const grounds = await groundService.findNearbyGrounds(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(maxDistance),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: grounds
    });
  } catch (error) {
    console.error('Error finding nearby grounds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find nearby grounds'
    });
  }
});

/**
 * GET /api/grounds/cities
 * Get list of unique cities with ground counts
 * @access Public (auth required)
 */
router.get('/cities', auth, async (req, res) => {
  console.log('GET /api/grounds/cities - Fetching cities');
  try {
    const cities = await Ground.aggregate([
      { $match: { isDeleted: false, isActive: true } },
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          city: '$_id',
          count: 1,
          avgScore: { $round: ['$avgScore', 1] },
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities'
    });
  }
});

/**
 * GET /api/grounds/tags
 * Get predefined review tags
 * @access Public (auth required)
 */
router.get('/tags', auth, async (req, res) => {
  res.json({
    success: true,
    data: GroundReview.REVIEW_TAGS
  });
});

/**
 * GET /api/grounds/:id
 * Get a specific ground with reviews
 * @access Public (auth required)
 */
router.get('/:id', auth, async (req, res) => {
  console.log(`GET /api/grounds/${req.params.id} - Fetching ground details`);
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ground ID'
      });
    }

    const result = await groundService.getGroundWithReviews(id, { page, limit });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Ground not found'
      });
    }

    res.json({
      success: true,
      data: result.ground,
      reviews: result.reviews,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching ground:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ground'
    });
  }
});

/**
 * POST /api/grounds
 * Create a new ground
 * @access Admin only
 */
router.post('/', auth, requireAdmin, async (req, res) => {
  console.log('POST /api/grounds - Creating new ground');
  try {
    const {
      name,
      location,
      photos,
      amenities,
      characteristics
    } = req.body;

    // Validate required fields
    if (!name || !location?.address || !location?.city ||
        location?.coordinates?.lat === undefined ||
        location?.coordinates?.lng === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, address, city, and coordinates are required'
      });
    }

    const ground = new Ground({
      name,
      location,
      photos: photos || [],
      amenities: amenities || {},
      characteristics: characteristics || {},
      createdBy: req.user._id
    });

    await ground.save();

    res.status(201).json({
      success: true,
      data: ground,
      message: 'Ground created successfully'
    });
  } catch (error) {
    console.error('Error creating ground:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ground'
    });
  }
});

/**
 * PUT /api/grounds/:id
 * Update a ground
 * @access Admin only
 */
router.put('/:id', auth, requireAdmin, async (req, res) => {
  console.log(`PUT /api/grounds/${req.params.id} - Updating ground`);
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ground ID'
      });
    }

    const {
      name,
      location,
      photos,
      amenities,
      characteristics,
      isActive
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (photos !== undefined) updateData.photos = photos;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (characteristics !== undefined) updateData.characteristics = characteristics;
    if (isActive !== undefined) updateData.isActive = isActive;

    const ground = await Ground.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!ground) {
      return res.status(404).json({
        success: false,
        error: 'Ground not found'
      });
    }

    res.json({
      success: true,
      data: ground,
      message: 'Ground updated successfully'
    });
  } catch (error) {
    console.error('Error updating ground:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ground'
    });
  }
});

/**
 * DELETE /api/grounds/:id
 * Soft delete a ground
 * @access Admin only
 */
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  console.log(`DELETE /api/grounds/${req.params.id} - Deleting ground`);
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ground ID'
      });
    }

    const ground = await Ground.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.email
      },
      { new: true }
    );

    if (!ground) {
      return res.status(404).json({
        success: false,
        error: 'Ground not found'
      });
    }

    res.json({
      success: true,
      message: 'Ground deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ground:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ground'
    });
  }
});

// ============================================================================
// REVIEW ROUTES
// ============================================================================

/**
 * POST /api/grounds/:id/reviews
 * Add a review for a ground
 * @access Any authenticated user
 */
router.post('/:id/reviews', auth, async (req, res) => {
  console.log(`POST /api/grounds/${req.params.id}/reviews - Adding review`);
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ground ID'
      });
    }

    // Check ground exists
    const ground = await Ground.findById(id).where('isDeleted').equals(false);
    if (!ground) {
      return res.status(404).json({
        success: false,
        error: 'Ground not found'
      });
    }

    const {
      ratings,
      tags,
      comment,
      visitDate,
      visitType,
      timeSlot,
      matchId
    } = req.body;

    // Validate required ratings
    if (!ratings?.pitch || !ratings?.outfield || !ratings?.routeAccess ||
        !ratings?.locationAccessibility || !ratings?.parking ||
        !ratings?.amenities || !ratings?.management) {
      return res.status(400).json({
        success: false,
        error: 'All required ratings must be provided'
      });
    }

    // Check if lighting rating is provided but ground has no floodlights
    if (ratings.lighting && !ground.amenities.hasFloodlights) {
      return res.status(400).json({
        success: false,
        error: 'Cannot rate lighting for a ground without floodlights'
      });
    }

    // Check if nets rating is provided but ground has no nets
    if (ratings.nets && !ground.amenities.hasNets) {
      return res.status(400).json({
        success: false,
        error: 'Cannot rate nets for a ground without practice nets'
      });
    }

    // Determine if review is verified (linked to a match played at this ground)
    let isVerified = false;
    if (matchId && mongoose.Types.ObjectId.isValid(matchId)) {
      // TODO: In future, check if user played in this match at this ground
      // For now, just mark as verified if matchId is provided
      isVerified = true;
    }

    const review = new GroundReview({
      groundId: id,
      reviewerId: req.user._id,
      reviewerName: req.user.name || req.user.email.split('@')[0],
      matchId: matchId || null,
      isVerified,
      ratings: {
        pitch: ratings.pitch,
        outfield: ratings.outfield,
        lighting: ratings.lighting || null,
        routeAccess: ratings.routeAccess,
        locationAccessibility: ratings.locationAccessibility,
        nets: ratings.nets || null,
        parking: ratings.parking,
        amenities: ratings.amenities,
        management: ratings.management
      },
      tags: tags || [],
      comment: comment || '',
      visitDate: visitDate || new Date(),
      visitType: visitType || 'match',
      timeSlot: timeSlot || 'morning'
    });

    await review.save();

    // Recalculate ground ratings
    await groundService.recalculateGroundRatings(id);

    // Update trends asynchronously (don't wait)
    groundService.calculateTrends(id).catch(err => {
      console.error('Error calculating trends:', err);
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit review'
    });
  }
});

/**
 * GET /api/grounds/:id/reviews
 * Get reviews for a ground (paginated)
 * @access Public (auth required)
 */
router.get('/:id/reviews', auth, async (req, res) => {
  console.log(`GET /api/grounds/${req.params.id}/reviews - Fetching reviews`);
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, verified } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ground ID'
      });
    }

    const query = { groundId: id, isDeleted: false };
    if (verified === 'true') {
      query.isVerified = true;
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);

    const [reviews, total] = await Promise.all([
      GroundReview.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      GroundReview.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore: pageNum * limitNum < total
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

/**
 * DELETE /api/grounds/:groundId/reviews/:reviewId
 * Delete a review (soft delete)
 * @access Owner or Admin
 */
router.delete('/:groundId/reviews/:reviewId', auth, async (req, res) => {
  console.log(`DELETE /api/grounds/${req.params.groundId}/reviews/${req.params.reviewId}`);
  try {
    const { groundId, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groundId) ||
        !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }

    const review = await GroundReview.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check ownership or admin
    const isOwner = review.reviewerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this review'
      });
    }

    review.isDeleted = true;
    review.deletedAt = new Date();
    review.deletedBy = req.user.email;
    await review.save();

    // Recalculate ground ratings
    await groundService.recalculateGroundRatings(groundId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete review'
    });
  }
});

/**
 * GET /api/grounds/user/reviews
 * Get current user's reviews
 * @access Any authenticated user
 */
router.get('/user/reviews', auth, async (req, res) => {
  console.log(`GET /api/grounds/user/reviews - Fetching user's reviews`);
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await groundService.getUserReviews(req.user._id, {
      page,
      limit
    });

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

module.exports = router;
