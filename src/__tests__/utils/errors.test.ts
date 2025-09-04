/**
 * Error Handling Tests
 * Tests for error utilities and custom error classes
 */

import {
  MCPError,
  ValidationError,
  ToolExecutionError,
  ResourceAccessError,
  createErrorResponse,
  generateRequestId,
  getErrorMessage,
} from '../../utils/errors.js';

describe('Error Handling', () => {
  describe('Custom Error Classes', () => {
    it('should create MCPError with default values', () => {
      const error = new MCPError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('MCP_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('MCPError');
    });

    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid input', { field: 'name' });
      
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'name' });
    });

    it('should create ToolExecutionError', () => {
      const error = new ToolExecutionError('Tool failed', 'calculate');
      
      expect(error.message).toBe('Tool failed');
      expect(error.code).toBe('TOOL_EXECUTION_ERROR');
      expect(error.details).toEqual({ toolName: 'calculate' });
    });

    it('should create ResourceAccessError', () => {
      const error = new ResourceAccessError('Access denied', 'resource://test');
      
      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('RESOURCE_ACCESS_ERROR');
      expect(error.details).toEqual({ resourceUri: 'resource://test' });
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response for MCPError', () => {
      const error = new ValidationError('Test validation error');
      const response = createErrorResponse(error, 'test-request');

      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('Test validation error');
      expect(response.error.timestamp).toBeDefined();
    });

    it('should create error response for generic Error', () => {
      const error = new Error('Generic error');
      const response = createErrorResponse(error, 'test-request');

      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe('Generic error');
      expect(response.error.details).toHaveProperty('stack');
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown error types', () => {
      expect(getErrorMessage({ unknown: 'object' })).toBe('Unknown error occurred');
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
    });
  });
});