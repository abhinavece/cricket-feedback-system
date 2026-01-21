/**
 * SSE Events Route
 *
 * Provides Server-Sent Events endpoint for real-time updates.
 * Clients can subscribe to specific topics to receive targeted updates.
 *
 * Usage:
 *   GET /api/events?subscribe=match:123,payments,messages&token=<jwt>
 *
 * Topics:
 *   - match:<matchId>  : Updates for a specific match (availability, status changes)
 *   - payments         : Payment updates (screenshots, confirmations)
 *   - messages         : WhatsApp message updates
 *   - *                : All events (wildcard)
 */

const express = require('express');
const router = express.Router();
const sseManager = require('../utils/sseManager');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * SSE Auth middleware - supports both header and query param token
 * EventSource API doesn't support custom headers, so we allow token in query param
 */
const sseAuth = async (req, res, next) => {
  try {
    // Bypass auth for local development if DISABLE_AUTH is set
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('⚠️ SSE Auth bypassed - DISABLE_AUTH is enabled');
      const mongoose = require('mongoose');
      req.user = {
        _id: new mongoose.Types.ObjectId(),
        id: new mongoose.Types.ObjectId().toString(),
        email: 'dev@localhost',
        name: 'Local Dev Admin',
        role: 'admin',
        isActive: true
      };
      return next();
    }

    // Get token from Authorization header OR query param
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    // Fallback to query param for EventSource compatibility
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid authentication',
        message: 'User not found or inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('SSE Auth error:', error.message);
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
};

/**
 * SSE Connection Endpoint
 * GET /api/events?subscribe=topic1,topic2&token=<jwt>
 */
router.get('/', sseAuth, (req, res) => {
  // Parse subscriptions from query param
  const subscribeParam = req.query.subscribe || '*';
  const subscriptions = subscribeParam.split(',').map(s => s.trim()).filter(Boolean);

  // Add client to SSE manager
  const clientId = sseManager.addClient(res, subscriptions);

  // Don't end the response - keep it open for SSE
  // The connection will be cleaned up when client disconnects
});

/**
 * SSE Status Endpoint
 * GET /api/events/status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'healthy',
    connectedClients: sseManager.getClientCount(),
    subscriptions: sseManager.getSubscriptionStats(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
