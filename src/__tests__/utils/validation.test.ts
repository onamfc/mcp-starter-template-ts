/**
 * Validation Utilities Tests
 * Tests for input validation and sanitization functions
 */

import { z } from 'zod';
import {
  validateInput,
  sanitizeString,
  validateFilePath,
  CommonSchemas,
  createToolValidator,
  ToolArgumentsSchema,
  ResourceUriSchema,
} from '../../utils/validation.js';

describe('Validation Utilities', () => {
  describe('validateInput', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    it('validates correct input and returns data', () => {
      const result = validateInput(testSchema, { name: 'Brandon', age: 44 });

      expect(result.success).toBe(true);
      if (!result.success) {
        fail(`Expected success result, got failure: ${JSON.stringify(result)}`);
      }

      expect(result.data).toEqual({ name: 'Brandon', age: 44 });
    });

    it('returns formatted errors for invalid input', () => {
      const result = validateInput(testSchema, { name: '', age: -1 });

      expect(result.success).toBe(false);
      if (result.success) {
        fail(`Expected failure result, got success: ${JSON.stringify(result)}`);
      }

      const { errors } = result;

      // Ensure we actually have at least 2 issues
      expect(errors.length).toBeGreaterThanOrEqual(2);

      // Every error has the expected shape
      errors.forEach(e => {
        expect(typeof e.field).toBe('string');
        expect(typeof e.message).toBe('string');
      });

      // We specifically expect problems with `name` and `age`, order-independent
      const fields = new Set(errors.map(e => e.field));
      expect(fields.has('name')).toBe(true);
      expect(fields.has('age')).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    it('removes dangerous characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      expect(result).toBe('scriptalert(xss)/script');
    });

    it('trims whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeString(input);
      expect(result).toBe('hello world');
    });

    it('removes quotes', () => {
      const input = 'test "quoted" content';
      const result = sanitizeString(input);
      expect(result).toBe('test quoted content');
    });
  });

  describe('validateFilePath', () => {
    it('accepts valid relative paths', () => {
      expect(() => validateFilePath('src/file.ts')).not.toThrow();
      expect(() => validateFilePath('docs/readme.md')).not.toThrow();
    });

    it('rejects parent directory traversal', () => {
      expect(() => validateFilePath('../../../etc/passwd')).toThrow();
      expect(() => validateFilePath('src/../../../file.txt')).toThrow();
    });

    it('rejects absolute paths', () => {
      expect(() => validateFilePath('/etc/passwd')).toThrow();
      expect(() => validateFilePath('/home/user/file.txt')).toThrow();
    });

    it('sanitizes special characters (keeps allowed punctuation)', () => {
      const result = validateFilePath('file;name.txt');
      expect(result).toBe('filename.txt');
      expect(validateFilePath('ok-name_1.2/part.ts')).toBe('ok-name_1.2/part.ts');
    });
  });

  describe('CommonSchemas', () => {
    it('validates non-empty strings', () => {
      expect(CommonSchemas.nonEmptyString.safeParse('hello').success).toBe(true);
      expect(CommonSchemas.nonEmptyString.safeParse('').success).toBe(false);
    });

    it('validates positive numbers', () => {
      expect(CommonSchemas.positiveNumber.safeParse(5).success).toBe(true);
      expect(CommonSchemas.positiveNumber.safeParse(-1).success).toBe(false);
      expect(CommonSchemas.positiveNumber.safeParse(0).success).toBe(false);
    });

    it('validates email format', () => {
      expect(CommonSchemas.email.safeParse('test@example.com').success).toBe(true);
      expect(CommonSchemas.email.safeParse('invalid-email').success).toBe(false);
    });

    it('validates URL format', () => {
      expect(CommonSchemas.url.safeParse('https://example.com').success).toBe(true);
      expect(CommonSchemas.url.safeParse('invalid-url').success).toBe(false);
    });

    it('filePath schema blocks traversal/absolute paths', () => {
      expect(CommonSchemas.filePath.safeParse('ok/file.txt').success).toBe(true);
      expect(CommonSchemas.filePath.safeParse('../secret').success).toBe(false);
      expect(CommonSchemas.filePath.safeParse('/etc/passwd').success).toBe(false);
    });
  });

  describe('createToolValidator', () => {
    const schema = z.object({
      name: CommonSchemas.nonEmptyString,
      count: CommonSchemas.positiveNumber,
    });
    const validate = createToolValidator(schema);

    it('returns parsed data on success', () => {
      const data = validate({ name: 'job', count: 3 });
      expect(data).toEqual({ name: 'job', count: 3 });
    });

    it('throws a combined message on failure', () => {
      expect(() => validate({ name: '', count: 0 })).toThrow(/Validation failed:/);
      try {
        validate({ name: '', count: 0 });
      } catch (e) {
        const msg = String(e instanceof Error ? e.message : e);
        // Messages come from the schemas; check that both fields are referenced
        expect(msg).toMatch(/name:/i);
        expect(msg).toMatch(/count:/i);
      }
    });
  });

  describe('ToolArgumentsSchema', () => {
    it('accepts name and optional parameters object', () => {
      const ok = ToolArgumentsSchema.safeParse({ name: 'tool-x', parameters: { a: 1 } });
      expect(ok.success).toBe(true);
    });

    it('rejects missing name and invalid parameters shape', () => {
      expect(ToolArgumentsSchema.safeParse({}).success).toBe(false);
      // parameters must be a record if provided
      expect(ToolArgumentsSchema.safeParse({ name: 'x', parameters: 5 }).success).toBe(false);
    });
  });

  describe('ResourceUriSchema', () => {
    it('accepts resource:// and file:// URIs', () => {
      expect(ResourceUriSchema.safeParse('resource://abc').success).toBe(true);
      expect(ResourceUriSchema.safeParse('file://path/to/file').success).toBe(true);
    });

    it('rejects other schemes', () => {
      expect(ResourceUriSchema.safeParse('http://example.com').success).toBe(false);
      expect(ResourceUriSchema.safeParse('').success).toBe(false);
    });
  });
});
