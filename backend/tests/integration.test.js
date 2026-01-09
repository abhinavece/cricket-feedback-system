const request = require('supertest');
const express = require('express');
const {
  connectTestDB,
  disconnectTestDB,
  cleanupTestData,
  createTestUser,
  createTestPlayer,
  createTestMatch,
  createTestFeedback
} = require('./setup');

// Full integration test app with all routes
const createFullApp = () => {
  const app = express();
  app.use(express.json());
  
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/admin', require('../routes/admin'));
  app.use('/api/players', require('../routes/players'));
  app.use('/api/matches', require('../routes/matches'));
  app.use('/api/availability', require('../routes/availability'));
  app.use('/api/feedback', require('../routes/feedback'));
  app.use('/api/whatsapp', require('../routes/whatsapp'));
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
  
  return app;
};

describe('Integration Tests - Complete User Flows', () => {
  let app;
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    await connectTestDB();
    app = createFullApp();
  });

  afterAll(async () => {
    await cleanupTestData();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    const result = await createTestUser({ role: 'admin' });
    adminUser = result.user;
    adminToken = result.token;
  });

  describe('Flow 1: Complete Match Management Workflow', () => {
    it('should handle full match lifecycle', async () => {
      // Step 1: Create players using helper (API tested separately)
      const player1 = await createTestPlayer({ name: 'Test Player Flow 1' });
      const player2 = await createTestPlayer({ name: 'Test Player Flow 2' });
      
      expect(player1._id).toBeDefined();
      expect(player2._id).toBeDefined();

      // Step 2: Create a match using helper (API tested separately)
      const match = await createTestMatch(adminUser._id, {
        ground: 'Integration Test Ground',
        opponent: 'Test Opponent XI'
      });

      // Step 3: Create availability records via API
      const availRes = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          matchId: match._id.toString(),
          playerIds: [player1._id.toString(), player2._id.toString()]
        });
      expect(availRes.status).toBe(200);
      expect(availRes.body.data.length).toBe(2);

      // Step 4: Update availability response
      const availId = availRes.body.data[0]._id;
      const updateRes = await request(app)
        .put(`/api/availability/${availId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ response: 'yes' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.response).toBe('yes');

      // Step 5: Check match availability stats
      const statsRes = await request(app)
        .get(`/api/availability/match/${match._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(statsRes.status).toBe(200);
      expect(statsRes.body.stats.confirmed).toBeGreaterThanOrEqual(1);

      // Step 6: Verify match can be retrieved
      const getMatchRes = await request(app)
        .get(`/api/matches/${match._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getMatchRes.status).toBe(200);
      expect(getMatchRes.body._id).toBe(match._id.toString());
    });
  });

  describe('Flow 2: Feedback Submission and Management', () => {
    it('should handle feedback submission and admin actions', async () => {
      // Step 1: Submit feedback (no auth required)
      const feedbackRes = await request(app)
        .post('/api/feedback')
        .send({
          playerName: 'Test Integration Player',
          matchDate: new Date().toISOString(),
          batting: 4,
          bowling: 3,
          fielding: 5,
          teamSpirit: 4,
          feedbackText: 'Integration test feedback'
        });
      expect(feedbackRes.status).toBe(201);
      const feedback = feedbackRes.body;

      // Step 2: Admin retrieves feedback list
      const listRes = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.some(f => f._id === feedback._id)).toBe(true);

      // Step 3: Check feedback stats
      const statsRes = await request(app)
        .get('/api/feedback/stats');
      expect(statsRes.status).toBe(200);
      expect(statsRes.body.totalSubmissions).toBeGreaterThanOrEqual(1);

      // Step 4: Soft delete feedback
      const deleteRes = await request(app)
        .delete(`/api/feedback/${feedback._id}`)
        .send({ deletedBy: 'integration-test' });
      expect(deleteRes.status).toBe(200);

      // Step 5: Verify it's in trash
      const trashRes = await request(app)
        .get('/api/feedback/trash');
      expect(trashRes.status).toBe(200);
      expect(trashRes.body.some(f => f._id === feedback._id)).toBe(true);

      // Step 6: Restore feedback
      const restoreRes = await request(app)
        .post(`/api/feedback/${feedback._id}/restore`);
      expect(restoreRes.status).toBe(200);

      // Step 7: Permanently delete
      await request(app)
        .delete(`/api/feedback/${feedback._id}`);
      await request(app)
        .delete(`/api/feedback/${feedback._id}/permanent`);
    });
  });

  describe('Flow 3: User Role Management', () => {
    it('should handle admin managing user roles', async () => {
      // Step 1: Verify admin token works
      const verifyRes = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.user.role).toBe('admin');

      // Step 2: Create a viewer user
      const { user: viewerUser, token: viewerToken } = await createTestUser({ role: 'viewer' });

      // Step 3: Viewer tries to access users list (should fail)
      const viewerListRes = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(viewerListRes.status).toBe(403);

      // Step 4: Admin gets user list
      const adminListRes = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminListRes.status).toBe(200);

      // Step 5: Admin promotes viewer to editor
      const promoteRes = await request(app)
        .put(`/api/auth/users/${viewerUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'editor' });
      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.user.role).toBe('editor');
    });
  });

  describe('Flow 4: WhatsApp Webhook Integration', () => {
    it('should handle WhatsApp message flow', async () => {
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mavericks-xi-verify-token-2024';

      // Step 1: Webhook verification
      const verifyRes = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': 'test-challenge'
        });
      expect(verifyRes.status).toBe(200);

      // Step 2: Simulate incoming message
      const webhookRes = await request(app)
        .post('/api/whatsapp/webhook')
        .send({
          object: 'whatsapp_business_account',
          entry: [{
            changes: [{
              field: 'messages',
              value: {
                messages: [{
                  from: '919876543210',
                  type: 'text',
                  text: { body: 'Integration test message' },
                  id: `int_test_${Date.now()}`
                }],
                contacts: []
              }
            }]
          }]
        });
      expect(webhookRes.status).toBe(200);

      // Step 3: Check message history (need to wait a bit for async processing)
      await global.testUtils.sleep(500);
      
      const historyRes = await request(app)
        .get('/api/whatsapp/messages/919876543210')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(historyRes.status).toBe(200);
    });
  });

  describe('Flow 5: Health Check', () => {
    it('should verify system health', async () => {
      const res = await request(app)
        .get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
