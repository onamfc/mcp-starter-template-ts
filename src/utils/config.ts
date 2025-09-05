/**
 * Configuration management utilities
 * Handles loading, validation, and access to application configuration
 */

import { config as loadEnv } from 'dotenv';
import { Config, ConfigSchema } from '../types/index.js';

// Load environment variables from .env file
loadEnv();

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const rawConfig = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    host: process.env.HOST,
    logLevel: process.env.LOG_LEVEL,
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === 'true',
    maxRequestSize: process.env.MAX_REQUEST_SIZE,
    corsOrigins: process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()),
    environment: process.env.NODE_ENV,
  };

  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw new Error('Invalid configuration. Please check your environment variables.');
  }
}

/**
 * Validate configuration and log any issues
 */
export function validateConfig(): void {
  try {
    const config = loadConfig();
    console.error('Configuration validated successfully:', {
      port: config.port,
      host: config.host,
      environment: config.environment,
      logLevel: config.logLevel,
    });
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }
}

/**
 * Get configuration with caching for performance
 */
let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getConfig().environment === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getConfig().environment === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getConfig().environment === 'test';
}
