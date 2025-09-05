/**
 * Configuration Resource
 * Provides access to application configuration and settings
 */

import { ResourceDefinition, ResourceContext } from '../types/index.js';
import { getConfig } from '../utils/config.js';
import { log } from '../utils/logger.js';

/**
 * Configuration resource implementation
 */
export const configResource: ResourceDefinition = {
  uri: 'resource://config/current',
  name: 'Application Configuration',
  description: 'Current application configuration and settings',
  mimeType: 'application/json',
  handler: async (uri: string, context: ResourceContext) => {
    try {
      log.withContext(context.requestId).info('Accessing configuration resource', { uri });

      const config = getConfig();

      // Filter sensitive information
      const safeConfig = {
        port: config.port,
        host: config.host,
        logLevel: config.logLevel,
        environment: config.environment,
        enableHealthCheck: config.enableHealthCheck,
        maxRequestSize: config.maxRequestSize,
        corsOrigins: config.corsOrigins,
      };

      log.withContext(context.requestId).info('Configuration resource accessed successfully');

      return [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(safeConfig, null, 2),
        },
      ];
    } catch (error) {
      log
        .withContext(context.requestId)
        .error(
          'Failed to access configuration resource',
          error instanceof Error ? error : new Error(String(error)),
          { uri }
        );
      throw error;
    }
  },
};
