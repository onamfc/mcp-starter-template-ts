/**
 * Main MCP Server Implementation
 * 
 * This is the entry point for the Model Context Protocol server.
 * It sets up the server with tools, resources, and proper error handling.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getConfig, validateConfig } from './utils/config.js';
import { initializeLogger, log } from './utils/logger.js';
import { setupGlobalErrorHandlers, createErrorResponse, generateRequestId } from './utils/errors.js';
import { validateInput } from './utils/validation.js';
import { setupTools } from './tools/setup.js';
import { setupResources } from './resources/setup.js';
import { createHealthChecker } from './utils/health.js';

/**
 * MCP Server class that handles all protocol interactions
 */
class MCPServer {
  private server: Server;
  private config: ReturnType<typeof getConfig>;

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
        
        const tools = await setupTools();
        
        log.withContext(requestId).info(`Found ${tools.length} tools`, {
          toolNames: tools.map(tool => tool.name),
        });
        
        return { tools };
      } catch (error) {
        log.withContext(requestId).error('Failed to list tools', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const requestId = generateRequestId();
      const { name, arguments: args } = request.params;
      
      try {
        log.withContext(requestId).info(`Executing tool: ${name}`, { arguments: args });
        
        // Validate tool request
        const validation = validateInput(CallToolRequestSchema.shape.params, request.params);
        if (!validation.success) {
          throw new Error(`Invalid tool request: ${validation.errors.map(e => e.message).join(', ')}`);
        }

        const tools = await setupTools();
        const tool = tools.find(t => t.name === name);
        
        if (!tool) {
          throw new Error(`Tool not found: ${name}`);
        }

        const result = await tool.handler(args || {}, { requestId, timestamp: new Date().toISOString() });
        
        log.withContext(requestId).info(`Tool executed successfully: ${name}`, {
          resultType: typeof result,
        });
        
        return result as any;
      } catch (error) {
        const errorResponse = createErrorResponse(error instanceof Error ? error : new Error(String(error)), requestId);
        log.withContext(requestId).error(`Tool execution failed: ${name}`, error instanceof Error ? error : new Error(String(error)));
        throw error;
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
        
        const resources = await setupResources();
        
        log.withContext(requestId).info(`Found ${resources.length} resources`, {
          resourceUris: resources.map(resource => resource.uri),
        });
        
        return { resources };
      } catch (error) {
        log.withContext(requestId).error('Failed to list resources', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const requestId = generateRequestId();
      const { uri } = request.params;
      
      try {
        log.withContext(requestId).info(`Reading resource: ${uri}`);
        
        const resources = await setupResources();
        const resource = resources.find(r => r.uri === uri);
        
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
        
        return { contents };
      } catch (error) {
        log.withContext(requestId).error(`Resource read failed: ${uri}`, error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    this.server.onerror = (error) => {
      const requestId = generateRequestId();
      log.withContext(requestId).error('MCP Server error', error instanceof Error ? error : new Error(String(error)));
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
        log.error('Error during shutdown', error instanceof Error ? error : new Error(String(error)));
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
        log.info(`Health check endpoint available at http://${this.config.host}:${this.config.port + 1}/health`);
      }

      // Start the server with stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      log.info('MCP server started successfully');
    } catch (error) {
      log.error('Failed to start MCP server', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }
}

/**
 * Initialize and start the server
 */
async function main(): Promise<void> {
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

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { MCPServer };