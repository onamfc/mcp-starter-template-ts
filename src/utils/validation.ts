/**
 * Input validation utilities
 * Provides reusable validation functions for common input patterns
 */

import { z } from 'zod';
import { ValidationErrorDetail } from '../types/index.js';

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  /**
   * Non-empty string validation
   */
  nonEmptyString: z.string().min(1, 'Value cannot be empty'),

  /**
   * Positive number validation
   */
  positiveNumber: z.number().positive('Value must be positive'),

  /**
   * File path validation (basic security check)
   */
  filePath: z
    .string()
    .min(1, 'File path cannot be empty')
    .refine(
      path => !path.includes('..') && !path.startsWith('/'),
      'Invalid file path: no parent directory traversal or absolute paths allowed'
    ),

  /**
   * Email validation
   */
  email: z.string().email('Invalid email format'),

  /**
   * URL validation
   */
  url: z.string().url('Invalid URL format'),
};

/**
 * Validate input against a Zod schema and return formatted errors
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: ValidationErrorDetail[] } {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationErrorDetail[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: err.path.reduce((obj: any, key) => obj?.[key], input as any),
      }));
      return { success: false, errors };
    }

    // Re-throw non-validation errors
    throw error;
  }
}

/**
 * Sanitize string input to prevent basic injection attacks
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Validate and sanitize file path for secure file operations
 */
export function validateFilePath(path: string): string {
  const validation = validateInput(CommonSchemas.filePath, path);

  if (!validation.success) {
    throw new Error(`Invalid file path: ${validation.errors[0]?.message}`);
  }

  // Additional sanitization
  return path.replace(/[^a-zA-Z0-9.\-_/]/g, '');
}

/**
 * Create a validation middleware for tool parameters
 */
export function createToolValidator<T>(schema: z.ZodSchema<T>) {
  return (input: unknown): T => {
    const validation = validateInput(schema, input);

    if (!validation.success) {
      const errorMessage = validation.errors.map(err => `${err.field}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }

    return validation.data;
  };
}

/**
 * Validation schema for tool arguments
 */
export const ToolArgumentsSchema = z.object({
  name: CommonSchemas.nonEmptyString,
  parameters: z.record(z.unknown()).optional(),
});

/**
 * Validation schema for resource URIs
 */
export const ResourceUriSchema = z
  .string()
  .min(1, 'Resource URI cannot be empty')
  .refine(
    uri => uri.startsWith('resource://') || uri.startsWith('file://'),
    'Resource URI must start with resource:// or file://'
  );
