const express = require('express');
const router = express.Router();
const PublicLink = require('../models/PublicLink');
const Match = require('../models/Match');
const MatchPayment = require('../models/MatchPayment');
const Availability = require('../models/Availability');
const { auth } = require('../middleware/auth');

// GET /api/public/:token - Access shared resource (NO AUTH REQUIRED)
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const publicLink = await PublicLink.findOne({ token });
    
    if (!publicLink) {
      return res.status(404).json({
        success: false,
        error: 'Link not found or has been removed'
      });
    }
    
    if (!publicLink.isValid()) {
      return res.status(410).json({
        success: false,
        error: 'This link has expired or been deactivated'
      });
    }
    
    // Record access
    await publicLink.recordAccess();
    
    let data = {};
    
    // Fetch the appropriate resource based on type
    if (publicLink.resourceType === 'match') {
      const match = await Match.findById(publicLink.resourceId);
      
      if (!match) {
        return res.status(404).json({
          success: false,
          error: 'Match not found'
        });
      }
      
      // Fetch availability data for squad
      const availabilities = await Availability.find({ matchId: match._id })
        .select('playerId playerName playerPhone response respondedAt')
        .sort({ respondedAt: -1 });
      
      data = {
        type: 'match',
        viewType: publicLink.viewType,
        match: {
          _id: match._id,
          matchId: match.matchId,
          opponent: match.opponent,
          date: match.date,
          time: match.time,
          slot: match.slot,
          ground: match.ground,
          locationLink: match.locationLink || '',
          status: match.status,
          matchType: match.matchType || 'practice',
          teamName: match.teamName || 'Mavericks XI',
          availabilitySent: match.availabilitySent,
          statistics: match.statistics
        },
        availabilities: availabilities.map(a => ({
          _id: a._id,
          playerName: a.playerName,
          playerPhone: a.playerPhone,
          response: a.response,
          respondedAt: a.respondedAt
        })),
        squad: {
          available: availabilities.filter(a => a.response === 'yes'),
          tentative: availabilities.filter(a => a.response === 'tentative'),
          unavailable: availabilities.filter(a => a.response === 'no'),
          pending: availabilities.filter(a => !a.response || a.response === 'pending')
        }
      };
      
    } else if (publicLink.resourceType === 'payment') {
      const payment = await MatchPayment.findById(publicLink.resourceId)
        .populate('matchId', 'opponent date time ground locationLink');
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment record not found'
        });
      }
      
      // Use stored perPersonAmount (calculated based on adjusted vs non-adjusted members)
      const perPerson = payment.perPersonAmount || 0;
      
      data = {
        type: 'payment',
        viewType: publicLink.viewType,
        payment: {
          _id: payment._id,
          match: payment.matchId ? {
            opponent: payment.matchId.opponent,
            date: payment.matchId.date,
            time: payment.matchId.time,
            ground: payment.matchId.ground,
            locationLink: payment.matchId.locationLink || ''
          } : null,
          title: payment.title,
          totalAmount: payment.totalAmount || 0,
          perPersonAmount: perPerson,
          totalCollected: payment.totalCollected || 0,
          totalPending: payment.totalPending || 0,
          totalOwed: payment.totalOwed || 0,
          paidCount: payment.paidCount || 0,
          membersCount: payment.membersCount || memberCount,
          status: payment.status,
          squadMembers: (payment.squadMembers || []).map(member => ({
            playerId: member.playerId,
            playerName: member.playerName,
            playerPhone: member.playerPhone,
            amount: member.calculatedAmount ?? 0,
            paidAmount: member.amountPaid ?? 0,
            owedAmount: member.owedAmount ?? 0,
            dueAmount: member.dueAmount ?? 0,
            adjustedAmount: member.adjustedAmount,
            isFreePlayer: member.adjustedAmount === 0,
            status: member.paymentStatus || 'pending'
          })),
          createdAt: payment.createdAt
        }
      };
    }
    
    res.json({
      success: true,
      data,
      linkInfo: {
        viewType: publicLink.viewType,
        accessCount: publicLink.accessCount,
        expiresAt: publicLink.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Error accessing public link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to access shared content'
    });
  }
});

// POST /api/public/generate - Generate a new public link (AUTH REQUIRED)
router.post('/generate', auth, async (req, res) => {
  try {
    const { resourceType, resourceId, viewType, expiresInDays } = req.body;
    
    if (!resourceType || !resourceId) {
      return res.status(400).json({
        success: false,
        error: 'Resource type and ID are required'
      });
    }
    
    if (!['match', 'payment'].includes(resourceType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource type'
      });
    }
    
    // Verify the resource exists
    let resource;
    if (resourceType === 'match') {
      resource = await Match.findById(resourceId);
    } else if (resourceType === 'payment') {
      resource = await MatchPayment.findById(resourceId);
    }
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
    
    // Check if a valid link already exists for this resource
    let existingLink = await PublicLink.findOne({
      resourceType,
      resourceId,
      viewType: viewType || 'full',
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    if (existingLink) {
      // Return existing link - use origin only, strip any path
      let baseUrl = process.env.FRONTEND_URL || 'https://mavericks11.duckdns.org';
      // Strip /api or any path from the URL to get just the origin
      try {
        const urlObj = new URL(baseUrl);
        baseUrl = urlObj.origin;
      } catch (e) {
        baseUrl = 'https://mavericks11.duckdns.org';
      }
      return res.json({
        success: true,
        message: 'Existing link found',
        data: {
          token: existingLink.token,
          url: `${baseUrl}/share/${resourceType}/${existingLink.token}`,
          expiresAt: existingLink.expiresAt,
          accessCount: existingLink.accessCount
        }
      });
    }
    
    // Generate new token
    const token = PublicLink.generateToken();
    
    // Calculate expiration
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }
    
    // Create public link
    const publicLink = new PublicLink({
      token,
      resourceType,
      resourceId,
      viewType: viewType || 'full',
      createdBy: req.user._id,
      expiresAt
    });
    
    await publicLink.save();
    
    // Use origin only, strip any path from FRONTEND_URL
    let baseUrl = process.env.FRONTEND_URL || 'https://mavericks11.duckdns.org';
    try {
      const urlObj = new URL(baseUrl);
      baseUrl = urlObj.origin;
    } catch (e) {
      baseUrl = 'https://mavericks11.duckdns.org';
    }
    
    res.status(201).json({
      success: true,
      message: 'Public link created',
      data: {
        token: publicLink.token,
        url: `${baseUrl}/share/${resourceType}/${publicLink.token}`,
        expiresAt: publicLink.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Error generating public link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate public link'
    });
  }
});

// DELETE /api/public/:token - Deactivate a public link (AUTH REQUIRED)
router.delete('/:token', auth, async (req, res) => {
  try {
    const { token } = req.params;
    
    const publicLink = await PublicLink.findOne({ token });
    
    if (!publicLink) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }
    
    publicLink.isActive = false;
    await publicLink.save();
    
    res.json({
      success: true,
      message: 'Link deactivated'
    });
    
  } catch (error) {
    console.error('Error deactivating link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate link'
    });
  }
});

// GET /api/public/list/:resourceType/:resourceId - List all links for a resource (AUTH REQUIRED)
router.get('/list/:resourceType/:resourceId', auth, async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    
    const links = await PublicLink.find({
      resourceType,
      resourceId,
      isActive: true
    }).select('token viewType expiresAt accessCount createdAt lastAccessedAt');
    
    // Use origin only, strip any path from FRONTEND_URL
    let baseUrl = process.env.FRONTEND_URL || 'https://mavericks11.duckdns.org';
    try {
      const urlObj = new URL(baseUrl);
      baseUrl = urlObj.origin;
    } catch (e) {
      baseUrl = 'https://mavericks11.duckdns.org';
    }
    
    res.json({
      success: true,
      data: links.map(link => ({
        token: link.token,
        url: `${baseUrl}/share/${resourceType}/${link.token}`,
        viewType: link.viewType,
        expiresAt: link.expiresAt,
        accessCount: link.accessCount,
        createdAt: link.createdAt,
        lastAccessedAt: link.lastAccessedAt
      }))
    });
    
  } catch (error) {
    console.error('Error listing links:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list links'
    });
  }
});

module.exports = router;
