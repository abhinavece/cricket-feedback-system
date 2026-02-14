/**
 * @fileoverview Tournament Authentication & Authorization Middleware
 * 
 * Resource-level auth for the tournament system.
 * - resolveTournamentAdmin: Checks tournament.admins[] for user JWT
 * - requireTournamentOwner: Requires owner role within tournament
 * - loadPublicTournament: Loads tournament for public routes
 * 
 * Product isolation: These middleware are independent of org/tenant resolution.
 * Tournaments can now exist without an organization (standalone).
 * 
 * @module middleware/tournamentAuth
 */

const Tournament = require('../models/Tournament');

/**
 * Resolve tournament and verify the authenticated user is an admin of that tournament.
 * Requires: req.user (from auth middleware), req.params.tournamentId or req.params.id
 * Attaches: req.tournament, req.tournamentRole
 */
const resolveTournamentAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource',
      });
    }

    const tournamentId = req.params.tournamentId || req.params.id;
    if (!tournamentId) {
      return res.status(400).json({
        error: 'Missing tournament ID',
        message: 'Tournament ID is required',
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament || tournament.isDeleted) {
      return res.status(404).json({
        error: 'Tournament not found',
        message: 'The requested tournament does not exist',
      });
    }

    // Check if user is in tournament.admins[]
    const adminEntry = tournament.admins.find(a => a.userId?.equals(req.user._id));
    if (!adminEntry) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not an admin of this tournament',
      });
    }

    req.tournament = tournament;
    req.tournamentRole = adminEntry.role;
    next();
  } catch (error) {
    console.error('resolveTournamentAdmin error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to resolve tournament admin context',
    });
  }
};

/**
 * Require tournament owner role (not just admin).
 * Must be used after resolveTournamentAdmin.
 */
const requireTournamentOwner = (req, res, next) => {
  if (req.tournamentRole !== 'owner') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Tournament owner privileges required',
    });
  }
  next();
};

/**
 * Optional tournament admin check.
 * If user is an admin, attaches tournament context; otherwise continues without error.
 * Useful for routes that have different behavior for admins vs non-admins.
 */
const optionalTournamentAdmin = async (req, res, next) => {
  try {
    const tournamentId = req.params.tournamentId || req.params.id;
    if (!tournamentId || !req.user) {
      return next();
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament || tournament.isDeleted) {
      return next();
    }

    const adminEntry = tournament.admins.find(a => a.userId?.equals(req.user._id));
    if (adminEntry) {
      req.tournament = tournament;
      req.tournamentRole = adminEntry.role;
    }

    next();
  } catch (error) {
    console.error('optionalTournamentAdmin error:', error);
    next(); // Continue even on error for optional middleware
  }
};

/**
 * Load tournament by ID or slug for public routes.
 * Does not require auth. Attaches: req.tournament
 * Only loads tournaments that are publicly viewable (not draft, not deleted).
 */
const loadPublicTournament = async (req, res, next) => {
  try {
    const identifier = req.params.tournamentId || req.params.slug || req.params.token;
    if (!identifier) {
      return res.status(400).json({
        error: 'Missing identifier',
        message: 'Tournament ID, slug, or token is required',
      });
    }

    let tournament;

    // Try as ObjectId first
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      tournament = await Tournament.findById(identifier);
    }
    
    // Try as slug
    if (!tournament) {
      tournament = await Tournament.findOne({ slug: identifier });
    }
    
    // Try as public token
    if (!tournament) {
      tournament = await Tournament.findOne({ publicToken: identifier });
    }

    if (!tournament || tournament.isDeleted || !tournament.isActive) {
      return res.status(404).json({
        error: 'Tournament not found',
        message: 'The requested tournament does not exist',
      });
    }

    // Draft tournaments are not publicly viewable (unless accessed by public token)
    if (tournament.status === 'draft' && !tournament.publicToken) {
      return res.status(404).json({
        error: 'Tournament not found',
        message: 'This tournament is not yet available',
      });
    }

    req.tournament = tournament;
    next();
  } catch (error) {
    console.error('loadPublicTournament error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to load tournament',
    });
  }
};

/**
 * Hybrid middleware: Check both tournament.admins[] AND organization role.
 * This supports the transition period where some tournaments use org-based auth
 * and others use resource-level auth.
 * 
 * Authorization passes if user is:
 * 1. In tournament.admins[], OR
 * 2. An admin/owner of the tournament's organization (if organizationId exists)
 */
const resolveTournamentAdminHybrid = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource',
      });
    }

    const tournamentId = req.params.tournamentId || req.params.id;
    if (!tournamentId) {
      return res.status(400).json({
        error: 'Missing tournament ID',
        message: 'Tournament ID is required',
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament || tournament.isDeleted) {
      return res.status(404).json({
        error: 'Tournament not found',
        message: 'The requested tournament does not exist',
      });
    }

    // Check 1: User in tournament.admins[]
    const adminEntry = tournament.admins.find(a => a.userId?.equals(req.user._id));
    if (adminEntry) {
      req.tournament = tournament;
      req.tournamentRole = adminEntry.role;
      return next();
    }

    // Check 2: User is org admin (if tournament has organizationId)
    if (tournament.organizationId && req.user.organizations) {
      const orgMembership = req.user.organizations.find(
        m => m.organizationId?.equals(tournament.organizationId) && m.status === 'active'
      );
      if (orgMembership && ['owner', 'admin'].includes(orgMembership.role)) {
        req.tournament = tournament;
        req.tournamentRole = orgMembership.role === 'owner' ? 'owner' : 'admin';
        return next();
      }
    }

    return res.status(403).json({
      error: 'Access denied',
      message: 'You are not an admin of this tournament',
    });
  } catch (error) {
    console.error('resolveTournamentAdminHybrid error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to resolve tournament admin context',
    });
  }
};

module.exports = {
  resolveTournamentAdmin,
  requireTournamentOwner,
  optionalTournamentAdmin,
  loadPublicTournament,
  resolveTournamentAdminHybrid,
};
