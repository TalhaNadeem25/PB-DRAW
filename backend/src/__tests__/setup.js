import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGODB_URI = 'mongodb://localhost:27017/pickle-rally-test';
process.env.CLIENT_URL = 'http://localhost:3000';

// Increase test timeout for database operations
jest.setTimeout(10000);

// Global test setup
beforeAll(async () => {
  // Add any global setup here
  console.log('Starting test suite...');
});

// Global test teardown
afterAll(async () => {
  // Add any global cleanup here
  console.log('Test suite completed.');
});
