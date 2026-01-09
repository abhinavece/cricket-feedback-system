const request = require('supertest');
const express = require('express');
const {
  connectTestDB,
  disconnectTestDB,
  cleanupTestData,
  createTestUser,
  createTestPlayer
} = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/players', require('../routes/players'));
  return app;
};

describe('Players API', () => {
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

  describe('GET /api/players', () => {
    it('should return all active players', async () => {
      await createTestPlayer();
      await createTestPlayer();

      const res = await request(app)
        .get('/api/players')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should not return inactive players', async () => {
      const activePlayer = await createTestPlayer({ name: 'Test Active Player' });
      await createTestPlayer({ name: 'Test Inactive Player', isActive: false });

      const res = await request(app)
        .get('/api/players')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const playerNames = res.body.map(p => p.name);
      expect(playerNames).toContain(activePlayer.name);
      expect(playerNames).not.toContain('Test Inactive Player');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/players');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      const playerData = {
        name: 'Test New Player',
        phone: `91${Date.now().toString().slice(-10)}`,
        notes: 'Test player notes'
      };

      const res = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${authToken}`)
        .send(playerData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test New Player');
    });

    it('should reject duplicate phone number', async () => {
      const existingPlayer = await createTestPlayer();

      const res = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Duplicate Player',
          phone: existingPlayer.phone
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already exists');
    });
  });

  describe('GET /api/players/:id', () => {
    it('should return a specific player', async () => {
      const player = await createTestPlayer();

      const res = await request(app)
        .get(`/api/players/${player._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(player._id.toString());
    });

    it('should return 404 for non-existent player', async () => {
      const res = await request(app)
        .get('/api/players/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/players/:id', () => {
    it('should update player details', async () => {
      const player = await createTestPlayer();

      const res = await request(app)
        .put(`/api/players/${player._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Updated Player Name', team: 'New Team' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Test Updated Player Name');
      expect(res.body.data.team).toBe('New Team');
    });

    it('should return 404 for non-existent player', async () => {
      const res = await request(app)
        .put('/api/players/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/players/:id', () => {
    it('should soft delete a player', async () => {
      const player = await createTestPlayer();

      const res = await request(app)
        .delete(`/api/players/${player._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify player is not in active list
      const listRes = await request(app)
        .get('/api/players')
        .set('Authorization', `Bearer ${authToken}`);
      
      const playerIds = listRes.body.map(p => p._id);
      expect(playerIds).not.toContain(player._id.toString());
    });

    it('should return 404 for non-existent player', async () => {
      const res = await request(app)
        .delete('/api/players/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
