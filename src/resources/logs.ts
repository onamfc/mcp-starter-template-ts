/**
 * Logs Resource
 * Provides access to application logs and recent events
 */

import { ResourceDefinition, ResourceContext } from '../types/index.js';
import { log } from '../utils/logger.js';

/**
 * In-memory log storage for demonstration
 * In production, you'd read from actual log files or a logging service
 */
const recentLogs: Array<{
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}> = [];

/**
 * Logs resource implementation
 */
export const logsResource: ResourceDefinition = {
  uri: 'resource://logs/recent',
  name: 'Recent Logs',
  description: 'Recent application logs and events',
  mimeType: 'application/json',
  handler: async (uri: string, context: ResourceContext) => {
    try {
      log.withContext(context.requestId).info('Accessing logs resource', { uri });

      // In a real implementation, you'd read from log files or a logging service
      const logs = getRecentLogs(50); // Get last 50 log entries

      log.withContext(context.requestId).info('Logs resource accessed successfully', {
        logCount: logs.length,
      });

      return [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(logs, null, 2),
        },
      ];
    } catch (error) {
      log
        .withContext(context.requestId)
        .error(
          'Failed to access logs resource',
          error instanceof Error ? error : new Error(String(error)),
          { uri }
        );
      throw error;
    }
  },
};

/**
 * Get recent log entries
 */
function getRecentLogs(limit: number = 50): typeof recentLogs {
  // Mock implementation - returns sample log entries
  const sampleLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'MCP server started successfully',
      metadata: { port: 3000, environment: 'development' },
    },
    {
      timestamp: new Date(Date.now() - 30000).toISOString(),
      level: 'info',
      message: 'Configuration loaded',
      metadata: { configFile: '.env' },
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'debug',
      message: 'Tool executed successfully',
      requestId: 'req_1234567890_abc123',
      metadata: { toolName: 'calculate', executionTime: 45 },
    },
  ];

  return sampleLogs.slice(0, limit);
}

/**
 * Add log entry to in-memory storage
 * This would be called by the logging system in a real implementation
 */
export function addLogEntry(entry: (typeof recentLogs)[0]): void {
  recentLogs.push(entry);

  // Keep only the most recent entries
  if (recentLogs.length > 1000) {
    recentLogs.splice(0, recentLogs.length - 1000);
  }
}
