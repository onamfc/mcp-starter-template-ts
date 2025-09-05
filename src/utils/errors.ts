/**
 * Error handling utilities
 * Provides standardized error handling and custom error classes
 */

import { ErrorResponse } from '../types/index.js';
import { log } from './logger.js';

/**
 * Base error class for MCP-related errors
 */
export class MCPError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string = 'MCP_ERROR',
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, MCPError);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Tool execution error class
 */
export class ToolExecutionError extends MCPError {
  constructor(message: string, toolName: string, details?: unknown) {
    super(message, 'TOOL_EXECUTION_ERROR', 500, {
      toolName,
      ...(details && typeof details === 'object' && details !== null
        ? (details as Record<string, unknown>)
        : {}),
    });
    this.name = 'ToolExecutionError';
  }
}

/**
 * Resource access error class
 */
export class ResourceAccessError extends MCPError {
  constructor(message: string, resourceUri: string, details?: unknown) {
    super(message, 'RESOURCE_ACCESS_ERROR', 403, {
      resourceUri,
      ...(details && typeof details === 'object' && details !== null
        ? (details as Record<string, unknown>)
        : {}),
    });
    this.name = 'ResourceAccessError';
  }
}

/**
 * Convert error to standardized error response
 */
export function createErrorResponse(
  error: Error,
  requestId: string = generateRequestId()
): ErrorResponse {
  let code = 'INTERNAL_ERROR';
  let message = 'An internal error occurred';
  let details: unknown;

  if (error instanceof MCPError) {
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    message = error.message;
    details = { stack: error.stack };
  }

  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };

  // Log the error for monitoring
  log.withContext(requestId).error(`Error occurred: ${message}`, error, { code, details });

  return errorResponse;
}

/**
 * Generate unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Async error wrapper for better error handling
 */
export function asyncErrorHandler<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }

      // Wrap unknown errors in MCPError
      throw new MCPError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'UNKNOWN_ERROR',
        500,
        error instanceof Error ? { stack: error.stack } : { error }
      );
    }
  };
}

/**
 * Validate that error has required properties
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error occurred';
}

/**
 * Error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled promise rejection', isError(reason) ? reason : new Error(String(reason)), {
      promise: promise.toString(),
    });
  });

  process.on('uncaughtException', error => {
    log.error('Uncaught exception', error);
    process.exit(1);
  });
}
