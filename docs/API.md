# API Reference

Complete API reference for the MCP starter template server.

## Overview

This MCP server provides a comprehensive set of tools and resources following the Model Context Protocol specification.

## Protocol Information

- **Name**: mcp-starter-template
- **Version**: 1.0.0
- **Transport**: stdio
- **Capabilities**: tools, resources

## Tools

### calculate

Perform mathematical calculations with support for basic arithmetic operations.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "expression": {
      "type": "string",
      "description": "Mathematical expression to evaluate (e.g., '2 + 3 * 4')"
    },
    "precision": {
      "type": "number",
      "description": "Number of decimal places for the result (default: 2)",
      "default": 2
    }
  },
  "required": ["expression"]
}
```

**Response Format:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Calculation Result: 2 + 3 * 4 = 14"
    }
  ]
}
```

**Error Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Invalid characters in expression"
    }
  ],
  "isError": true
}
```

### filesystem

Read and write files within the project directory with security restrictions.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["read", "write", "list", "exists"],
      "description": "File system operation to perform"
    },
    "path": {
      "type": "string",
      "description": "File or directory path (relative to project root)"
    },
    "content": {
      "type": "string",
      "description": "Content to write (required for write operation)"
    },
    "encoding": {
      "type": "string",
      "enum": ["utf8", "base64"],
      "default": "utf8",
      "description": "File encoding"
    }
  },
  "required": ["operation", "path"]
}
```

**Operations:**

#### Read Operation
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"content\": \"file contents here\", \"size\": 1234}"
    }
  ]
}
```

#### Write Operation
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"success\": true, \"bytesWritten\": 1234}"
    }
  ]
}
```

#### List Operation
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"files\": [{\"name\": \"file.txt\", \"type\": \"file\", \"size\": 1234}]}"
    }
  ]
}
```

#### Exists Operation
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"exists\": true, \"type\": \"file\"}"
    }
  ]
}
```

### text-processing

Process and analyze text with various operations like counting, formatting, and transformation.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["count", "uppercase", "lowercase", "reverse", "wordcount", "sentiment"],
      "description": "Text processing operation to perform"
    },
    "text": {
      "type": "string",
      "description": "Text content to process"
    },
    "options": {
      "type": "object",
      "description": "Additional options for the operation",
      "properties": {
        "caseSensitive": {
          "type": "boolean",
          "default": true,
          "description": "Whether to consider case in operations"
        },
        "includeWhitespace": {
          "type": "boolean",
          "default": true,
          "description": "Whether to include whitespace in character counts"
        }
      }
    }
  },
  "required": ["operation", "text"]
}
```

**Operations:**

#### Count Operation
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"total\": 50, \"withoutWhitespace\": 42, \"whitespace\": 8}"
    }
  ]
}
```

#### Word Count Operation
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"words\": 10, \"sentences\": 2, \"paragraphs\": 1, \"averageWordsPerSentence\": 5}"
    }
  ]
}
```

#### Sentiment Operation
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"sentiment\": \"positive\", \"score\": 0.8, \"confidence\": 0.9}"
    }
  ]
}
```

### weather

Get current weather information and forecasts for any location (mock implementation).

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "location": {
      "type": "string",
      "description": "Location name (city, country) or coordinates (lat,lon)"
    },
    "units": {
      "type": "string",
      "enum": ["metric", "imperial", "kelvin"],
      "default": "metric",
      "description": "Temperature units"
    },
    "forecast": {
      "type": "boolean",
      "default": false,
      "description": "Include 5-day forecast"
    }
  },
  "required": ["location"]
}
```

**Response Format:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Weather for New York, NY\nCurrent: 22°C (feels like 25°C)\nCondition: Partly Cloudy\n..."
    }
  ]
}
```

## Resources

### resource://config/current

Current application configuration and settings.

**Response:**
```json
[
  {
    "uri": "resource://config/current",
    "mimeType": "application/json",
    "text": "{\"port\": 3000, \"host\": \"localhost\", ...}"
  }
]
```

### resource://docs/api

Complete API documentation and usage examples.

**Response:**
```json
[
  {
    "uri": "resource://docs/api",
    "mimeType": "text/markdown",
    "text": "# MCP Server API Documentation\n..."
  }
]
```

### resource://logs/recent

Recent application logs and events.

**Response:**
```json
[
  {
    "uri": "resource://logs/recent",
    "mimeType": "application/json",
    "text": "[{\"timestamp\": \"...\", \"level\": \"info\", \"message\": \"...\"}]"
  }
]
```

## Error Handling

All tools and resources implement consistent error handling. Errors are returned in this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2025-01-03T10:30:00.000Z"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `TOOL_EXECUTION_ERROR`: Tool execution failed
- `RESOURCE_ACCESS_ERROR`: Resource access denied or failed
- `FILE_NOT_FOUND`: Requested file does not exist
- `PERMISSION_DENIED`: Insufficient permissions for operation
- `INTERNAL_ERROR`: Internal server error

## Health Monitoring

### Health Check Endpoint

`GET http://localhost:3001/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-03T10:30:00.000Z",
  "uptime": 123456,
  "version": "1.0.0",
  "environment": "development"
}
```

### Metrics Endpoint

`GET http://localhost:3001/metrics`

**Response:**
```json
{
  "requestCount": 150,
  "errorCount": 2,
  "averageResponseTime": 45.5,
  "activeConnections": 3,
  "uptime": 123456
}
```

## Security

### Input Validation

All tool inputs are validated using Zod schemas. The validation includes:

- Type checking
- Required field validation
- Format validation (URLs, emails, file paths)
- Range validation for numbers
- Pattern validation for strings

### File System Security

File operations are restricted to the project directory:

- Absolute paths are rejected
- Parent directory traversal (`../`) is blocked
- File paths are sanitized to remove dangerous characters
- All file operations are logged for auditing

### Expression Security

Mathematical expressions in the calculator tool are sanitized:

- Only allowed characters: numbers, operators, parentheses, decimal points
- No function calls or variable references permitted
- Evaluation uses Function constructor (safer than eval)
- Results are validated to ensure they're finite numbers

## Performance

### Optimization Strategies

1. **Lazy Loading**: Tools and resources are loaded on demand
2. **Caching**: Configuration is cached after first load
3. **Streaming**: Large file operations use streaming
4. **Connection Pooling**: Database connections are pooled (when applicable)

### Monitoring

- Request/response times are tracked
- Error rates are monitored
- Memory usage is logged
- Active connection counts are maintained

## Extensibility

### Plugin System

The architecture supports easy extension:

1. **Tool Plugins**: Add new tools by implementing `ToolDefinition`
2. **Resource Plugins**: Add new resources by implementing `ResourceDefinition`
3. **Middleware**: Add request/response middleware for cross-cutting concerns
4. **Transport**: Support for additional transport protocols

### Configuration Extensions

Add new configuration options:

1. Update the `ConfigSchema` in `src/types/index.ts`
2. Add environment variable handling in `src/utils/config.ts`
3. Update the `.env.example` file
4. Document the new options in README.md

## Best Practices

### Error Handling

- Always use try-catch blocks in tool handlers
- Log errors with appropriate context
- Return user-friendly error messages
- Include request IDs for error tracking

### Logging

- Use structured logging with context
- Include request IDs for tracing
- Log at appropriate levels (error, warn, info, debug)
- Never log sensitive information

### Testing

- Write tests before implementing features (TDD)
- Cover both happy path and error scenarios
- Use meaningful test descriptions
- Mock external dependencies properly

### Documentation

- Keep documentation up to date with code changes
- Include examples for all APIs
- Document configuration options thoroughly
- Provide troubleshooting guides for common issues