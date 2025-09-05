# MCP Starter Template

A comprehensive starter template for building Model Context Protocol (MCP) servers with TypeScript. This template provides a solid foundation for developers of all skill levels to quickly bootstrap production-ready MCP projects.

## Features

- **TypeScript First**: Complete type safety with comprehensive type definitions
- **Production Ready**: Robust error handling, logging, and validation
- **Modular Architecture**: Clean separation of concerns following SOLID principles
- **Comprehensive Testing**: Unit tests with Jest and high coverage standards
- **Docker Support**: Containerization for easy deployment
- **CI/CD Ready**: GitHub Actions workflows included
- **Developer Friendly**: Extensive documentation and debugging tools
- **Security Focused**: Input validation and secure file operations
- **Health Monitoring**: Built-in health checks and metrics

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher (or yarn/pnpm equivalent)

### Installation

Choose your preferred package manager:

**Using npm:**
```bash
git clone https://github.com/onamfc/mcp-starter-template-ts.git
cd mcp-starter-template-ts
npm install
npm run build
npm start
```

**Using yarn:**
```bash
git clone https://github.com/onamfc/mcp-starter-template-ts.git
cd mcp-starter-template-ts
yarn install
yarn build
yarn start
```

**Using pnpm:**
```bash
git clone https://github.com/onamfc/mcp-starter-template-ts.git
cd mcp-starter-template-ts
pnpm install
pnpm build
pnpm start
```

### Development Mode

For development with hot reloading:

```bash
npm run dev
```

This will start the server with automatic restarts when you modify source files.

## Project Structure

```
src/
├── server.ts              # Main MCP server implementation
├── types/                 # TypeScript type definitions
│   └── index.ts
├── tools/                 # MCP tools implementation
│   ├── setup.ts           # Tool registration and management
│   ├── calculator.ts      # Mathematical calculations
│   ├── filesystem.ts      # File system operations
│   ├── text-processing.ts # Text manipulation and analysis
│   └── weather.ts         # Weather information (mock)
├── resources/             # MCP resources implementation
│   ├── setup.ts           # Resource registration and management
│   ├── config.ts          # Configuration access
│   ├── docs.ts            # Documentation resource
│   └── logs.ts            # Logs access
├── utils/                 # Utility functions
│   ├── config.ts          # Configuration management
│   ├── logger.ts          # Structured logging
│   ├── validation.ts      # Input validation
│   ├── errors.ts          # Error handling
│   └── health.ts          # Health check utilities
└── __tests__/             # Test files
    ├── server.test.ts
    ├── tools/
    └── utils/
```

## Configuration

The server can be configured through environment variables. Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000
HOST=localhost
LOG_LEVEL=info
NODE_ENV=development

# Feature Flags
ENABLE_HEALTH_CHECK=true

# Security
MAX_REQUEST_SIZE=10mb
CORS_ORIGINS=*

# External Services (if needed)
# WEATHER_API_KEY=your_api_key_here
# DATABASE_URL=your_database_url_here
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | 3000 | No |
| `HOST` | Server host address | localhost | No |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | info | No |
| `NODE_ENV` | Environment (development, production, test) | development | No |
| `ENABLE_HEALTH_CHECK` | Enable health check endpoint | true | No |
| `MAX_REQUEST_SIZE` | Maximum request body size | 10mb | No |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | * | No |

## Available Tools

### Calculator (`calculate`)
Perform mathematical calculations with support for basic arithmetic operations.

**Parameters:**
- `expression` (string, required): Mathematical expression to evaluate
- `precision` (number, optional): Number of decimal places (default: 2)

**Example:**
```json
{
  "name": "calculate",
  "arguments": {
    "expression": "2 + 3 * 4",
    "precision": 2
  }
}
```

### File System (`filesystem`)
Read and write files within the project directory with security restrictions.

**Parameters:**
- `operation` (string, required): Operation type (read, write, list, exists)
- `path` (string, required): File or directory path (relative to project root)
- `content` (string, optional): Content to write (required for write operation)
- `encoding` (string, optional): File encoding (utf8, base64, default: utf8)

**Example:**
```json
{
  "name": "filesystem",
  "arguments": {
    "operation": "read",
    "path": "package.json"
  }
}
```

### Text Processing (`text-processing`)
Process and analyze text with various operations.

**Parameters:**
- `operation` (string, required): Operation type (count, uppercase, lowercase, reverse, wordcount, sentiment)
- `text` (string, required): Text content to process
- `options` (object, optional): Additional options for the operation

**Example:**
```json
{
  "name": "text-processing",
  "arguments": {
    "operation": "sentiment",
    "text": "I love this amazing weather today!"
  }
}
```

### Weather (`weather`)
Get current weather information and forecasts (mock implementation).

**Parameters:**
- `location` (string, required): Location name or coordinates
- `units` (string, optional): Temperature units (metric, imperial, kelvin, default: metric)
- `forecast` (boolean, optional): Include 5-day forecast (default: false)

**Example:**
```json
{
  "name": "weather",
  "arguments": {
    "location": "New York, NY",
    "units": "metric",
    "forecast": true
  }
}
```

## Available Resources

### Configuration (`resource://config/current`)
Access current application configuration and settings.

### Documentation (`resource://docs/api`)
Complete API documentation and usage examples.

### Logs (`resource://logs/recent`)
Recent application logs and events.

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts
- `npm run health` - Check server health
- `npm run validate-config` - Validate configuration

### Adding New Tools

1. Create a new file in `src/tools/your-tool.ts`
2. Implement the `ToolDefinition` interface
3. Add comprehensive error handling and logging
4. Register the tool in `src/tools/setup.ts`
5. Add tests in `src/__tests__/tools/your-tool.test.ts`

**Example tool structure:**
```typescript
export const yourTool: ToolDefinition = {
  name: 'your-tool',
  description: 'Description of what your tool does',
  inputSchema: {
    type: 'object',
    properties: {
      // Define your parameters here
    },
    required: ['requiredParam'],
  },
  handler: async (args, context) => {
    // Implement your tool logic here
    // Always include proper error handling and logging
  },
};
```

### Adding New Resources

1. Create a new file in `src/resources/your-resource.ts`
2. Implement the `ResourceDefinition` interface
3. Add the resource to `src/resources/setup.ts`
4. Add tests for the resource

### Testing

Run the complete test suite:
```bash
npm test
```

Run tests in watch mode during development:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

### Code Quality

This project includes comprehensive code quality tools:

- **ESLint**: Linting with TypeScript support
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Jest**: Testing framework

Run all quality checks:
```bash
npm run lint && npm run format:check && npm run type-check
```

## Docker Support

### Building the Docker Image

```bash
docker build -t mcp-server .
```

### Running with Docker

```bash
docker run -p 3000:3000 mcp-server
```

### Using Docker Compose

For development with additional services:

```bash
docker-compose up --build
```

## Production Deployment

### Build for Production

```bash
npm run build
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure appropriate log levels
3. Set up proper CORS origins
4. Configure external service credentials
5. Set up monitoring and alerting

### Health Monitoring

The server includes built-in health check endpoints:

- Health status: `GET http://localhost:3001/health`
- Metrics: `GET http://localhost:3001/metrics`

### Security Considerations

- All file operations are restricted to the project directory
- Input validation is performed on all tool parameters
- Expressions in calculator tool are sanitized to prevent code injection
- Request logging includes tracking for security auditing
- Error messages do not expose sensitive system information

## Troubleshooting

### Common Issues

**Server won't start:**
- Check that the port is not already in use
- Verify Node.js version (must be 18.0.0 or higher)
- Run `npm run validate-config` to check configuration

**Tools not working:**
- Check the logs for detailed error messages
- Verify input parameters match the tool schema
- Ensure file paths are relative and within project directory

**Build failures:**
- Run `npm run clean` to remove old build artifacts
- Check for TypeScript errors with `npm run type-check`
- Verify all dependencies are installed

**Test failures:**
- Make sure you're in the project root directory
- Check that all environment variables are set correctly
- Run tests individually to isolate issues: `npm test -- --testNamePattern="specific test"`

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

### Getting Help

1. Check the [troubleshooting section](#troubleshooting) above
2. Review the API documentation at `resource://docs/api`
3. Check recent logs at `resource://logs/recent`
4. Open an issue on the project repository

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes with tests
4. Run the full test suite: `npm test`
5. Run quality checks: `npm run lint && npm run format:check && npm run type-check`
6. Commit your changes with a descriptive message
7. Push to your fork and submit a pull request

### Code Standards

- Follow the existing code style and patterns
- Add comprehensive tests for new features
- Include JSDoc comments for all public functions
- Update documentation for any API changes
- Ensure all tests pass and coverage remains high

### Commit Message Format

Use conventional commit format:
- `feat: add new weather tool`
- `fix: resolve validation error in calculator`
- `docs: update installation instructions`
- `test: add tests for file system tool`
- `chore: update dependencies`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

## Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs or request features via GitHub issues
- **Discussions**: Join community discussions for questions and ideas

## Roadmap

- [ ] Add more built-in tools (HTTP client, database operations)
- [ ] Implement plugin system for external tools
- [ ] Add WebSocket transport support
- [ ] Create web-based admin interface
- [ ] Add metrics and monitoring dashboard
- [ ] Implement rate limiting and request quotas
- [ ] Add authentication and authorization
- [ ] Create tool marketplace integration
