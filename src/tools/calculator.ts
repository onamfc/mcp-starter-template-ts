/**
 * Calculator Tool
 * Provides basic mathematical operations and calculations
 */

import { ToolDefinition, ToolContext } from '../types/index.js';
import { log } from '../utils/logger.js';

/**
 * Calculator tool implementation
 */
export const calculateTool: ToolDefinition = {
  name: 'calculator',
  description: 'Perform mathematical calculations with support for basic arithmetic operations',
  inputSchema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")',
      },
      precision: {
        type: 'number',
        description: 'Number of decimal places for the result (default: 2)',
        default: 2,
      },
    },
    required: ['expression'],
  },
  handler: async (args: Record<string, unknown>, context: ToolContext) => {
    const { expression, precision = 2 } = args as {
      expression: string;
      precision?: number;
    };

    try {
      log.withContext(context.requestId).info('Calculating expression', {
        expression,
        precision,
      });

      // Sanitize the expression to prevent code injection
      const sanitizedExpression = sanitizeExpression(expression);

      // Evaluate the expression safely
      const result = evaluateExpression(sanitizedExpression);

      // Format result with specified precision
      const formattedResult =
        typeof precision === 'number' ? Number(result.toFixed(precision)) : result;

      log.withContext(context.requestId).info('Calculation completed', {
        expression: sanitizedExpression,
        result: formattedResult,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Calculation Result: ${expression} = ${formattedResult}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';

      log
        .withContext(context.requestId)
        .error('Calculation failed', error instanceof Error ? error : new Error(String(error)), {
          expression,
        });

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};

/**
 * Sanitize mathematical expression to prevent code injection
 */
function sanitizeExpression(expression: string): string {
  // Allow only numbers, basic operators, parentheses, and decimal points
  const allowedChars = /^[0-9+\-*/().\s]+$/;

  if (!allowedChars.test(expression)) {
    throw new Error(
      'Invalid characters in expression. Only numbers and basic operators (+, -, *, /, (, )) are allowed.'
    );
  }

  return expression.trim();
}

/**
 * Safely evaluate mathematical expression
 */
function evaluateExpression(expression: string): number {
  try {
    // Use Function constructor for safer evaluation than eval
    // This is still potentially dangerous in production - consider using a math parser library
    const result = new Function(`"use strict"; return (${expression})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid calculation result');
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to evaluate expression: ${expression}`);
  }
}
