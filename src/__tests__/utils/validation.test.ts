/**
 * Validation Utilities Tests
 * Tests for input validation and sanitization functions
 */

import { validateInput, sanitizeString, validateFilePath, CommonSchemas } from '../../utils/validation';
import { z } from 'zod';

describe('Validation Utilities', () => {
  describe('validateInput', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    it('should validate correct input', () => {
      const result = validateInput(testSchema, { name: 'John', age: 30 });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John', age: 30 });
      }
    });

    it('should return errors for invalid input', () => {
      const result = validateInput(testSchema, { name: '', age: -1 });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(2);
        expect(result.errors[0].field).toBe('name');
        expect(result.errors[1].field).toBe('age');
      }
    });
  });

  describe('sanitizeString', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      
      expect(result).toBe('scriptalert(xss)/script');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeString(input);
      
      expect(result).toBe('hello world');
    });

    it('should remove quotes', () => {
      const input = 'test "quoted" content';
      const result = sanitizeString(input);
      
      expect(result).toBe('test quoted content');
    });
  });

  describe('validateFilePath', () => {
    it('should accept valid relative paths', () => {
      expect(() => validateFilePath('src/file.ts')).not.toThrow();
      expect(() => validateFilePath('docs/readme.md')).not.toThrow();
    });

    it('should reject parent directory traversal', () => {
      expect(() => validateFilePath('../../../etc/passwd')).toThrow();
      expect(() => validateFilePath('src/../../../file.txt')).toThrow();
    });

    it('should reject absolute paths', () => {
      expect(() => validateFilePath('/etc/passwd')).toThrow();
      expect(() => validateFilePath('/home/user/file.txt')).toThrow();
    });

    it('should sanitize special characters', () => {
      const result = validateFilePath('file;name.txt');
      expect(result).toBe('filename.txt');
    });
  });

  describe('CommonSchemas', () => {
    it('should validate non-empty strings', () => {
      expect(CommonSchemas.nonEmptyString.safeParse('hello').success).toBe(true);
      expect(CommonSchemas.nonEmptyString.safeParse('').success).toBe(false);
    });

    it('should validate positive numbers', () => {
      expect(CommonSchemas.positiveNumber.safeParse(5).success).toBe(true);
      expect(CommonSchemas.positiveNumber.safeParse(-1).success).toBe(false);
      expect(CommonSchemas.positiveNumber.safeParse(0).success).toBe(false);
    });

    it('should validate email format', () => {
      expect(CommonSchemas.email.safeParse('test@example.com').success).toBe(true);
      expect(CommonSchemas.email.safeParse('invalid-email').success).toBe(false);
    });

    it('should validate URL format', () => {
      expect(CommonSchemas.url.safeParse('https://example.com').success).toBe(true);
      expect(CommonSchemas.url.safeParse('invalid-url').success).toBe(false);
    });
  });
});