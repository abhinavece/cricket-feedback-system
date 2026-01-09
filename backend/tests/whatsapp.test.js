const request = require('supertest');
const express = require('express');
const {
  connectTestDB,
  disconnectTestDB,
  cleanupTestData,
  createTestUser,
  createTestPlayer,
  createTestMatch
} = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/whatsapp', require('../routes/whatsapp'));
  return app;
};

// Helper to create test message
const createTestMessage = async (overrides = {}) => {
  const Message = require('../models/Message');
  
  const defaultMessage = {
    from: '919876543210',
    to: 'test-phone-id',
    text: 'Test message',
    direction: 'outgoing',
    messageId: `msg_${Date.now()}`,
    timestamp: new Date(),
    messageType: 'general'
  };

  const message = new Message({ ...defaultMessage, ...overrides });
  await message.save();
  return message;
};

describe('WhatsApp API', () => {
  let app;
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectTestDB();
    app = createTestApp();
  });

  afterAll(async () => {
    await cleanupTestData();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    const result = await createTestUser();
    testUser = result.user;
    authToken = result.token;
  });

  describe('GET /api/whatsapp/webhook (Webhook Verification)', () => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mavericks-xi-verify-token-2024';

    it('should verify webhook with correct token', async () => {
      const challenge = 'test-challenge-123';

      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': challenge
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe(challenge);
    });

    it('should reject webhook with incorrect token', async () => {
      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': 'test-challenge'
        });

      expect(res.status).toBe(403);
    });

    it('should return 404 for missing parameters', async () => {
      const res = await request(app)
        .get('/api/whatsapp/webhook');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/whatsapp/webhook (Receive Messages)', () => {
    it('should accept valid WhatsApp webhook payload', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            field: 'messages',
            value: {
              messages: [{
                from: '919876543210',
                type: 'text',
                text: { body: 'Yes' },
                id: `test_msg_${Date.now()}`
              }],
              contacts: [{ wa_id: '919876543210', profile: { name: 'Test User' } }]
            }
          }]
        }]
      };

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.text).toBe('EVENT_RECEIVED');
    });

    it('should handle button response messages', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            field: 'messages',
            value: {
              messages: [{
                from: '919876543210',
                type: 'button',
                button: { text: 'Yes' },
                id: `test_btn_${Date.now()}`
              }],
              contacts: []
            }
          }]
        }]
      };

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .send(webhookPayload);

      expect(res.status).toBe(200);
    });

    it('should handle interactive response messages', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            field: 'messages',
            value: {
              messages: [{
                from: '919876543210',
                type: 'interactive',
                interactive: {
                  type: 'button_reply',
                  button_reply: { title: 'Available' }
                },
                id: `test_int_${Date.now()}`
              }],
              contacts: []
            }
          }]
        }]
      };

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .send(webhookPayload);

      expect(res.status).toBe(200);
    });

    it('should ignore non-WhatsApp objects', async () => {
      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .send({ object: 'instagram', entry: [] });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/whatsapp/messages/:phone', () => {
    it('should return message history for a phone number', async () => {
      const phone = '919876543210';
      await createTestMessage({ from: phone, direction: 'incoming' });
      await createTestMessage({ to: phone, direction: 'outgoing' });

      const res = await request(app)
        .get(`/api/whatsapp/messages/${phone}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle phone number formatting', async () => {
      // Store with full format
      await createTestMessage({ from: '919876543210', direction: 'incoming' });

      // Query with different format
      const res = await request(app)
        .get('/api/whatsapp/messages/9876543210')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/whatsapp/messages/919876543210');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/whatsapp/send', () => {
    it('should reject request without player IDs', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Test message' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Player IDs are required');
    });

    it('should reject empty player IDs array', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ playerIds: [], message: 'Test message' });

      expect(res.status).toBe(400);
    });

    it('should handle non-existent players gracefully', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          playerIds: ['507f1f77bcf86cd799439011'],
          message: 'Test message'
        });

      // Should return success but with 0 sent (player not found)
      expect(res.status).toBe(200);
      expect(res.body.data.sent).toBe(0);
    });
  });

  describe('POST /api/whatsapp/send-reminder', () => {
    it('should reject request without matchId', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Match ID is required');
    });

    it('should return 404 for non-existent match', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ matchId: '507f1f77bcf86cd799439011' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Match not found');
    });

    it('should handle match with all players responded', async () => {
      const match = await createTestMatch(testUser._id);

      const res = await request(app)
        .post('/api/whatsapp/send-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ matchId: match._id });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('All players have already responded');
    });
  });
});
