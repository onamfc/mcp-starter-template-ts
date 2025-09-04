# Development Guide

This guide provides detailed information for developers working on the MCP starter template.

## Development Environment Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or yarn/pnpm equivalent)
- **Git**: For version control
- **Docker**: For containerized development (optional)

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/onamfc/mcp-starter-template.git
   cd mcp-starter-template
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your specific configuration
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Run tests to verify setup:**
   ```bash
   npm test
   ```

## Development Workflow

### Starting Development Server

```bash
npm run dev
```

This starts the server with hot reloading using `tsx watch`. The server will automatically restart when you modify source files.

### Running Tests

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Run tests with coverage:**
```bash
npm run test:coverage
```

**Run specific test files:**
```bash
npm test -- calculator.test.ts
```

### Code Quality

**Run linting:**
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

**Format code:**
```bash
npm run format
npm run format:check  # Check without formatting
```

**Type checking:**
```bash
npm run type-check
```

## Architecture Overview

### Core Components

1. **Server (`src/server.ts`)**: Main MCP server implementation
2. **Tools (`src/tools/`)**: Individual tool implementations
3. **Resources (`src/resources/`)**: Resource providers
4. **Utils (`src/utils/`)**: Shared utilities and helpers
5. **Types (`src/types/`)**: TypeScript type definitions

### Design Patterns

The template follows several key design patterns:

- **Dependency Injection**: Configuration and logger are injected into components
- **Factory Pattern**: Tools and resources are created through factory functions
- **Strategy Pattern**: Different tool implementations share a common interface
- **Observer Pattern**: Logging and metrics collection
- **Command Pattern**: Tool execution follows command pattern

### Adding New Features

#### Creating a New Tool

1. **Create the tool file:**
   ```typescript
   // src/tools/my-new-tool.ts
   import { ToolDefinition, ToolContext } from '../types';
   
   export const myNewTool: ToolDefinition = {
     name: 'my-new-tool',
     description: 'Description of what the tool does',
     inputSchema: {
       type: 'object',
       properties: {
         // Define parameters
       },
       required: ['requiredParam'],
     },
     handler: async (args, context) => {
       // Implementation
     },
   };
   ```

2. **Register the tool:**
   ```typescript
   // src/tools/setup.ts
   import { myNewTool } from './my-new-tool';
   
   const toolRegistry: ToolDefinition[] = [
     // existing tools...
     myNewTool,
   ];
   ```

3. **Add tests:**
   ```typescript
   // src/__tests__/tools/my-new-tool.test.ts
   import { myNewTool } from '../../tools/my-new-tool';
   
   describe('My New Tool', () => {
     // Write comprehensive tests
   });
   ```

4. **Update exports:**
   ```typescript
   // src/tools/index.ts
   export { myNewTool } from './my-new-tool';
   ```

#### Creating a New Resource

Follow a similar pattern for resources in the `src/resources/` directory.

### Testing Strategy

#### Unit Tests

- Test individual functions and classes in isolation
- Mock external dependencies
- Cover edge cases and error conditions
- Aim for high code coverage (80%+ minimum)

#### Integration Tests

- Test tool and resource handlers with real contexts
- Verify proper error handling and logging
- Test configuration loading and validation

#### Test Organization

```
src/__tests__/
├── setup.ts              # Global test configuration
├── server.test.ts         # Server integration tests
├── tools/                 # Tool-specific tests
│   ├── calculator.test.ts
│   └── filesystem.test.ts
└── utils/                 # Utility function tests
    ├── validation.test.ts
    └── errors.test.ts
```

## Debugging

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

### Using Debugger

For VS Code debugging, use the provided launch configuration:
```bash
npm run dev
# Then attach VS Code debugger to the Node.js process
```

### Common Debug Scenarios

**Tool not executing:**
1. Check tool registration in `src/tools/setup.ts`
2. Verify input schema matches provided arguments
3. Check logs for validation errors
4. Ensure proper error handling in tool handler

**Resource not accessible:**
1. Verify resource URI format
2. Check resource registration in `src/resources/setup.ts`
3. Review access permissions and context
4. Check for proper error handling

## Performance Considerations

### Memory Management

- Use streaming for large file operations
- Implement proper cleanup in tool handlers
- Monitor memory usage in long-running processes

### Logging Performance

- Use appropriate log levels (avoid debug in production)
- Consider structured logging for better performance
- Implement log rotation for long-running servers

### Error Handling Performance

- Avoid throwing errors in hot paths
- Use proper error boundaries
- Implement graceful degradation

## Security Guidelines

### Input Validation

- Always validate and sanitize user input
- Use Zod schemas for type validation
- Implement proper file path validation
- Prevent code injection in calculation tools

### File System Security

- Restrict file access to project directory
- Validate file paths to prevent traversal attacks
- Use proper file permissions
- Log all file system operations

### Logging Security

- Never log sensitive information (passwords, tokens)
- Implement log level filtering
- Use structured logging for better security monitoring
- Rotate logs regularly

## Deployment

### Production Build

```bash
npm run build
```

### Docker Deployment

**Build production image:**
```bash
docker build --target production -t mcp-server:latest .
```

**Run production container:**
```bash
docker run -p 3000:3000 --env-file .env mcp-server:latest
```

### Environment Considerations

**Development:**
- Enable debug logging
- Use hot reloading
- Mock external services

**Production:**
- Minimize log output
- Enable health checks
- Use production dependencies only
- Implement proper monitoring

## Contributing Guidelines

### Code Style

- Follow the existing TypeScript and ESLint configuration
- Use meaningful variable and function names
- Add comprehensive JSDoc comments
- Keep functions focused and single-purpose

### Commit Guidelines

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with tests
3. Run the full test suite
4. Update documentation if needed
5. Submit pull request with clear description

### Code Review Checklist

- [ ] All tests pass
- [ ] Code coverage meets requirements
- [ ] Documentation is updated
- [ ] Error handling is comprehensive
- [ ] Security considerations are addressed
- [ ] Performance impact is considered
