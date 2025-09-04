/**
 * Test setup and configuration
 * Global test setup that runs before all tests
 */

import { initializeLogger } from '../utils/logger';
import { resetConfigCache } from '../utils/config';

// Mock configuration for testing
const mockConfig = {
  port: 3000,
  host: 'localhost',
  logLevel: 'error' as const, // Suppress logs during testing
  enableHealthCheck: false,
  maxRequestSize: '10mb',
  corsOrigins: ['*'],
  environment: 'test' as const,
};

// Mock the config module
jest.mock('../utils/config', () => ({
  getConfig: jest.fn(() => mockConfig),
  loadConfig: jest.fn(() => mockConfig),
  validateConfig: jest.fn(),
  resetConfigCache: jest.fn(),
  isDevelopment: jest.fn(() => false),
  isProduction: jest.fn(() => false),
  isTest: jest.fn(() => true),
}));

// Mock the logger to prevent actual logging during tests
jest.mock('../utils/logger', () => ({
  initializeLogger: jest.fn(),
  getLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  })),
  log: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    withContext: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

// Global test setup
beforeEach(() => {
  // Reset any cached state
  resetConfigCache();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Suppress console output during tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console
  jest.restoreAllMocks();
});

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});