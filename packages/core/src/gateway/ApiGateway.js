"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiGateway = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const ConfigService_1 = require("../config/ConfigService");
let ApiGateway = class ApiGateway {
    logger;
    configService;
    config;
    routes = new Map();
    requestCounts = new Map();
    constructor(logger, configService) {
        this.logger = logger;
        this.configService = configService;
        this.initializeConfig();
        this.initializeRoutes();
    }
    initializeConfig() {
        this.config = {
            baseUrl: this.configService.get('API_GATEWAY_BASE_URL', 'http://localhost:8000'),
            timeout: this.configService.get('API_GATEWAY_TIMEOUT', 30000),
            retries: this.configService.get('API_GATEWAY_RETRIES', 3),
            rateLimit: {
                windowMs: this.configService.get('API_GATEWAY_RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
                maxRequests: this.configService.get('API_GATEWAY_RATE_LIMIT_MAX_REQUESTS', 100),
            },
            cors: {
                enabled: this.configService.get('API_GATEWAY_CORS_ENABLED', true),
                origins: this.configService.get('API_GATEWAY_CORS_ORIGINS', ['*']),
                methods: this.configService.get('API_GATEWAY_CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
                headers: this.configService.get('API_GATEWAY_CORS_HEADERS', ['Content-Type', 'Authorization']),
            },
            authentication: {
                enabled: this.configService.get('API_GATEWAY_AUTH_ENABLED', false),
                headerName: this.configService.get('API_GATEWAY_AUTH_HEADER', 'Authorization'),
                jwtSecret: this.configService.get('API_GATEWAY_JWT_SECRET', undefined),
            },
        };
    }
    initializeRoutes() {
        // Initialize common routes
        this.addRoute({
            path: '/health',
            method: 'GET',
            handler: 'HealthController.check',
        });
        this.addRoute({
            path: '/api/v1/agents',
            method: 'GET',
            handler: 'AgentController.list',
        });
        this.addRoute({
            path: '/api/v1/agents/:id',
            method: 'GET',
            handler: 'AgentController.get',
        });
        this.addRoute({
            path: '/api/v1/workflows',
            method: 'POST',
            handler: 'WorkflowController.create',
        });
        this.logger.log(`Initialized ${this.routes.size} routes, 'ApiGateway');
  }

  addRoute(route: RouteDefinition): void {`);
        const key = `${route.method}`, $, { route, path };
        this.routes.set(key, route);
        `
    this.logger.debug(`;
        Added;
        route: $;
        {
            key;
        }
        `, 'ApiGateway');
  }

  removeRoute(path: string, method: string): void {
    const key = ${method}:${path};
    this.routes.delete(key);`;
        this.logger.debug(Removed, route, $, { key } `, 'ApiGateway');
  }

  getRoute(path: string, method: string): RouteDefinition | undefined {
    const key = ${method}`, $, { path });
        return this.routes.get(key);
    }
    getAllRoutes() {
        return Array.from(this.routes.values());
    }
    async proxyRequest(request) {
        const startTime = Date.now();
        try {
            // Check rate limiting
            if (!this.checkRateLimit(request.headers?.['x-forwarded-for'] || 'anonymous')) {
                throw new Error('Rate limit exceeded');
            }
            // Validate authentication if enabled
            if (this.config.authentication.enabled) {
                await this.validateAuthentication(request.headers?.[this.config.authentication.headerName]);
            }
            // This is a placeholder implementation
            // In a real implementation, you would proxy the request to the appropriate service
            const response = {
                status: 200,
                statusText: 'OK',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: {},
                duration: Date.now() - startTime,
                timestamp: new Date(),
            };
            `
      this.logger.debug(Proxied request: ${request.method} ${request.url}`, 'ApiGateway';
            ;
            return response;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logger.logErrorSafe(Proxy, request, failed, $, { request, : .method } ` ${request.url}, error, 'ApiGateway');

      throw {
        ...(error instanceof Error ? error : new Error(String(error))),
        duration,
        timestamp: new Date(),
      };
    }
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;

    // Get or create request history for this client
    let requests = this.requestCounts.get(clientId) || [];

    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if under limit
    if (requests.length >= this.config.rateLimit.maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.requestCounts.set(clientId, requests);

    return true;
  }

  private async validateAuthentication(authHeader?: string): Promise<void> {
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    // This is a placeholder implementation
    // In a real implementation, you would validate JWT tokens or API keys
    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authentication format');
    }

    // Basic JWT validation placeholder
    const token = authHeader.substring(7);
    if (!token || token.length < 10) {
      throw new Error('Invalid token');
    }
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    routes: number;
    uptime: number;
    timestamp: Date;
  }> {
    try {
      const routes = this.routes.size;
      const uptime = process.uptime();
      const timestamp = new Date();

      // Check if all routes are accessible (placeholder)
      const status = routes > 0 ? 'healthy' : 'degraded';

      return {
        status,
        routes,
        uptime,
        timestamp,
      };
    } catch (error) {
      this.logger.logErrorSafe('Health check failed', error, 'ApiGateway');
      return {
        status: 'unhealthy',
        routes: this.routes.size,
        uptime: process.uptime(),
        timestamp: new Date(),
      };
    }
  }

  async getMetrics(): Promise<{
    totalRequests: number;
    activeConnections: number;
    errorRate: number;
    averageResponseTime: number;
    timestamp: Date;
  }> {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would track actual metrics
      const timestamp = new Date();

      return {
        totalRequests: 0,
        activeConnections: 0,
        errorRate: 0,
        averageResponseTime: 0,
        timestamp,
      };
    } catch (error) {
      this.logger.logErrorSafe('Metrics retrieval failed', error, 'ApiGateway');
      throw error;
    }
  }

  async reloadRoutes(): Promise<void> {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would reload routes from configuration
      this.logger.log('Routes reloaded', 'ApiGateway');
    } catch (error) {
      this.logger.logErrorSafe('Route reload failed', error, 'ApiGateway');
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      // Clear rate limiting cache
      this.requestCounts.clear();
      this.logger.log('Cache cleared', 'ApiGateway');
    } catch (error) {
      this.logger.logErrorSafe('Cache clear failed', error, 'ApiGateway');
      throw error;
    }
  }

  getConfig(): ApiGatewayConfig {
    return { ...this.config };
  }

  // CORS handling
  getCorsHeaders(): Record<string, string> {
    if (!this.config.cors.enabled) {
      return {};
    }

    return {
      'Access-Control-Allow-Origin': this.config.cors.origins.join(', '),
      'Access-Control-Allow-Methods': this.config.cors.methods.join(', '),
      'Access-Control-Allow-Headers': this.config.cors.headers.join(', '),
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'ok' | 'error'; details?: string }> {
    try {
      const health = await this.getHealthStatus();
      return {
        status: health.status === 'healthy' ? 'ok' : 'error',`, details, Routes, $, { health, : .routes } `, Uptime: ${health.uptime}`, s `
      };
    } catch (error) {
      return {
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default ApiGateway;
            );
        }
    }
};
exports.ApiGateway = ApiGateway;
exports.ApiGateway = ApiGateway = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        ConfigService_1.ConfigService])
], ApiGateway);
//# sourceMappingURL=ApiGateway.js.map