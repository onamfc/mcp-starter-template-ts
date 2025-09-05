/**
 * Documentation Resource
 * Provides access to project documentation and help content
 */

import { ResourceDefinition, ResourceContext } from '../types/index.js';
import { log } from '../utils/logger.js';

/**
 * Documentation resource implementation
 */
export const docsResource: ResourceDefinition = {
  uri: 'resource://docs/api',
  name: 'API Documentation',
  description: 'Complete API documentation and usage examples',
  mimeType: 'text/markdown',
  handler: async (uri: string, context: ResourceContext) => {
    try {
      log.withContext(context.requestId).info('Accessing documentation resource', { uri });

      const documentation = `# MCP Server Documentation

## Quick Start

This MCP server provides tools for calculation, file operations, text processing, and weather data.

### Using Tools

Tools can be called using the standard MCP protocol. Each tool has specific parameters and returns structured data.

### Using Resources

Resources provide read-only access to server data like configuration, documentation, and logs.

## Examples

### Calculate Expression
\`\`\`
Tool: calculate
Arguments: { "expression": "10 + 5 * 2", "precision": 2 }
Result: 20.00
\`\`\`

### Read File
\`\`\`
Tool: filesystem
Arguments: { "operation": "read", "path": "package.json" }
Result: File contents as JSON
\`\`\`

### Process Text
\`\`\`
Tool: text-processing
Arguments: { "operation": "wordcount", "text": "Hello world example" }
Result: Word count analysis
\`\`\`

## Security

All operations are logged and validated. File access is restricted to the project directory.
`;

      log.withContext(context.requestId).info('Documentation resource accessed successfully');

      return [
        {
          uri,
          mimeType: 'text/markdown',
          text: documentation,
        },
      ];
    } catch (error) {
      log
        .withContext(context.requestId)
        .error(
          'Failed to access documentation resource',
          error instanceof Error ? error : new Error(String(error)),
          { uri }
        );
      throw error;
    }
  },
};
