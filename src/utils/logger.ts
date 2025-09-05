/**
 * Structured logging utility using Winston
 * Provides consistent logging across the application with proper formatting and levels
 */

import winston from 'winston';
import { Config } from '../types/index.js';

/**
 * Custom log format for better readability
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, requestId, userId, ...meta }) => {
    const prefix = requestId ? `[${requestId}]` : '';
    const userInfo = userId ? `[user:${userId}]` : '';
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';

    return `${timestamp} [${level.toUpperCase()}] ${prefix}${userInfo} ${message} ${metaString}`.trim();
  })
);

/**
 * Create and configure Winston logger instance
 */
export function createLogger(config: Config): winston.Logger {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ];

  // Add file transport in production
  if (config.environment === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
      })
    );
  }

  return winston.createLogger({
    level: config.logLevel,
    format: logFormat,
    transports,
    exitOnError: false,
  });
}

/**
 * Logger instance (will be initialized when server starts)
 */
let logger: winston.Logger;

/**
 * Initialize the logger with configuration
 */
export function initializeLogger(config: Config): void {
  logger = createLogger(config);
}

/**
 * Get the current logger instance
 */
export function getLogger(): winston.Logger {
  if (!logger) {
    throw new Error('Logger not initialized. Call initializeLogger() first.');
  }
  return logger;
}

/**
 * Structured logging methods with request context
 */
export const log = {
  error: (message: string, error?: Error, meta?: Record<string, unknown>): void => {
    getLogger().error(message, { error, ...meta });
  },

  warn: (message: string, meta?: Record<string, unknown>): void => {
    getLogger().warn(message, meta);
  },

  info: (message: string, meta?: Record<string, unknown>): void => {
    getLogger().info(message, meta);
  },

  debug: (message: string, meta?: Record<string, unknown>): void => {
    getLogger().debug(message, meta);
  },

  /**
   * Log with request context for better tracing
   */
  withContext: (requestId: string, userId?: string) => ({
    error: (message: string, error?: Error, meta?: Record<string, unknown>): void => {
      getLogger().error(message, { requestId, userId, error, ...meta });
    },

    warn: (message: string, meta?: Record<string, unknown>): void => {
      getLogger().warn(message, { requestId, userId, ...meta });
    },

    info: (message: string, meta?: Record<string, unknown>): void => {
      getLogger().info(message, { requestId, userId, ...meta });
    },

    debug: (message: string, meta?: Record<string, unknown>): void => {
      getLogger().debug(message, { requestId, userId, ...meta });
    },
  }),
};
