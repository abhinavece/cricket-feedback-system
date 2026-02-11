/**
 * @fileoverview Auction Authentication & Authorization Middleware
 * 
 * Resource-level auth for the auction system.
 * - resolveAuctionAdmin: Checks auction.admins[] for user JWT
 * - resolveAuctionTeam: Validates team access token JWT
 * - optionalAuctionAuth: Attaches auction context if admin, otherwise continues
 * 
 * Product isolation: These middleware are independent of org/tenant resolution.
 * 
 * @module middleware/auctionAuth
 */

const jwt = require('jsonwebtoken');
const Auction = require('../models/Auction');
const AuctionTeam = require('../models/AuctionTeam');

/**
 * Resolve auction and verify the authenticated user is an admin of that auction.
 * Requires: req.user (from auth middleware), req.params.auctionId
 * Attaches: req.auction, req.auctionRole
 */
const resolveAuctionAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource',
      });
    }

    const auctionId = req.params.auctionId || req.params.id;
    if (!auctionId) {
      return res.status(400).json({
        error: 'Missing auction ID',
        message: 'Auction ID is required',
      });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction || auction.isDeleted) {
      return res.status(404).json({
        error: 'Auction not found',
        message: 'The requested auction does not exist',
      });
    }

    const adminEntry = auction.admins.find(a => a.userId.equals(req.user._id));
    if (!adminEntry) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not an admin of this auction',
      });
    }

    req.auction = auction;
    req.auctionRole = adminEntry.role;
    next();
  } catch (error) {
    console.error('resolveAuctionAdmin error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to resolve auction admin context',
    });
  }
};

/**
 * Require auction owner role (not just admin).
 * Must be used after resolveAuctionAdmin.
 */
const requireAuctionOwner = (req, res, next) => {
  if (req.auctionRole !== 'owner') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Auction owner privileges required',
    });
  }
  next();
};

/**
 * Resolve auction team from team access token.
 * Token sent via X-Team-Token header or Authorization header with 'Team' scheme.
 * Attaches: req.auctionTeam, req.auction
 */
const resolveAuctionTeam = async (req, res, next) => {
  try {
    const teamToken = req.headers['x-team-token'] ||
      (req.headers.authorization && req.headers.authorization.startsWith('Team ')
        ? req.headers.authorization.substring(5)
        : null);

    if (!teamToken) {
      return res.status(401).json({
        error: 'Team authentication required',
        message: 'Please provide a valid team access token',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(teamToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: 'Invalid team token',
        message: 'Team access token is invalid or expired',
      });
    }

    if (!decoded.teamId || !decoded.auctionId) {
      return res.status(401).json({
        error: 'Invalid team token',
        message: 'Token does not contain required team information',
      });
    }

    const [team, auction] = await Promise.all([
      AuctionTeam.findById(decoded.teamId),
      Auction.findById(decoded.auctionId),
    ]);

    if (!team || !team.isActive) {
      return res.status(404).json({
        error: 'Team not found',
        message: 'The team associated with this token does not exist',
      });
    }

    if (!auction || auction.isDeleted) {
      return res.status(404).json({
        error: 'Auction not found',
        message: 'The auction associated with this token does not exist',
      });
    }

    // Verify team belongs to this auction
    if (!team.auctionId.equals(auction._id)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Team does not belong to this auction',
      });
    }

    req.auctionTeam = team;
    req.auction = auction;
    next();
  } catch (error) {
    console.error('resolveAuctionTeam error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to resolve team context',
    });
  }
};

/**
 * Load auction by ID or slug for public routes.
 * Does not require auth. Attaches: req.auction
 * Only loads auctions that are publicly viewable (not draft, not deleted).
 */
const loadPublicAuction = async (req, res, next) => {
  try {
    const identifier = req.params.auctionId || req.params.slug;
    if (!identifier) {
      return res.status(400).json({
        error: 'Missing identifier',
        message: 'Auction ID or slug is required',
      });
    }

    let auction;
    // Try as ObjectId first, then as slug
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      auction = await Auction.findById(identifier);
    }
    if (!auction) {
      auction = await Auction.findOne({ slug: identifier });
    }

    if (!auction || auction.isDeleted || !auction.isActive) {
      return res.status(404).json({
        error: 'Auction not found',
        message: 'The requested auction does not exist',
      });
    }

    // Draft auctions are not publicly viewable
    if (auction.status === 'draft') {
      return res.status(404).json({
        error: 'Auction not found',
        message: 'This auction is not yet available',
      });
    }

    req.auction = auction;
    next();
  } catch (error) {
    console.error('loadPublicAuction error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to load auction',
    });
  }
};

module.exports = {
  resolveAuctionAdmin,
  requireAuctionOwner,
  resolveAuctionTeam,
  loadPublicAuction,
};
