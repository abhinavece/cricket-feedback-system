const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const whatsappAnalyticsService = require('../services/whatsappAnalyticsService');
const WhatsAppCostConfig = require('../models/WhatsAppCostConfig');
const mongoose = require('mongoose');

/**
 * WhatsApp Analytics API Routes
 * All routes require admin authentication
 */

// GET /api/whatsapp/analytics/dashboard - Overall analytics summary
router.get('/dashboard', auth, requireAdmin, async (req, res) => {
  try {
    const overview = await whatsappAnalyticsService.getDashboardOverview();
    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch analytics dashboard', message: error.message });
  }
});

// GET /api/whatsapp/analytics/sessions - List active sessions
router.get('/sessions', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await whatsappAnalyticsService.getActiveSessions({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100)
    });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions', message: error.message });
  }
});

// GET /api/whatsapp/analytics/session/:phone - Check specific session
router.get('/session/:phone', auth, requireAdmin, async (req, res) => {
  try {
    const { phone } = req.params;
    const session = await whatsappAnalyticsService.getSessionStatus(phone);
    const cooldown = await whatsappAnalyticsService.getCooldownRemaining(phone);

    res.json({
      success: true,
      data: {
        session,
        cooldown
      }
    });
  } catch (error) {
    console.error('Error fetching session status:', error);
    res.status(500).json({ error: 'Failed to fetch session status', message: error.message });
  }
});

// GET /api/whatsapp/analytics/costs - Cost analytics
router.get('/costs', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100)
    };

    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    const result = await whatsappAnalyticsService.getCostAnalytics(options);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching cost analytics:', error);
    res.status(500).json({ error: 'Failed to fetch cost analytics', message: error.message });
  }
});

// GET /api/whatsapp/analytics/costs/user/:phone - Per-user costs
router.get('/costs/user/:phone', auth, requireAdmin, async (req, res) => {
  try {
    const { phone } = req.params;
    const result = await whatsappAnalyticsService.getUserCostSummary(phone);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching user costs:', error);
    res.status(500).json({ error: 'Failed to fetch user costs', message: error.message });
  }
});

// GET /api/whatsapp/analytics/errors - Failed messages
router.get('/errors', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100)
    };

    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    const result = await whatsappAnalyticsService.getFailedMessages(options);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching failed messages:', error);
    res.status(500).json({ error: 'Failed to fetch failed messages', message: error.message });
  }
});

// POST /api/whatsapp/analytics/check-send - Pre-flight check before sending
router.post('/check-send', auth, requireAdmin, async (req, res) => {
  try {
    const { phone, isTemplate, templateName, templateCategory } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await whatsappAnalyticsService.preSendCheck(
      phone,
      isTemplate || false,
      templateName || null,
      templateCategory || 'utility'
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error checking send status:', error);
    res.status(500).json({ error: 'Failed to check send status', message: error.message });
  }
});

// GET /api/whatsapp/analytics/cost-config - Get cost configuration
router.get('/cost-config', auth, requireAdmin, async (req, res) => {
  try {
    const config = await WhatsAppCostConfig.getConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching cost config:', error);
    res.status(500).json({ error: 'Failed to fetch cost config', message: error.message });
  }
});

// PUT /api/whatsapp/analytics/cost-config - Update cost configuration
router.put('/cost-config', auth, requireAdmin, async (req, res) => {
  try {
    const { templateCosts, currency } = req.body;

    const config = await WhatsAppCostConfig.updateConfig(
      { templateCosts, currency },
      req.user._id
    );

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating cost config:', error);
    res.status(500).json({ error: 'Failed to update cost config', message: error.message });
  }
});

module.exports = router;
