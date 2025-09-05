/**
 * Main MCP Server Implementation
 *
 * Entry point for the Model Context Protocol server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ReadResourceRequest,
} from '@modelcontextprotocol/sdk/types.js';

import { getConfig, validateConfig } from './utils/config.js';
import { initializeLogger, log } from './utils/logger.js';
import {
  setupGlobalErrorHandlers,
  createErrorResponse,
  generateRequestId,
} from './utils/errors.js';
import { setupTools } from './tools/setup.js';
import { setupResources } from './resources/setup.js';
import { createHealthChecker } from './utils/health.js';

type Tool = Awaited<ReturnType<typeof setupTools>>[number];
type Resource = Awaited<ReturnType<typeof setupResources>>[number];

/**
 * MCP Server class that handles all protocol interactions
 */
class MCPServer {
  private server: Server;
  private config: ReturnType<typeof getConfig>;
  private tools: Tool[] = [];
  private resources: Resource[] = [];

  constructor() {
    // Load and validate configuration
    this.config = getConfig();

    // Initialize logging
    initializeLogger(this.config);

    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Create MCP server instance
    this.server = new Server(
      {
        name: 'mcp-starter-template',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup all MCP protocol handlers
   */
  private setupHandlers(): void {
    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupErrorHandlers();
    this.setupLifecycleHandlers();
  }

  /**
   * Setup tool-related handlers
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const requestId = generateRequestId();

      try {
        log.withContext(requestId).info('Listing available tools');

        // Ensure tools are initialized
        if (this.tools.length === 0) {
          this.tools = await setupTools();
        }

        log
          .withContext(requestId)
          .info(`Found ${this.tools.length} tools`, { toolNames: this.tools.map(t => t.name) });

        return { tools: this.tools };
      } catch (err) {
        log
          .withContext(requestId)
          .error('Failed to list tools', err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    });

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const requestId = generateRequestId();
      const { name, arguments: args } = request.params;

      try {
        log.withContext(requestId).info(`Executing tool: ${name}`, { arguments: args });

        if (this.tools.length === 0) {
          this.tools = await setupTools();
        }

        const tool = this.tools.find(t => t.name === name);
        if (!tool) {
          throw new Error(`Tool not found: ${name}`);
        }

        const result = await tool.handler(args ?? {}, {
          requestId,
          timestamp: new Date().toISOString(),
        });

        log.withContext(requestId).info(`Tool executed successfully: ${name}`, {
          resultType: typeof result,
        });

        // Tool handlers are expected to return the proper MCP tool response shape.
        return result as any;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const errorResponse = createErrorResponse(error, requestId);
        log.withContext(requestId).error(`Tool execution failed: ${name}`, error);

        // Re-throw a normalized MCP error object so the client gets structured details.
        throw errorResponse;
      }
    });
  }

  /**
   * Setup resource-related handlers
   */
  private setupResourceHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const requestId = generateRequestId();

      try {
        log.withContext(requestId).info('Listing available resources');

        if (this.resources.length === 0) {
          this.resources = await setupResources();
        }

        log.withContext(requestId).info(`Found ${this.resources.length} resources`, {
          resourceUris: this.resources.map(r => r.uri),
        });

        return { resources: this.resources };
      } catch (err) {
        log
          .withContext(requestId)
          .error('Failed to list resources', err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    });

    // Read resource
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: ReadResourceRequest) => {
        const requestId = generateRequestId();
        const { uri } = request.params;

        try {
          log.withContext(requestId).info(`Reading resource: ${uri}`);

          if (this.resources.length === 0) {
            this.resources = await setupResources();
          }

          const resource = this.resources.find(r => r.uri === uri);
          if (!resource) {
            throw new Error(`Resource not found: ${uri}`);
          }

          const contents = await resource.handler(uri, {
            requestId,
            timestamp: new Date().toISOString(),
            resourcePath: uri,
            accessType: 'read',
          });

          log.withContext(requestId).info(`Resource read successfully: ${uri}`);

          // Per MCP spec, return { contents: Content[] }
          return { contents };
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          log.withContext(requestId).error(`Resource read failed: ${uri}`, error);
          throw createErrorResponse(error, requestId);
        }
      }
    );
  }

  /**
   * Setup server-level error handler
   */
  private setupErrorHandlers(): void {
    this.server.onerror = (error: unknown) => {
      const requestId = generateRequestId();
      const err = error instanceof Error ? error : new Error(String(error));
      log.withContext(requestId).error('MCP Server error', err);
    };
  }

  /**
   * Setup lifecycle handlers
   */
  private setupLifecycleHandlers(): void {
    // Graceful shutdown handling
    const shutdown = async (): Promise<void> => {
      log.info('Shutting down MCP server...');

      try {
        await this.server.close();
        log.info('MCP server shut down successfully');
        process.exit(0);
      } catch (error) {
        log.error(
          'Error during shutdown',
          error instanceof Error ? error : new Error(String(error))
        );
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Start the MCP server
   */
  public async start(): Promise<void> {
    try {
      log.info('Starting MCP server...', {
        port: this.config.port,
        environment: this.config.environment,
        logLevel: this.config.logLevel,
      });

      // Setup health checker if enabled
      if (this.config.enableHealthCheck) {
        const healthChecker = createHealthChecker(this.config);
        await healthChecker.start();
        log.info(
          `Health check endpoint available at http://${this.config.host}:${this.config.port + 1}/health`
        );
      }

      // Start the server with stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      log.info('MCP server started successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      log.error('Failed to start MCP server', err);
      // Preserve a console message for non-logger contexts
      console.error('Failed to initialize MCP server:', err);
      throw err;
    }
  }
}

/**
 * Initialize and start the server
 */
export async function main(): Promise<void> {
  try {
    // Validate configuration first
    validateConfig();

    const server = new MCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to initialize MCP server:', error);
    process.exit(1);
  }
}

export { MCPServer };
