## Multi-stage Docker build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

## Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpuser -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=mcpuser:nodejs /app/dist ./dist
COPY --from=builder --chown=mcpuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mcpuser:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown mcpuser:nodejs logs

# Switch to non-root user
USER mcpuser

# Expose port (optional for MCP stdio transport)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('./dist/utils/config.js').validateConfig()" || exit 1

# Start the server
CMD ["npm", "start"]

## Development stage
FROM node:18-alpine AS development

# Install development dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose ports for development
EXPOSE 3000 3001

# Start development server
CMD ["npm", "run", "dev"]