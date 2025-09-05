/**
 * File System Tool
 * Provides secure file system operations for the MCP server
 */

import { promises as fs } from 'fs';
import { join, resolve, relative } from 'path';
import { ToolDefinition, ToolContext } from '../types/index.js';
import { log } from '../utils/logger.js';
import { validateFilePath } from '../utils/validation.js';

/**
 * File system tool implementation
 */
export const fileSystemTool: ToolDefinition = {
  name: 'filesystem',
  description: 'Read and write files within the project directory with security restrictions',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'list', 'exists'],
        description: 'File system operation to perform',
      },
      path: {
        type: 'string',
        description: 'File or directory path (relative to project root)',
      },
      content: {
        type: 'string',
        description: 'Content to write (required for write operation)',
      },
      encoding: {
        type: 'string',
        enum: ['utf8', 'base64'],
        default: 'utf8',
        description: 'File encoding',
      },
    },
    required: ['operation', 'path'],
  },
  handler: async (args: Record<string, unknown>, context: ToolContext) => {
    const {
      operation,
      path,
      content,
      encoding = 'utf8',
    } = args as {
      operation: 'read' | 'write' | 'list' | 'exists';
      path: string;
      content?: string;
      encoding?: 'utf8' | 'base64';
    };

    try {
      log.withContext(context.requestId).info(`File system operation: ${operation}`, {
        path,
        encoding,
      });

      // Validate and sanitize file path
      const sanitizedPath = validateFilePath(path);
      const fullPath = resolve(process.cwd(), sanitizedPath);

      // Security check: ensure path is within project directory
      const projectRoot = resolve(process.cwd());
      const relativePath = relative(projectRoot, fullPath);

      if (relativePath.startsWith('..') || path.startsWith('/')) {
        throw new Error('Access denied: Path outside project directory');
      }

      let result: unknown;

      switch (operation) {
        case 'read':
          result = await readFile(fullPath, encoding);
          break;
        case 'write':
          if (!content) {
            throw new Error('Content is required for write operation');
          }
          result = await writeFile(fullPath, content, encoding);
          break;
        case 'list':
          result = await listDirectory(fullPath);
          break;
        case 'exists':
          result = await checkExists(fullPath);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      log.withContext(context.requestId).info(`File system operation completed: ${operation}`, {
        path: sanitizedPath,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown file system error';

      log
        .withContext(context.requestId)
        .error(
          `File system operation failed: ${operation}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            path,
          }
        );

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};

/**
 * Read file content
 */
async function readFile(
  path: string,
  encoding: 'utf8' | 'base64'
): Promise<{ content: string; size: number }> {
  const content = await fs.readFile(path, encoding);
  const stats = await fs.stat(path);

  return {
    content,
    size: stats.size,
  };
}

/**
 * Write file content
 */
async function writeFile(
  path: string,
  content: string,
  encoding: 'utf8' | 'base64'
): Promise<{ success: boolean; bytesWritten: number }> {
  await fs.writeFile(path, content, encoding);
  const stats = await fs.stat(path);

  return {
    success: true,
    bytesWritten: stats.size,
  };
}

/**
 * List directory contents
 */
async function listDirectory(
  path: string
): Promise<{ files: Array<{ name: string; type: string; size: number }> }> {
  const entries = await fs.readdir(path, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async entry => {
      const entryPath = join(path, entry.name);
      const stats = await fs.stat(entryPath);

      return {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stats.size,
      };
    })
  );

  return { files };
}

/**
 * Check if file or directory exists
 */
async function checkExists(path: string): Promise<{ exists: boolean; type?: string }> {
  try {
    const stats = await fs.stat(path);

    return {
      exists: true,
      type: stats.isDirectory() ? 'directory' : 'file',
    };
  } catch (error) {
    return { exists: false };
  }
}
