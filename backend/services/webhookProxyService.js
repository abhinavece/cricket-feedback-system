const axios = require('axios');
const WebhookProxyConfig = require('../models/WebhookProxyConfig');

/**
 * Webhook Proxy Service
 * 
 * Handles routing of WhatsApp webhook events:
 * 1. ALL events ALWAYS go to production (guaranteed delivery)
 * 2. Events from configured phone numbers ALSO go to local dev
 * 3. One-click toggle for enabling/disabling local routing
 */

class WebhookProxyService {
  constructor() {
    this.config = null;
    this.configLastFetched = null;
    this.CONFIG_CACHE_TTL = 30000; // 30 seconds cache
  }

  /**
   * Get cached config or fetch fresh from DB
   */
  async getConfig() {
    const now = Date.now();
    if (this.config && this.configLastFetched && (now - this.configLastFetched) < this.CONFIG_CACHE_TTL) {
      return this.config;
    }
    
    this.config = await WebhookProxyConfig.getConfig();
    this.configLastFetched = now;
    return this.config;
  }

  /**
   * Invalidate config cache (call after config updates)
   */
  invalidateCache() {
    this.config = null;
    this.configLastFetched = null;
  }

  /**
   * Extract phone numbers from WhatsApp webhook payload
   * @param {Object} payload - WhatsApp webhook payload
   * @returns {string[]} - Array of sender phone numbers
   */
  extractPhoneNumbers(payload) {
    const phones = [];
    
    try {
      if (payload.object === 'whatsapp_business_account') {
        for (const entry of payload.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages') {
              const messages = change.value?.messages || [];
              for (const message of messages) {
                if (message.from) {
                  phones.push(message.from);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[WebhookProxy] Error extracting phone numbers:', err.message);
    }
    
    return phones;
  }

  /**
   * Forward webhook to a target URL
   * @param {string} targetUrl - URL to forward to
   * @param {Object} payload - Webhook payload
   * @param {Object} headers - Original headers to forward
   * @param {string} label - Label for logging
   * @returns {Promise<{success: boolean, statusCode?: number, error?: string}>}
   */
  async forwardWebhook(targetUrl, payload, headers, label) {
    try {
      console.log(`[WebhookProxy] Forwarding to ${label}: ${targetUrl}`);
      
      const response = await axios.post(targetUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-By': 'webhook-proxy',
          'X-Original-Host': headers['host'] || '',
          'X-Forwarded-For': headers['x-forwarded-for'] || ''
        },
        timeout: 10000, // 10 second timeout
        validateStatus: () => true // Don't throw on any status
      });
      
      console.log(`[WebhookProxy] ${label} responded with status: ${response.status}`);
      
      return {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status
      };
    } catch (err) {
      console.error(`[WebhookProxy] Failed to forward to ${label}:`, err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Main routing logic
   * @param {Object} payload - WhatsApp webhook payload
   * @param {Object} headers - Request headers
   * @returns {Promise<{prodResult: Object, localResult?: Object, routedToLocal: boolean}>}
   */
  async routeWebhook(payload, headers) {
    const config = await this.getConfig();
    const phones = this.extractPhoneNumbers(payload);
    
    console.log(`[WebhookProxy] Processing webhook with phones: ${phones.join(', ') || 'none'}`);
    
    // Update stats
    config.stats.totalEventsReceived++;
    config.stats.lastEventAt = new Date();
    
    // ALWAYS forward to production first
    const prodResult = await this.forwardWebhook(
      config.productionWebhookUrl,
      payload,
      headers,
      'PRODUCTION'
    );
    
    config.stats.eventsRoutedToProd++;
    
    // Check if any phone should be routed to local
    let routedToLocal = false;
    let localResult = null;
    
    if (config.localRoutingEnabled && config.localServerUrl) {
      const shouldRouteLocal = phones.some(phone => config.shouldRouteToLocal(phone));
      
      if (shouldRouteLocal) {
        console.log(`[WebhookProxy] Phone matched for local routing, forwarding to: ${config.localServerUrl}`);
        
        localResult = await this.forwardWebhook(
          `${config.localServerUrl}/api/whatsapp/webhook`,
          payload,
          headers,
          'LOCAL'
        );
        
        routedToLocal = true;
        config.stats.eventsRoutedToLocal++;
        config.stats.lastLocalRouteAt = new Date();
      } else {
        console.log(`[WebhookProxy] No phone matched for local routing`);
      }
    }
    
    // Save stats (fire and forget)
    config.save().catch(err => {
      console.error('[WebhookProxy] Failed to save stats:', err.message);
    });
    
    return {
      prodResult,
      localResult,
      routedToLocal
    };
  }

  /**
   * Handle webhook verification (GET request)
   * Forward to production for verification
   */
  async handleVerification(query, productionUrl) {
    try {
      const config = await this.getConfig();
      const targetUrl = `${config.productionWebhookUrl}?${new URLSearchParams(query).toString()}`;
      
      console.log(`[WebhookProxy] Forwarding verification to: ${targetUrl}`);
      
      const response = await axios.get(targetUrl, {
        timeout: 10000,
        validateStatus: () => true
      });
      
      return {
        success: true,
        statusCode: response.status,
        data: response.data
      };
    } catch (err) {
      console.error('[WebhookProxy] Verification forwarding failed:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

// Export singleton instance
module.exports = new WebhookProxyService();
