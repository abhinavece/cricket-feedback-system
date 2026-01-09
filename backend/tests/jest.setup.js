// Jest setup file - runs before each test file
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket_feedback_test';

// Suppress console logs during tests (optional - comment out to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  generateRandomPhone: () => `91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
  generateTestEmail: () => `test-${Date.now()}@test.com`
};
