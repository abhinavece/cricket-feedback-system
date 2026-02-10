# Real-Time Events & Webhooks Skill

## Capability
Design and implement real-time communication patterns for live updates across the platform — WhatsApp webhooks, Server-Sent Events (SSE), live scoring, and auction bidding.

## Why This Matters
Cricket is a **live sport**. Users expect:
- Instant WhatsApp message delivery & read receipts
- Live score updates during matches
- Real-time auction bidding with no stale data
- Availability responses updating in real-time on admin dashboards

## Communication Patterns

### 1. Server-Sent Events (SSE) — Dashboard Updates
Best for: One-way server → client updates (availability, messages, scores)

```javascript
// backend/routes/sse.js
router.get('/events', auth, resolveTenant, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',  // Disable nginx buffering
  });

  const orgId = req.organizationId.toString();
  
  // Register this client
  const clientId = Date.now();
  sseClients.set(clientId, { res, orgId });

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
});

// Broadcasting function — ALWAYS scope to organization
const broadcast = (orgId, event, data) => {
  sseClients.forEach((client) => {
    if (client.orgId === orgId) {  // ✅ Tenant-scoped broadcast
      client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  });
};

// Usage: When availability is updated
broadcast(match.organizationId, 'availability_update', {
  matchId: match._id,
  playerId: player._id,
  response: 'yes',
});
```

```typescript
// Frontend SSE consumer
const useSSE = (orgId: string) => {
  useEffect(() => {
    const eventSource = new EventSource(
      `${API_URL}/sse/events`,
      { withCredentials: true }
    );

    eventSource.addEventListener('availability_update', (e) => {
      const data = JSON.parse(e.data);
      // Update local state
      updateAvailability(data.matchId, data.playerId, data.response);
    });

    eventSource.addEventListener('new_message', (e) => {
      const data = JSON.parse(e.data);
      addMessage(data);
    });

    eventSource.onerror = () => {
      // Auto-reconnect is built into EventSource
      console.warn('SSE connection lost, reconnecting...');
    };

    return () => eventSource.close();
  }, [orgId]);
};
```

### 2. WebSocket — Auctions & Live Bidding
Best for: Two-way real-time communication (bidding, chat)

```javascript
// backend/services/auctionSocket.js
const { Server } = require('socket.io');

const setupAuctionSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL },
    path: '/ws/auction',
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const user = await verifyToken(token);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    // Join auction room (scoped by org + auction ID)
    socket.on('join_auction', ({ auctionId, organizationId }) => {
      // ✅ Validate user has access to this org's auction
      const room = `auction:${organizationId}:${auctionId}`;
      socket.join(room);
    });

    socket.on('place_bid', async ({ auctionId, playerId, amount }) => {
      // Validate and process bid
      const result = await processBid(socket.user, auctionId, playerId, amount);
      
      if (result.success) {
        // ✅ Broadcast to all clients in the auction room
        const room = `auction:${result.organizationId}:${auctionId}`;
        io.to(room).emit('bid_update', {
          playerId,
          amount,
          bidder: socket.user.name,
          timestamp: new Date(),
        });
      } else {
        socket.emit('bid_error', { message: result.error });
      }
    });
  });
};
```

### 3. Webhooks — WhatsApp Integration
Best for: Receiving external events (WhatsApp messages, payment notifications)

```javascript
// backend/routes/whatsapp.js
// Webhook receiver pattern

// Verification endpoint (GET)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Message receiver (POST)
router.post('/webhook', async (req, res) => {
  // ✅ ALWAYS respond 200 immediately (WhatsApp requires fast response)
  res.sendStatus(200);
  
  // Process asynchronously
  try {
    const { entry } = req.body;
    for (const e of entry) {
      for (const change of e.changes) {
        if (change.field === 'messages') {
          const phoneNumberId = change.value.metadata.phone_number_id;
          
          // ✅ Resolve tenant from webhook payload
          const org = await resolveWebhookTenant(phoneNumberId);
          if (!org) {
            console.warn(`Unknown phone_number_id: ${phoneNumberId}`);
            continue;
          }
          
          await processMessages(change.value.messages, org);
          
          // ✅ Broadcast via SSE to the correct org
          broadcast(org._id.toString(), 'new_message', {
            messages: change.value.messages,
          });
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Don't re-throw — we already sent 200
  }
});
```

## Event Schema Standard

```javascript
// ✅ All events should follow a consistent schema
const createEvent = (type, organizationId, payload) => ({
  type,              // 'availability.updated', 'message.received', 'bid.placed'
  organizationId,    // Tenant scope
  timestamp: new Date().toISOString(),
  payload,           // Event-specific data
  version: '1.0',    // Event schema version
});

// Examples
createEvent('availability.updated', orgId, {
  matchId, playerId, response: 'yes', updatedBy: 'whatsapp'
});

createEvent('auction.bid.placed', orgId, {
  auctionId, playerId, amount: 50000, bidderTeamId
});

createEvent('match.score.updated', orgId, {
  matchId, innings: 1, runs: 145, wickets: 3, overs: 15.2
});
```

## Reconnection & Resilience

### Client-Side Reconnection
```typescript
// SSE auto-reconnects by default
// For WebSocket, implement exponential backoff
const connectWebSocket = (url: string, maxRetries = 5) => {
  let retries = 0;
  
  const connect = () => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      retries = 0; // Reset on successful connection
    };
    
    ws.onclose = () => {
      if (retries < maxRetries) {
        const delay = Math.min(1000 * 2 ** retries, 30000); // Max 30s
        retries++;
        setTimeout(connect, delay);
      }
    };
    
    return ws;
  };
  
  return connect();
};
```

### Server-Side: Missed Events Queue
```javascript
// For clients that disconnect temporarily
// Store recent events per org for catch-up
const recentEvents = new Map(); // orgId -> event[]

const storeEvent = (orgId, event) => {
  if (!recentEvents.has(orgId)) {
    recentEvents.set(orgId, []);
  }
  const events = recentEvents.get(orgId);
  events.push(event);
  // Keep only last 100 events per org
  if (events.length > 100) events.shift();
};

// Client can request missed events after reconnect
router.get('/events/catch-up', auth, resolveTenant, (req, res) => {
  const since = new Date(req.query.since);
  const events = (recentEvents.get(req.organizationId.toString()) || [])
    .filter(e => new Date(e.timestamp) > since);
  res.json({ success: true, data: events });
});
```

## Choosing the Right Pattern

| Use Case | Pattern | Why |
|----------|---------|-----|
| Dashboard updates (availability, messages) | SSE | One-way, auto-reconnect, simple |
| Live auction bidding | WebSocket | Two-way, low latency, room-based |
| WhatsApp incoming messages | Webhook | External service pushes to us |
| Live score updates | SSE | One-way broadcast to many viewers |
| Chat between players | WebSocket | Two-way, real-time |
| Payment confirmations | Webhook + SSE | Webhook receives, SSE broadcasts |

## Multi-Tenant Rules for Real-Time

1. **ALWAYS scope broadcasts to organizationId** — Never broadcast to all clients
2. **Validate org membership in WebSocket auth** — Not just JWT validity
3. **Resolve tenant in webhooks** — Map external IDs (phone_number_id) to org
4. **Room names include orgId** — `auction:{orgId}:{auctionId}`
5. **Event payloads include orgId** — For client-side filtering

## Checklist — Real-Time Feature

- [ ] Chose correct pattern (SSE vs WebSocket vs Webhook)
- [ ] Events are scoped to organization (no cross-tenant leaks)
- [ ] Client handles reconnection gracefully
- [ ] Server sends heartbeats to keep connections alive
- [ ] Webhook endpoints respond 200 immediately, process async
- [ ] Event schema follows the standard format
- [ ] Mobile app handles background/foreground transitions
- [ ] Rate limiting on WebSocket messages to prevent abuse
