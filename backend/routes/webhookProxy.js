const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const webhookProxyService = require('../services/webhookProxyService');
const WebhookProxyConfig = require('../models/WebhookProxyConfig');

/**
 * Webhook Proxy Routes
 * 
 * This is the entry point for all WhatsApp webhooks when deployed as a proxy.
 * 
 * Flow:
 * 1. WhatsApp sends webhook to this proxy endpoint
 * 2. Proxy ALWAYS forwards to production (guaranteed delivery)
 * 3. If sender's phone is in local routing list, ALSO forward to local dev
 */

// ============================================
// WEBHOOK ENDPOINTS (No Auth - WhatsApp calls these)
// ============================================

/**
 * GET /api/webhook-proxy/webhook
 * Webhook verification endpoint
 * WhatsApp sends this to verify the webhook URL
 */
router.get('/webhook', async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mavericks-xi-verify-token-2024';
    
    console.log('[WebhookProxy] Verification request received');
    
    // Verify the webhook directly (don't need to forward for verification)
    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('[WebhookProxy] WEBHOOK_VERIFIED');
        return res.status(200).send(challenge);
      } else {
        console.log('[WebhookProxy] Verification failed - token mismatch');
        return res.sendStatus(403);
      }
    }
    
    res.sendStatus(404);
  } catch (error) {
    console.error('[WebhookProxy] Verification error:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /api/webhook-proxy/webhook
 * Main webhook endpoint - receives all WhatsApp events
 * Routes to production (always) and local (if configured)
 */
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    const headers = req.headers;
    
    console.log('\n========================================');
    console.log('[WebhookProxy] Received webhook event');
    console.log('========================================');
    
    // Route the webhook
    const result = await webhookProxyService.routeWebhook(payload, headers);
    
    console.log('[WebhookProxy] Routing complete:', {
      prodSuccess: result.prodResult?.success,
      routedToLocal: result.routedToLocal,
      localSuccess: result.localResult?.success
    });
    
    // Always return 200 to WhatsApp (we've received the event)
    // Even if forwarding fails, we don't want WhatsApp to retry
    res.status(200).send('EVENT_RECEIVED');
    
  } catch (error) {
    console.error('[WebhookProxy] Error processing webhook:', error);
    // Still return 200 to prevent WhatsApp retries
    res.status(200).send('EVENT_RECEIVED');
  }
});

// ============================================
// ADMIN ENDPOINTS (Auth Required)
// ============================================

/**
 * GET /api/webhook-proxy/config
 * Get current proxy configuration
 */
router.get('/config', auth, async (req, res) => {
  try {
    const config = await WebhookProxyConfig.getConfig();
    
    res.json({
      success: true,
      data: {
        localRoutingEnabled: config.localRoutingEnabled,
        localServerUrl: config.localServerUrl,
        localRoutingPhones: config.localRoutingPhones,
        productionWebhookUrl: config.productionWebhookUrl,
        stats: config.stats,
        lastModifiedAt: config.lastModifiedAt
      }
    });
  } catch (error) {
    console.error('[WebhookProxy] Error fetching config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proxy configuration'
    });
  }
});

/**
 * PUT /api/webhook-proxy/config
 * Update proxy configuration
 */
router.put('/config', auth, async (req, res) => {
  try {
    const { localRoutingEnabled, localServerUrl, localRoutingPhones, productionWebhookUrl } = req.body;
    
    const config = await WebhookProxyConfig.getConfig();
    
    if (typeof localRoutingEnabled === 'boolean') {
      config.localRoutingEnabled = localRoutingEnabled;
    }
    
    if (localServerUrl !== undefined) {
      config.localServerUrl = localServerUrl;
    }
    
    if (Array.isArray(localRoutingPhones)) {
      // Normalize phone numbers
      config.localRoutingPhones = localRoutingPhones.map(phone => 
        phone.replace(/\D/g, '')
      ).filter(phone => phone.length >= 10);
    }
    
    if (productionWebhookUrl !== undefined) {
      config.productionWebhookUrl = productionWebhookUrl;
    }
    
    config.lastModifiedBy = req.user.id;
    config.lastModifiedAt = new Date();
    
    await config.save();
    
    // Invalidate service cache
    webhookProxyService.invalidateCache();
    
    console.log('[WebhookProxy] Config updated:', {
      localRoutingEnabled: config.localRoutingEnabled,
      localServerUrl: config.localServerUrl,
      phonesCount: config.localRoutingPhones.length
    });
    
    res.json({
      success: true,
      message: 'Proxy configuration updated',
      data: {
        localRoutingEnabled: config.localRoutingEnabled,
        localServerUrl: config.localServerUrl,
        localRoutingPhones: config.localRoutingPhones,
        productionWebhookUrl: config.productionWebhookUrl
      }
    });
  } catch (error) {
    console.error('[WebhookProxy] Error updating config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update proxy configuration'
    });
  }
});

/**
 * POST /api/webhook-proxy/toggle-local
 * One-click toggle for local routing
 */
router.post('/toggle-local', auth, async (req, res) => {
  try {
    const config = await WebhookProxyConfig.getConfig();
    
    config.localRoutingEnabled = !config.localRoutingEnabled;
    config.lastModifiedBy = req.user.id;
    config.lastModifiedAt = new Date();
    
    await config.save();
    
    // Invalidate service cache
    webhookProxyService.invalidateCache();
    
    console.log(`[WebhookProxy] Local routing toggled: ${config.localRoutingEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    res.json({
      success: true,
      message: `Local routing ${config.localRoutingEnabled ? 'enabled' : 'disabled'}`,
      data: {
        localRoutingEnabled: config.localRoutingEnabled
      }
    });
  } catch (error) {
    console.error('[WebhookProxy] Error toggling local routing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle local routing'
    });
  }
});

/**
 * POST /api/webhook-proxy/add-phone
 * Add a phone number to local routing list
 */
router.post('/add-phone', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    const normalizedPhone = phone.replace(/\D/g, '');
    
    if (normalizedPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number'
      });
    }
    
    const config = await WebhookProxyConfig.getConfig();
    
    // Check if already exists
    const exists = config.localRoutingPhones.some(p => 
      p.slice(-10) === normalizedPhone.slice(-10)
    );
    
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already in routing list'
      });
    }
    
    config.localRoutingPhones.push(normalizedPhone);
    config.lastModifiedBy = req.user.id;
    config.lastModifiedAt = new Date();
    
    await config.save();
    webhookProxyService.invalidateCache();
    
    res.json({
      success: true,
      message: 'Phone added to local routing list',
      data: {
        phone: normalizedPhone,
        localRoutingPhones: config.localRoutingPhones
      }
    });
  } catch (error) {
    console.error('[WebhookProxy] Error adding phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add phone number'
    });
  }
});

/**
 * DELETE /api/webhook-proxy/remove-phone/:phone
 * Remove a phone number from local routing list
 */
router.delete('/remove-phone/:phone', auth, async (req, res) => {
  try {
    const { phone } = req.params;
    const normalizedPhone = phone.replace(/\D/g, '');
    
    const config = await WebhookProxyConfig.getConfig();
    
    const initialLength = config.localRoutingPhones.length;
    config.localRoutingPhones = config.localRoutingPhones.filter(p => 
      p.slice(-10) !== normalizedPhone.slice(-10)
    );
    
    if (config.localRoutingPhones.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Phone number not found in routing list'
      });
    }
    
    config.lastModifiedBy = req.user.id;
    config.lastModifiedAt = new Date();
    
    await config.save();
    webhookProxyService.invalidateCache();
    
    res.json({
      success: true,
      message: 'Phone removed from local routing list',
      data: {
        localRoutingPhones: config.localRoutingPhones
      }
    });
  } catch (error) {
    console.error('[WebhookProxy] Error removing phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove phone number'
    });
  }
});

/**
 * GET /api/webhook-proxy/stats
 * Get routing statistics
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const config = await WebhookProxyConfig.getConfig();
    
    res.json({
      success: true,
      data: {
        totalEventsReceived: config.stats.totalEventsReceived,
        eventsRoutedToLocal: config.stats.eventsRoutedToLocal,
        eventsRoutedToProd: config.stats.eventsRoutedToProd,
        lastEventAt: config.stats.lastEventAt,
        lastLocalRouteAt: config.stats.lastLocalRouteAt,
        localRoutingEnabled: config.localRoutingEnabled,
        configuredPhones: config.localRoutingPhones.length
      }
    });
  } catch (error) {
    console.error('[WebhookProxy] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * POST /api/webhook-proxy/test-local
 * Test connectivity to local development server
 */
router.post('/test-local', auth, async (req, res) => {
  try {
    const config = await WebhookProxyConfig.getConfig();
    
    if (!config.localServerUrl) {
      return res.status(400).json({
        success: false,
        error: 'Local server URL not configured'
      });
    }
    
    const axios = require('axios');
    const testUrl = `${config.localServerUrl}/api/whatsapp/webhook`;
    
    console.log(`[WebhookProxy] Testing connectivity to: ${testUrl}`);
    
    // Send a test ping (empty valid webhook structure)
    const testPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: 'test', phone_number_id: 'test' }
          }
        }]
      }]
    };
    
    try {
      const response = await axios.post(testUrl, testPayload, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      res.json({
        success: true,
        message: 'Local server is reachable',
        data: {
          url: config.localServerUrl,
          statusCode: response.status,
          responseTime: 'OK'
        }
      });
    } catch (err) {
      res.json({
        success: false,
        message: 'Local server is not reachable',
        data: {
          url: config.localServerUrl,
          error: err.message
        }
      });
    }
  } catch (error) {
    console.error('[WebhookProxy] Error testing local:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test local server'
    });
  }
});

module.exports = router;
