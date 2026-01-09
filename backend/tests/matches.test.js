const request = require('supertest');
const express = require('express');
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
  app.use('/api/matches', require('../routes/matches'));
  return app;
};

describe('Matches API', () => {
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

  describe('GET /api/matches', () => {
    it('should return paginated matches', async () => {
      // Create some test matches
      await createTestMatch(testUser._id);
      await createTestMatch(testUser._id);

      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.matches).toBeDefined();
      expect(Array.isArray(res.body.matches)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.current).toBeDefined();
    });

    it('should filter by status', async () => {
      await createTestMatch(testUser._id, { status: 'completed' });
      await createTestMatch(testUser._id, { status: 'draft' });

      const res = await request(app)
        .get('/api/matches?status=draft')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.matches.forEach(match => {
        if (match.matchId.startsWith('TEST-')) {
          expect(match.status).toBe('draft');
        }
      });
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/matches');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/matches', () => {
    it('should create a new match', async () => {
      const matchData = {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        slot: 'morning',
        ground: 'Test Stadium',
        time: '10:00',
        opponent: 'Test Opponent Team'
      };

      const res = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(matchData);

      expect(res.status).toBe(201);
      expect(res.body.matchId).toBeDefined();
      expect(res.body.ground).toBe('Test Stadium');
      expect(res.body.opponent).toBe('Test Opponent Team');
    });

    it('should reject match without required fields', async () => {
      const res = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ opponent: 'Only Opponent' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });
  });

  describe('GET /api/matches/:id', () => {
    it('should return a single match', async () => {
      const match = await createTestMatch(testUser._id);

      const res = await request(app)
        .get(`/api/matches/${match._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(match._id.toString());
    });

    it('should return 404 for non-existent match', async () => {
      const res = await request(app)
        .get('/api/matches/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/matches/:id', () => {
    it('should update match details', async () => {
      const match = await createTestMatch(testUser._id);

      const res = await request(app)
        .put(`/api/matches/${match._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ opponent: 'Updated Opponent', status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.opponent).toBe('Updated Opponent');
      expect(res.body.status).toBe('completed');
    });

    it('should return 404 for non-existent match', async () => {
      const res = await request(app)
        .put('/api/matches/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ opponent: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/matches/:id/squad/:playerId', () => {
    it('should update player squad response', async () => {
      const player = await createTestPlayer();
      const match = await createTestMatch(testUser._id, {
        squad: [{ player: player._id, response: 'pending' }]
      });

      const res = await request(app)
        .put(`/api/matches/${match._id}/squad/${player._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ response: 'yes' });

      expect(res.status).toBe(200);
      const updatedPlayer = res.body.squad.find(
        s => s.player._id === player._id.toString()
      );
      expect(updatedPlayer.response).toBe('yes');
    });

    it('should reject invalid response', async () => {
      const player = await createTestPlayer();
      const match = await createTestMatch(testUser._id, {
        squad: [{ player: player._id, response: 'pending' }]
      });

      const res = await request(app)
        .put(`/api/matches/${match._id}/squad/${player._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ response: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid response');
    });
  });

  describe('DELETE /api/matches/:id', () => {
    it('should delete a match', async () => {
      const match = await createTestMatch(testUser._id);

      const res = await request(app)
        .delete(`/api/matches/${match._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Match deleted successfully');

      // Verify match is deleted
      const getRes = await request(app)
        .get(`/api/matches/${match._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('GET /api/matches/:id/stats', () => {
    it('should return match statistics', async () => {
      const player1 = await createTestPlayer();
      const player2 = await createTestPlayer();
      const match = await createTestMatch(testUser._id, {
        squad: [
          { player: player1._id, response: 'yes' },
          { player: player2._id, response: 'no' }
        ]
      });

      const res = await request(app)
        .get(`/api/matches/${match._id}/stats`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.yes).toBe(1);
      expect(res.body.no).toBe(1);
      expect(res.body.responseRate).toBeDefined();
    });
  });
});
