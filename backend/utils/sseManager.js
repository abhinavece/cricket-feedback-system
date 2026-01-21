/**
 * SSE (Server-Sent Events) Connection Manager
 *
 * Manages real-time connections and broadcasts events to subscribed clients.
 * Used for pushing updates for availability, payments, and messages.
 */

const crypto = require('crypto');

// Generate UUID using built-in crypto module
const generateId = () => crypto.randomUUID();

class SSEManager {
  constructor() {
    // Map<clientId, { res, subscriptions: Set<topic>, heartbeat: Interval }>
    this.clients = new Map();
  }

  /**
   * Add new client connection
   * @param {Response} res - Express response object
   * @param {string[]} subscriptions - Topics to subscribe to (e.g., ['match:123', 'payments'])
   * @returns {string} clientId
   */
  addClient(res, subscriptions = ['*']) {
    const clientId = generateId();

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Store client
    this.clients.set(clientId, {
      res,
      subscriptions: new Set(subscriptions)
    });

    // Send initial connection event
    this.sendToClient(clientId, {
      type: 'connected',
      clientId,
      subscriptions,
      timestamp: new Date().toISOString()
    });

    // Heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      if (this.clients.has(clientId)) {
        this.sendToClient(clientId, { type: 'heartbeat', timestamp: new Date().toISOString() });
      }
    }, 30000);

    // Store heartbeat for cleanup
    const client = this.clients.get(clientId);
    client.heartbeat = heartbeat;

    // Cleanup on connection close
    res.on('close', () => {
      this.removeClient(clientId);
    });

    // console.log(`📡 SSE client connected: ${clientId.substring(0, 8)}... (${subscriptions.join(', ')})`);
    // console.log(`📡 Total SSE clients: ${this.clients.size}`);

    return clientId;
  }

  /**
   * Remove client and cleanup
   * @param {string} clientId
   */
  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      if (client.heartbeat) {
        clearInterval(client.heartbeat);
      }
      this.clients.delete(clientId);
      // console.log(`📡 SSE client disconnected: ${clientId.substring(0, 8)}...`);
      // console.log(`📡 Total SSE clients: ${this.clients.size}`);
    }
  }

  /**
   * Send event to specific client
   * @param {string} clientId
   * @param {object} data
   */
  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && client.res && !client.res.writableEnded) {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error(`Failed to send to client ${clientId}:`, err.message);
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Broadcast to all clients subscribed to a topic
   * @param {string} topic - Topic name (e.g., 'payments', 'messages', 'match:123')
   * @param {object} data - Event data
   */
  broadcast(topic, data) {
    const eventData = { topic, ...data, timestamp: new Date().toISOString() };
    let sentCount = 0;

    for (const [clientId, client] of this.clients) {
      // Check if client is subscribed to this topic or wildcard
      if (client.subscriptions.has(topic) || client.subscriptions.has('*')) {
        this.sendToClient(clientId, eventData);
        sentCount++;
      }
    }
  }

  /**
   * Broadcast to clients subscribed to a specific match
   * @param {string} matchId
   * @param {object} data
   */
  broadcastToMatch(matchId, data) {
    this.broadcast(`match:${matchId}`, data);
  }

  /**
   * Update subscription for a client
   * @param {string} clientId
   * @param {string} topic - Topic to add
   */
  subscribe(clientId, topic) {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.add(topic);
    }
  }

  /**
   * Remove subscription for a client
   * @param {string} clientId
   * @param {string} topic - Topic to remove
   */
  unsubscribe(clientId, topic) {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.delete(topic);
    }
  }

  /**
   * Get connected client count
   * @returns {number}
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Get all active subscriptions
   * @returns {object} - Map of topics to client counts
   */
  getSubscriptionStats() {
    const stats = {};
    for (const [, client] of this.clients) {
      for (const topic of client.subscriptions) {
        stats[topic] = (stats[topic] || 0) + 1;
      }
    }
    return stats;
  }
}

// Singleton instance
const sseManager = new SSEManager();

module.exports = sseManager;
