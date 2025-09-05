/**
 * Better tests for utils/errors.ts
 * - Covers custom errors, createErrorResponse branches, asyncErrorHandler wrapping,
 *   isError/getErrorMessage, and setupGlobalErrorHandlers behavior.
 */

// logger is already mocked in src/__tests__/setup.ts
import { log } from '../../utils/logger.js';
import {
  MCPError,
  ValidationError,
  ToolExecutionError,
  ResourceAccessError,
  createErrorResponse,
  generateRequestId,
  asyncErrorHandler,
  isError,
  getErrorMessage,
  setupGlobalErrorHandlers,
} from '../../utils/errors.js';

describe('utils/errors – custom error classes', () => {
  it('MCPError sets name/code/status/details and preserves stack', () => {
    const err = new MCPError('boom', 'X', 418, { a: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('MCPError');
    expect(err.message).toBe('boom');
    expect(err.code).toBe('X');
    expect(err.statusCode).toBe(418);
    expect(err.details).toEqual({ a: 1 });
    expect(err.stack).toBeTruthy();
  });

  it('ValidationError uses VALIDATION_ERROR/400', () => {
    const err = new ValidationError('nope', { why: 'bad' });
    expect(err.name).toBe('ValidationError');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ why: 'bad' });
  });

  it('ToolExecutionError merges toolName into details', () => {
    const err = new ToolExecutionError('tool fail', 'calc', { foo: 'bar' });
    expect(err.name).toBe('ToolExecutionError');
    expect(err.code).toBe('TOOL_EXECUTION_ERROR');
    expect(err.statusCode).toBe(500);
    expect(err.details).toEqual({ toolName: 'calc', foo: 'bar' });
  });

  it('ResourceAccessError merges resourceUri into details', () => {
    const err = new ResourceAccessError('denied', 'res://x', { foo: 1 });
    expect(err.name).toBe('ResourceAccessError');
    expect(err.code).toBe('RESOURCE_ACCESS_ERROR');
    expect(err.statusCode).toBe(403);
    expect(err.details).toEqual({ resourceUri: 'res://x', foo: 1 });
  });
});

describe('utils/errors – createErrorResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses MCPError code/message/details and logs with context', () => {
    const e = new ValidationError('invalid', { field: 'name' });
    const rid = 'req_test_1';

    const withCtx = log.withContext as jest.MockedFunction<typeof log.withContext>;

    // <- create the fake context logger explicitly
    const ctxLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    // <- make withContext return it
    withCtx.mockReturnValueOnce(ctxLogger as any);

    const res = createErrorResponse(e, rid);

    expect(res.error.code).toBe('VALIDATION_ERROR');
    expect(res.error.message).toBe('invalid');
    expect(res.error.details).toEqual({ field: 'name' });

    expect(withCtx).toHaveBeenCalledWith(rid);
    expect(ctxLogger.error).toHaveBeenCalled(); // <- safe, no results[0]
  });

  it('uses INTERNAL_ERROR for generic Error and includes stack', () => {
    const e = new Error('oops');
    const res = createErrorResponse(e, 'rid');
    expect(res.error.code).toBe('INTERNAL_ERROR');
    expect(res.error.message).toBe('oops');
    expect(res.error.details).toHaveProperty('stack');
  });

  it('defaults to INTERNAL_ERROR message when not MCPError (safety)', () => {
    // @ts-expect-error simulate non-Error unknown
    const res = createErrorResponse({ not: 'error' }, 'rid2');
    expect(res.error.code).toBe('INTERNAL_ERROR');
    expect(res.error.message).toBe('An internal error occurred');
  });
});

describe('utils/errors – generateRequestId', () => {
  it('returns unique ids with req_ prefix', () => {
    const a = generateRequestId();
    const b = generateRequestId();
    const c = generateRequestId();
    expect(a).toMatch(/^req_/);
    expect(new Set([a, b, c]).size).toBe(3);
  });
});

describe('utils/errors – asyncErrorHandler', () => {
  it('passes through MCPError unchanged', async () => {
    const fn = async () => {
      throw new ValidationError('bad');
    };
    const wrapped = asyncErrorHandler(fn);
    await expect(wrapped()).rejects.toBeInstanceOf(ValidationError);
  });

  it('wraps generic Error into MCPError with UNKNOWN_ERROR and stack detail', async () => {
    const fn = async () => {
      throw new Error('boom');
    };
    const wrapped = asyncErrorHandler(fn);
    await expect(wrapped()).rejects.toMatchObject({
      name: 'MCPError',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      details: expect.objectContaining({ stack: expect.any(String) }),
    });
  });

  it('wraps unknown thrown value into MCPError with error detail', async () => {
    const fn = async () => {
      // throw a non-Error value
      // eslint-disable-next-line no-throw-literal
      throw 'BAD';
    };
    const wrapped = asyncErrorHandler(fn);
    await expect(wrapped()).rejects.toMatchObject({
      name: 'MCPError',
      code: 'UNKNOWN_ERROR',
      details: { error: 'BAD' },
    });
  });
});

describe('utils/errors – isError & getErrorMessage', () => {
  it('isError detects Error', () => {
    expect(isError(new Error('x'))).toBe(true);
    expect(isError('x')).toBe(false);
    expect(isError({})).toBe(false);
  });

  it('getErrorMessage extracts message or returns string/default', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage('hi')).toBe('hi');
    expect(getErrorMessage({ a: 1 })).toBe('Unknown error occurred');
  });
});

describe('utils/errors – setupGlobalErrorHandlers', () => {
  it('registers process handlers and logs unhandledRejection & uncaughtException', () => {
    type KnownEvents = 'unhandledRejection' | 'uncaughtException';

    // store only the handlers we need
    const handlers: Partial<Record<KnownEvents, (...args: unknown[]) => void>> = {};

    const onSpy = jest.spyOn(process, 'on').mockImplementation(((
      event: string,
      handler: (...args: unknown[]) => void
    ) => {
      if (event === 'unhandledRejection' || event === 'uncaughtException') {
        handlers[event] = handler;
      }
      return process;
    }) as unknown as typeof process.on);

    const errorSpy = jest.spyOn(log, 'error');

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((
      code?: string | number | null | undefined
    ): never => {
      throw new Error(`__exit__:${code ?? ''}`);
    }) as unknown as (code?: string | number | null | undefined) => never);

    setupGlobalErrorHandlers();

    // trigger unhandledRejection
    const fakePromise = { toString: () => 'PROM' };
    handlers.unhandledRejection?.('why', fakePromise);
    expect(errorSpy).toHaveBeenCalledWith(
      'Unhandled promise rejection',
      expect.any(Error),
      expect.objectContaining({ promise: 'PROM' })
    );

    // trigger uncaughtException
    const boom = new Error('CRASH');
    expect(() => handlers.uncaughtException?.(boom)).toThrow(/__exit__:1/);
    expect(errorSpy).toHaveBeenCalledWith('Uncaught exception', boom);
    expect(exitSpy).toHaveBeenCalledWith(1);

    onSpy.mockRestore();
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
