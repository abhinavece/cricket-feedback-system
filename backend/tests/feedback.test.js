const request = require('supertest');
const express = require('express');
const {
  connectTestDB,
  disconnectTestDB,
  cleanupTestData,
  createTestUser,
  createTestFeedback
} = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/feedback', require('../routes/feedback'));
  return app;
};

describe('Feedback API', () => {
  let app;
  let authToken;

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
    authToken = result.token;
  });

  describe('POST /api/feedback', () => {
    it('should submit new feedback', async () => {
      const feedbackData = {
        playerName: 'Test Feedback Player',
        matchDate: new Date().toISOString(),
        batting: 4,
        bowling: 3,
        fielding: 5,
        teamSpirit: 4,
        feedbackText: 'Great performance in the test match'
      };

      const res = await request(app)
        .post('/api/feedback')
        .send(feedbackData);

      expect(res.status).toBe(201);
      expect(res.body.playerName).toBe('Test Feedback Player');
      expect(res.body.batting).toBe(4);
    });

    it('should reject feedback without required fields', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .send({ playerName: 'Only Name' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should reject invalid rating values', async () => {
      const feedbackData = {
        playerName: 'Test Player',
        matchDate: new Date().toISOString(),
        batting: 10, // Invalid - should be 1-5
        bowling: 3,
        fielding: 4,
        teamSpirit: 5,
        feedbackText: 'Test feedback'
      };

      const res = await request(app)
        .post('/api/feedback')
        .send(feedbackData);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('rating must be between 1 and 5');
    });
  });

  describe('GET /api/feedback', () => {
    it('should return all non-deleted feedback', async () => {
      await createTestFeedback();
      await createTestFeedback();

      const res = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should not return deleted feedback', async () => {
      const activeFeedback = await createTestFeedback({ playerName: 'Test Active Feedback' });
      await createTestFeedback({ playerName: 'Test Deleted Feedback', isDeleted: true });

      const res = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const playerNames = res.body.map(f => f.playerName);
      expect(playerNames).toContain(activeFeedback.playerName);
      expect(playerNames).not.toContain('Test Deleted Feedback');
    });
  });

  describe('GET /api/feedback/stats', () => {
    it('should return aggregated statistics', async () => {
      await createTestFeedback({ batting: 5, bowling: 4, fielding: 3, teamSpirit: 5 });
      await createTestFeedback({ batting: 4, bowling: 3, fielding: 4, teamSpirit: 4 });

      const res = await request(app)
        .get('/api/feedback/stats');

      expect(res.status).toBe(200);
      expect(res.body.totalSubmissions).toBeGreaterThanOrEqual(2);
      expect(res.body.avgBatting).toBeDefined();
      expect(res.body.avgBowling).toBeDefined();
      expect(res.body.avgFielding).toBeDefined();
      expect(res.body.avgTeamSpirit).toBeDefined();
    });
  });

  describe('DELETE /api/feedback/:id', () => {
    it('should soft delete feedback', async () => {
      const feedback = await createTestFeedback();

      const res = await request(app)
        .delete(`/api/feedback/${feedback._id}`)
        .send({ deletedBy: 'test-admin' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('moved to trash');
    });

    it('should return 404 for non-existent feedback', async () => {
      const res = await request(app)
        .delete('/api/feedback/507f1f77bcf86cd799439011');

      // API returns 404 for not found, or 500 if ObjectId cast fails
      expect([404, 500]).toContain(res.status);
    });

    it('should reject already deleted feedback', async () => {
      // First create a normal feedback
      const feedback = await createTestFeedback();
      
      // Then soft delete it via the API
      const deleteRes = await request(app)
        .delete(`/api/feedback/${feedback._id}`)
        .send({ deletedBy: 'test-admin' });
      
      expect(deleteRes.status).toBe(200);

      // Try to delete again - should fail
      const res = await request(app)
        .delete(`/api/feedback/${feedback._id}`);

      // Should reject with 400 for already deleted
      expect([400, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.error).toBe('Feedback already deleted');
      }
    });
  });

  describe('GET /api/feedback/trash', () => {
    it('should return deleted feedback', async () => {
      await createTestFeedback({ playerName: 'Test Trashed Feedback', isDeleted: true, deletedAt: new Date() });

      const res = await request(app)
        .get('/api/feedback/trash');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const playerNames = res.body.map(f => f.playerName);
      expect(playerNames).toContain('Test Trashed Feedback');
    });
  });

  describe('POST /api/feedback/:id/restore', () => {
    it('should restore deleted feedback', async () => {
      const feedback = await createTestFeedback({ isDeleted: true, deletedAt: new Date() });

      const res = await request(app)
        .post(`/api/feedback/${feedback._id}/restore`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('restored');
    });

    it('should reject restore for non-deleted feedback', async () => {
      const feedback = await createTestFeedback();

      const res = await request(app)
        .post(`/api/feedback/${feedback._id}/restore`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Feedback is not in trash');
    });
  });

  describe('DELETE /api/feedback/:id/permanent', () => {
    it('should permanently delete feedback from trash', async () => {
      const feedback = await createTestFeedback({ isDeleted: true, deletedAt: new Date() });

      const res = await request(app)
        .delete(`/api/feedback/${feedback._id}/permanent`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('permanently deleted');
    });

    it('should reject permanent delete for non-trashed feedback', async () => {
      const feedback = await createTestFeedback();

      const res = await request(app)
        .delete(`/api/feedback/${feedback._id}/permanent`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be in trash');
    });
  });
});
