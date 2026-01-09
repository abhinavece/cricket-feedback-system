const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  connectTestDB,
  disconnectTestDB,
  cleanupTestData,
  createTestUser,
  generateTestToken
} = require('./setup');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/auth'));
  return app;
};

describe('Auth API', () => {
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
    // Create fresh test user for each test
    const result = await createTestUser();
    testUser = result.user;
    authToken = result.token;
  });

  describe('GET /api/auth/verify', () => {
    it('should verify a valid token and return user data', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.id).toBeDefined();
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/verify');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/users (Admin Only)', () => {
    it('should return all users for admin', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const { token: viewerToken } = await createTestUser({ role: 'viewer' });

      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Admin access required');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/users');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/auth/users/:userId/role (Admin Only)', () => {
    let targetUser;

    beforeEach(async () => {
      const result = await createTestUser({ role: 'viewer' });
      targetUser = result.user;
    });

    it('should update user role', async () => {
      const res = await request(app)
        .put(`/api/auth/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'editor' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('editor');
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .put(`/api/auth/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'superadmin' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid role');
    });

    it('should prevent admin from changing own role', async () => {
      const res = await request(app)
        .put(`/api/auth/users/${testUser._id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'viewer' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot change your own role');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/auth/users/${fakeId}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'editor' });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Test User' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Test User');
    });

    it('should reject empty name', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '   ' });

      expect(res.status).toBe(200);
      // Name should not change if empty/whitespace
      expect(res.body.user.name).toBe(testUser.name);
    });
  });
});
