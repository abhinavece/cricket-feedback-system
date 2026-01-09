const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Test database connection
const connectTestDB = async () => {
  const mongoUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket_feedback_test';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
    console.log('Connected to test database');
  }
};

const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('Disconnected from test database');
  }
};

// Clean up test data - only cleans test-specific data, not production
const cleanupTestData = async () => {
  const collections = ['users', 'players', 'matches', 'feedbacks', 'availabilities', 'messages'];
  
  for (const collection of collections) {
    if (mongoose.connection.collections[collection]) {
      // Only delete test data (items created by tests)
      await mongoose.connection.collections[collection].deleteMany({
        $or: [
          { email: { $regex: /^test.*@test\.com$/ } },
          { name: { $regex: /^Test / } },
          { matchId: { $regex: /^TEST-/ } },
          { playerName: { $regex: /^Test / } },
          { isTestData: true }
        ]
      });
    }
  }
};

// Generate test JWT token
const generateTestToken = (userId, email = 'test@test.com', role = 'admin') => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

// Create test user directly in DB
const createTestUser = async (overrides = {}) => {
  const User = require('../models/User');
  
  const defaultUser = {
    googleId: `test-google-id-${Date.now()}`,
    email: `test-${Date.now()}@test.com`,
    name: 'Test User',
    avatar: 'https://example.com/avatar.png',
    role: 'admin',
    isActive: true,
    lastLogin: new Date()
  };

  const user = new User({ ...defaultUser, ...overrides });
  await user.save();
  
  const token = generateTestToken(user._id, user.email, user.role);
  
  return { user, token };
};

// Create test player directly in DB
const createTestPlayer = async (overrides = {}) => {
  const Player = require('../models/Player');
  
  const defaultPlayer = {
    name: `Test Player ${Date.now()}`,
    phone: `91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    role: 'player',
    team: 'Test Team',
    isActive: true,
    notes: 'Test player for automated testing'
  };

  const player = new Player({ ...defaultPlayer, ...overrides });
  await player.save();
  
  return player;
};

// Create test match directly in DB
const createTestMatch = async (createdBy, overrides = {}) => {
  const Match = require('../models/Match');
  
  const defaultMatch = {
    matchId: `TEST-${Date.now()}`,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    slot: 'morning',
    ground: 'Test Ground',
    time: '09:00',
    opponent: 'Test Opponent',
    createdBy: createdBy,
    status: 'draft', // Valid enum: draft, confirmed, cancelled, completed
    squad: []
  };

  const match = new Match({ ...defaultMatch, ...overrides });
  await match.save();
  
  return match;
};

// Create test feedback directly in DB
const createTestFeedback = async (overrides = {}) => {
  const Feedback = require('../models/Feedback');
  
  const defaultFeedback = {
    playerName: `Test Player ${Date.now()}`,
    matchDate: new Date(),
    batting: 4,
    bowling: 3,
    fielding: 4,
    teamSpirit: 5,
    feedbackText: 'Test feedback for automated testing',
    issues: {
      venue: false,
      equipment: false,
      timing: false,
      umpiring: false,
      other: false
    },
    additionalComments: 'Test comments',
    isTestData: true
  };

  const feedback = new Feedback({ ...defaultFeedback, ...overrides });
  await feedback.save();
  
  return feedback;
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  cleanupTestData,
  generateTestToken,
  createTestUser,
  createTestPlayer,
  createTestMatch,
  createTestFeedback
};
