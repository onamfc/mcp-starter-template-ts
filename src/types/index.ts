/**
 * Type definitions for the MCP starter template
 * This file contains all shared types and interfaces used throughout the application
 */

import { z } from 'zod';

/**
 * Configuration schema for the MCP server
 */
export const ConfigSchema = z.object({
  port: z.number().min(1000).max(65535).default(3000),
  host: z.string().default('localhost'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  enableHealthCheck: z.boolean().default(true),
  maxRequestSize: z.string().default('10mb'),
  corsOrigins: z.array(z.string()).default(['*']),
  environment: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

/**
 * Health check response structure
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

/**
 * Tool execution context containing request metadata
 */
export interface ToolContext {
  requestId: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Resource access context for authorization and logging
 */
export interface ResourceContext {
  requestId: string;
  timestamp: string;
  resourcePath: string;
  accessType: 'read' | 'write' | 'list';
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorResponse['error'];
  meta?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

/**
 * Server metrics for monitoring
 */
export interface ServerMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  activeConnections: number;
  uptime: number;
}

/**
 * Log entry structure for structured logging
 */
export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  error?: Error;
  metadata?: Record<string, unknown>;
}

/**
 * Tool definition interface
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

/**
 * Resource definition interface
 */
export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  handler: (uri: string, context: ResourceContext) => Promise<unknown>;
}
