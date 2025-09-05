/**
 * Health check utilities
 * Provides health monitoring and status reporting for the MCP server
 */

import { createServer, Server as HttpServer } from 'http';
import { Config, HealthCheckResponse, ServerMetrics } from '../types/index.js';
import { log } from './logger.js';

/**
 * Health checker class
 */
export class HealthChecker {
  private server?: HttpServer;
  private startTime: number;
  private metrics: ServerMetrics;

  constructor(private config: Config) {
    this.startTime = Date.now();
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      activeConnections: 0,
      uptime: 0,
    };
  }

  /**
   * Start the health check server
   */
  public async start(): Promise<void> {
    if (!this.config.enableHealthCheck) {
      return;
    }

    const port = this.config.port + 1; // Use port + 1 for health checks

    this.server = createServer((req, res) => {
      if (req.url === '/health') {
        this.handleHealthCheck(req, res);
      } else if (req.url === '/metrics') {
        this.handleMetrics(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(port, this.config.host, () => {
        log.info(`Health check server listening on ${this.config.host}:${port}`);
        resolve();
      });

      this.server!.on('error', reject);
    });
  }

  /**
   * Stop the health check server
   */
  public async stop(): Promise<void> {
    if (this.server) {
      return new Promise(resolve => {
        this.server!.close(() => {
          log.info('Health check server stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Handle health check requests
   */
  private handleHealthCheck(req: unknown, res: any): void {
    const uptime = Date.now() - this.startTime;

    const healthResponse: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      version: '1.0.0',
      environment: this.config.environment,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthResponse, null, 2));
  }

  /**
   * Handle metrics requests
   */
  private handleMetrics(req: unknown, res: any): void {
    this.metrics.uptime = Date.now() - this.startTime;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics, null, 2));
  }

  /**
   * Record request metrics
   */
  public recordRequest(responseTime: number, hasError: boolean = false): void {
    this.metrics.requestCount++;

    if (hasError) {
      this.metrics.errorCount++;
    }

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.requestCount - 1) + responseTime) /
      this.metrics.requestCount;
  }

  /**
   * Update active connections count
   */
  public updateActiveConnections(count: number): void {
    this.metrics.activeConnections = count;
  }
}

/**
 * Create health checker instance
 */
export function createHealthChecker(config: Config): HealthChecker {
  return new HealthChecker(config);
}
