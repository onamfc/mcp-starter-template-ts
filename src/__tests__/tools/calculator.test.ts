/**
 * Calculator Tool Tests
 * Tests for mathematical calculation functionality
 */

import { calculateTool } from '../../tools/calculator.js';
import { ToolContext } from '../../types/index.js';

const mockContext: ToolContext = {
  requestId: 'test-request-123',
  timestamp: new Date().toISOString(),
};

describe('Calculator Tool', () => {
  describe('Basic operations', () => {
    it('should calculate simple addition', async () => {
      const result = await calculateTool.handler({ expression: '2 + 3' }, mockContext);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Calculation Result: 2 + 3 = 5',
          },
        ],
      });
    });

    it('should calculate complex expressions', async () => {
      const result = await calculateTool.handler(
        { expression: '2 + 3 * 4', precision: 1 },
        mockContext
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Calculation Result: 2 + 3 * 4 = 14',
          },
        ],
      });
    });

    it('should handle decimal precision', async () => {
      const result = await calculateTool.handler(
        { expression: '10 / 3', precision: 3 },
        mockContext
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Calculation Result: 10 / 3 = 3.333',
          },
        ],
      });
    });
  });

  describe('Error handling', () => {
    it('should handle invalid expressions', async () => {
      const result = await calculateTool.handler({ expression: 'invalid expression' }, mockContext);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error:'),
          },
        ],
        isError: true,
      });
    });

    it('should reject dangerous expressions', async () => {
      const result = await calculateTool.handler(
        { expression: 'console.log("hack")' },
        mockContext
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error:'),
          },
        ],
        isError: true,
      });
    });
  });

  describe('Input validation', () => {
    it('should validate required parameters', () => {
      expect(calculateTool.inputSchema.required).toContain('expression');
    });

    it('should have proper schema structure', () => {
      expect(calculateTool.inputSchema.type).toBe('object');
      expect(calculateTool.inputSchema.properties).toHaveProperty('expression');
      expect(calculateTool.inputSchema.properties).toHaveProperty('precision');
    });
  });
});
