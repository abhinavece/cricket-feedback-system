const express = require('express');
const router = express.Router();
const Ground = require('../models/Ground.js');
const Player = require('../models/Player.js');

// ============================================================================
// SEO PUBLIC ROUTES - NO AUTHENTICATION REQUIRED
// These endpoints serve the Next.js SEO site (cricsmart.in)
// ============================================================================

/**
 * GET /api/seo/grounds
 * Get public grounds list for SEO site
 * @access Public (no auth)
 */
router.get('/grounds', async (req, res) => {
  try {
    const { page = 1, limit = 20, city, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    
    // Build query
    const query = { isDeleted: false, isActive: true };
    
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { 'location.city': new RegExp(search, 'i') },
        { 'location.area': new RegExp(search, 'i') }
      ];
    }
    
    // Fetch grounds with SEO-relevant fields
    const grounds = await Ground.find(query)
      .select('name slug location coordinates amenities overallScore reviewCount images description createdAt updatedAt')
      .sort({ overallScore: -1, reviewCount: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();
    
    const total = await Ground.countDocuments(query);
    
    // Transform for SEO
    const seoGrounds = grounds.map(ground => ({
      _id: ground._id,
      name: ground.name,
      slug: ground.slug || ground.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      city: ground.location?.city || '',
      state: ground.location?.state || '',
      address: ground.location?.address || '',
      coordinates: ground.coordinates || null,
      amenities: ground.amenities || [],
      description: ground.description || `Cricket ground located in ${ground.location?.city || 'India'}`,
      averageRating: ground.overallScore || 0,
      reviewCount: ground.reviewCount || 0,
      images: ground.images || [],
      updatedAt: ground.updatedAt
    }));
    
    res.json({
      success: true,
      data: seoGrounds,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore: pageNum * limitNum < total
      }
    });
    
  } catch (error) {
    console.error('SEO grounds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch grounds'
    });
  }
});

/**
 * GET /api/seo/grounds/slug/:slug
 * Get ground by SEO-friendly slug
 * @access Public (no auth)
 */
router.get('/grounds/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Try to find by slug first, then by name-based slug
    let ground = await Ground.findOne({
      slug,
      isDeleted: false,
      isActive: true
    }).lean();
    
    // If not found by slug, try name-based match
    if (!ground) {
      const nameFromSlug = slug.replace(/-/g, ' ');
      ground = await Ground.findOne({
        name: new RegExp(`^${nameFromSlug}$`, 'i'),
        isDeleted: false,
        isActive: true
      }).lean();
    }
    
    if (!ground) {
      return res.status(404).json({
        success: false,
        error: 'Ground not found'
      });
    }
    
    // Return SEO-formatted ground
    res.json({
      success: true,
      data: {
        _id: ground._id,
        name: ground.name,
        slug: ground.slug || slug,
        city: ground.location?.city || '',
        state: ground.location?.state || '',
        address: ground.location?.address || '',
        coordinates: ground.coordinates || null,
        amenities: ground.amenities || [],
        description: ground.description || `Cricket ground located in ${ground.location?.city || 'India'}`,
        averageRating: ground.overallScore || 0,
        reviewCount: ground.reviewCount || 0,
        images: ground.images || [],
        isPublic: true,
        createdAt: ground.createdAt,
        updatedAt: ground.updatedAt
      }
    });
    
  } catch (error) {
    console.error('SEO ground by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ground'
    });
  }
});

/**
 * GET /api/seo/grounds/:id/reviews
 * Get ground reviews for SEO
 * @access Public (no auth)
 */
router.get('/grounds/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    
    const GroundReview = require('../models/GroundReview.js');
    
    const reviews = await GroundReview.find({
      groundId: id,
      isDeleted: false
    })
      .select('reviewerName overallExperience comment createdAt')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();
    
    const total = await GroundReview.countDocuments({
      groundId: id,
      isDeleted: false
    });
    
    const seoReviews = reviews.map(review => ({
      _id: review._id,
      reviewerName: review.reviewerName || 'Anonymous',
      rating: review.overallExperience || 0,
      comment: review.comment || '',
      createdAt: review.createdAt
    }));
    
    res.json({
      success: true,
      data: seoReviews,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore: pageNum * limitNum < total
      }
    });
    
  } catch (error) {
    console.error('SEO ground reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

/**
 * GET /api/seo/players
 * Get public player profiles for SEO
 * @access Public (no auth)
 */
router.get('/players', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    
    // Only get players who have opted in for public profiles
    const players = await Player.find({
      isDeleted: false,
      isPublicProfile: true
    })
      .select('name team role battingStyle bowlingStyle about')
      .sort({ name: 1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();
    
    const total = await Player.countDocuments({
      isDeleted: false,
      isPublicProfile: true
    });
    
    res.json({
      success: true,
      data: players,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore: pageNum * limitNum < total
      }
    });
    
  } catch (error) {
    console.error('SEO players error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players'
    });
  }
});

/**
 * GET /api/seo/players/:id
 * Get public player profile by ID
 * @access Public (no auth)
 */
router.get('/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const player = await Player.findOne({
      _id: id,
      isDeleted: false,
      isPublicProfile: true
    })
      .select('name team role battingStyle bowlingStyle about')
      .lean();
    
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found or profile is private'
      });
    }
    
    res.json({
      success: true,
      data: player
    });
    
  } catch (error) {
    console.error('SEO player error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player'
    });
  }
});

/**
 * GET /api/seo/sitemap/grounds
 * Get all ground slugs for sitemap generation
 * @access Public (no auth)
 */
router.get('/sitemap/grounds', async (req, res) => {
  try {
    const grounds = await Ground.find({
      isDeleted: false,
      isActive: true
    })
      .select('name slug updatedAt')
      .lean();
    
    const slugs = grounds.map(g => ({
      slug: g.slug || g.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      lastmod: g.updatedAt
    }));
    
    res.json({
      success: true,
      data: slugs
    });
    
  } catch (error) {
    console.error('SEO sitemap grounds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sitemap data'
    });
  }
});

/**
 * GET /api/seo/sitemap/players
 * Get all public player IDs for sitemap generation
 * @access Public (no auth)
 */
router.get('/sitemap/players', async (req, res) => {
  try {
    const players = await Player.find({
      isDeleted: false,
      isPublicProfile: true
    })
      .select('_id updatedAt')
      .lean();
    
    const data = players.map(p => ({
      id: p._id,
      lastmod: p.updatedAt
    }));
    
    res.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('SEO sitemap players error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sitemap data'
    });
  }
});

/**
 * GET /api/seo/stats
 * Get site statistics for SEO homepage
 * @access Public (no auth)
 */
router.get('/stats', async (req, res) => {
  try {
    const [groundCount, playerCount] = await Promise.all([
      Ground.countDocuments({ isDeleted: false, isActive: true }),
      Player.countDocuments({ isDeleted: false })
    ]);
    
    res.json({
      success: true,
      data: {
        groundCount,
        playerCount,
        // Add more stats as needed
        teamCount: 100, // Placeholder
        matchCount: 1000 // Placeholder
      }
    });
    
  } catch (error) {
    console.error('SEO stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

module.exports = router;
