/**
 * MCP Server Tests
 * Comprehensive tests for the main server functionality
 */

import { MCPServer } from '../server-core.js';
import { getConfig } from '../utils/config.js';
import { initializeLogger } from '../utils/logger.js';

// Mock the config and logger
jest.mock('../utils/config');
jest.mock('../utils/logger');

const mockConfig = {
  port: 3000,
  host: 'localhost',
  logLevel: 'info' as const,
  enableHealthCheck: true,
  maxRequestSize: '10mb',
  corsOrigins: ['*'],
  environment: 'test' as const,
};

describe('MCPServer', () => {
  beforeEach(() => {
    (getConfig as jest.Mock).mockReturnValue(mockConfig);
    (initializeLogger as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create server instance without errors', () => {
      expect(() => new MCPServer()).not.toThrow();
    });

    it('should initialize logger with config', () => {
      new MCPServer();
      expect(initializeLogger).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('Server lifecycle', () => {
    it('should have start method', () => {
      const server = new MCPServer();
      expect(typeof server.start).toBe('function');
    });
  });
});
