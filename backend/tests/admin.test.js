const request = require('supertest');
const express = require('express');
const {
  connectTestDB,
  disconnectTestDB,
  cleanupTestData
} = require('./setup');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', require('../routes/admin'));
  return app;
};

describe('Admin API', () => {
  let app;

  beforeAll(async () => {
    await connectTestDB();
    app = createTestApp();
  });

  afterAll(async () => {
    await cleanupTestData();
    await disconnectTestDB();
  });

  describe('POST /api/admin/authenticate', () => {
    const adminPassword = process.env.ADMIN_PASSWORD || 'cricket123';

    it('should authenticate with correct password', async () => {
      const res = await request(app)
        .post('/api/admin/authenticate')
        .send({ password: adminPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Authentication successful');
    });

    it('should reject incorrect password', async () => {
      const res = await request(app)
        .post('/api/admin/authenticate')
        .send({ password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid admin password');
    });

    it('should reject empty password', async () => {
      const res = await request(app)
        .post('/api/admin/authenticate')
        .send({ password: '' });

      expect(res.status).toBe(401);
    });

    it('should reject missing password', async () => {
      const res = await request(app)
        .post('/api/admin/authenticate')
        .send({});

      expect(res.status).toBe(401);
    });
  });
});
