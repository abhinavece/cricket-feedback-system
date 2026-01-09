const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const {
  connectTestDB,
  disconnectTestDB,
  cleanupTestData,
  createTestUser,
  createTestMatch,
  createTestPlayer
} = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/availability', require('../routes/availability'));
  return app;
};

// Helper to create availability record
const createTestAvailability = async (matchId, playerId, overrides = {}) => {
  const Availability = require('../models/Availability');
  
  const defaultAvailability = {
    matchId,
    playerId,
    playerName: 'Test Player',
    playerPhone: '919876543210',
    response: 'pending',
    status: 'sent'
  };

  const availability = new Availability({ ...defaultAvailability, ...overrides });
  await availability.save();
  return availability;
};

describe('Availability API', () => {
  let app;
  let testUser;
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
    testUser = result.user;
    authToken = result.token;
  });

  describe('GET /api/availability/match/:matchId', () => {
    it('should return availability records for a match', async () => {
      const match = await createTestMatch(testUser._id);
      const player = await createTestPlayer();
      await createTestAvailability(match._id, player._id, { response: 'yes' });
      await createTestAvailability(match._id, (await createTestPlayer())._id, { response: 'no' });

      const res = await request(app)
        .get(`/api/availability/match/${match._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.confirmed).toBeGreaterThanOrEqual(1);
      expect(res.body.stats.declined).toBeGreaterThanOrEqual(1);
    });

    it('should reject unauthenticated request', async () => {
      const match = await createTestMatch(testUser._id);

      const res = await request(app)
        .get(`/api/availability/match/${match._id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/availability/player/:playerId', () => {
    it('should return availability history for a player', async () => {
      const player = await createTestPlayer();
      const match1 = await createTestMatch(testUser._id);
      const match2 = await createTestMatch(testUser._id);
      
      await createTestAvailability(match1._id, player._id, { response: 'yes', status: 'responded' });
      await createTestAvailability(match2._id, player._id, { response: 'no', status: 'responded' });

      const res = await request(app)
        .get(`/api/availability/player/${player._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /api/availability', () => {
    it('should create availability records for players', async () => {
      const match = await createTestMatch(testUser._id);
      const player1 = await createTestPlayer();
      const player2 = await createTestPlayer();

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          matchId: match._id,
          playerIds: [player1._id, player2._id]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should reject request without matchId', async () => {
      const player = await createTestPlayer();

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ playerIds: [player._id] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should return 404 for non-existent match', async () => {
      const player = await createTestPlayer();

      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          matchId: '507f1f77bcf86cd799439011',
          playerIds: [player._id]
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Match not found');
    });

    it('should not create duplicate availability records', async () => {
      const match = await createTestMatch(testUser._id);
      const player = await createTestPlayer();
      
      // Create initial availability
      await createTestAvailability(match._id, player._id);

      // Try to create duplicate
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          matchId: match._id,
          playerIds: [player._id]
        });

      expect(res.status).toBe(200);
      // Should return existing record, not create new one
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('PUT /api/availability/:id', () => {
    it('should update availability response', async () => {
      const match = await createTestMatch(testUser._id);
      const player = await createTestPlayer();
      const availability = await createTestAvailability(match._id, player._id);

      const res = await request(app)
        .put(`/api/availability/${availability._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ response: 'yes' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.response).toBe('yes');
      expect(res.body.data.status).toBe('responded');
    });

    it('should reject invalid response value', async () => {
      const match = await createTestMatch(testUser._id);
      const player = await createTestPlayer();
      const availability = await createTestAvailability(match._id, player._id);

      const res = await request(app)
        .put(`/api/availability/${availability._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ response: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Valid response');
    });

    it('should return 404 for non-existent availability', async () => {
      const res = await request(app)
        .put('/api/availability/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ response: 'yes' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/availability/:id', () => {
    it('should delete availability record', async () => {
      const match = await createTestMatch(testUser._id);
      const player = await createTestPlayer();
      const availability = await createTestAvailability(match._id, player._id);

      const res = await request(app)
        .delete(`/api/availability/${availability._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent availability', async () => {
      const res = await request(app)
        .delete('/api/availability/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/availability/stats/summary', () => {
    it('should return overall availability statistics', async () => {
      const match = await createTestMatch(testUser._id);
      const player1 = await createTestPlayer();
      const player2 = await createTestPlayer();
      
      await createTestAvailability(match._id, player1._id, { response: 'yes', status: 'responded' });
      await createTestAvailability(match._id, player2._id, { response: 'no', status: 'responded' });

      const res = await request(app)
        .get('/api/availability/stats/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRecords).toBeDefined();
      expect(res.body.data.responded).toBeDefined();
      expect(res.body.data.responseRate).toBeDefined();
    });
  });
});
