"use strict";
/**
 * Proxy Service
 * Handles routing and load balancing to backend services
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let ProxyService = ProxyService_1 = class ProxyService {
    httpService;
    configService;
    logger = new common_1.Logger(ProxyService_1.name);
    services = new Map();
    routeMappings = new Map();
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.initializeServices();
        this.initializeRouteMappings();
    }
    initializeServices() {
        // Register consolidated backend services
        // All services now route through the main API backend
        this.registerService({
            name: 'backend',
            baseUrl: this.configService.get('BACKEND_SERVICE_URL', 'http://localhost:3001'),
            healthPath: '/health',
            timeout: 30000,
            retries: 3,
        });
        // Legacy service registrations for backward compatibility
        this.registerService({
            name: 'webhooks',
            baseUrl: this.configService.get('BACKEND_SERVICE_URL', 'http://localhost:3001'),
            healthPath: '/health',
            timeout: 30000,
            retries: 3,
        });
        this.registerService({
            name: 'agents',
            baseUrl: this.configService.get('BACKEND_SERVICE_URL', 'http://localhost:3001'),
            healthPath: '/health',
            timeout: 30000,
            retries: 3,
        });
        this.logger.log(`Registered ${this.services.size} backend services`);
    }
    /**
     * Initialize intelligent route mappings for consolidated services
     */
    initializeRouteMappings() {
        // All routes now go to the main backend service
        // This replaces the need for separate gateway modules
        // Agent-related routes
        this.routeMappings.set(/^\/api\/agents?.*/, 'backend');
        this.routeMappings.set(/^\/api\/agent-bridge?.*/, 'backend');
        this.routeMappings.set(/^\/api\/agent-nft?.*/, 'backend');
        // Chat and communication routes
        this.routeMappings.set(/^\/api\/chat?.*/, 'backend');
        // MCP (Model Context Protocol) routes
        this.routeMappings.set(/^\/api\/mcp?.*/, 'backend');
        // A2A (Agent-to-Agent) protocol routes
        this.routeMappings.set(/^\/api\/a2a?.*/, 'backend');
        // Webhook routes
        this.routeMappings.set(/^\/api\/webhooks?.*/, 'backend');
        // Workflow routes
        this.routeMappings.set(/^\/api\/workflows?.*/, 'backend');
        // Default: all other API routes go to backend
        this.routeMappings.set(/^\/api\/.*/, 'backend');
        this.logger.log(`Initialized ${this.routeMappings.size} route mappings`);
    }
    /**
     * Determine which service should handle a given path
     */
    determineServiceForPath(path) {
        for (const [pattern, serviceName] of this.routeMappings.entries()) {
            if (pattern.test(path)) {
                return serviceName;
            }
        }
        return 'backend'; // Default fallback
    }
    registerService(config) {
        this.services.set(config.name, config);
        this.logger.log(`Registered service: ${config.name} -> ${config.baseUrl}`);
    }
    async proxyRequest(path, method, headers, body, query, serviceName // Optional: auto-detected if not provided
    ) {
        // Auto-detect service based on path if not provided
        const targetServiceName = serviceName || this.determineServiceForPath(path);
        const service = this.services.get(targetServiceName);
        if (!service) {
            throw new common_1.BadGatewayException(`Service '${targetServiceName}' not found for path: ${path}`);
        }
        const url = `${service.baseUrl}${path}`;
        const config = {
            method: method,
            url,
            headers: {
                ...headers,
                // Add gateway identification
                'X-Gateway': 'the-new-fuse-api-gateway',
                'X-Forwarded-By': 'api-gateway',
            },
            timeout: service.timeout || 30000,
            params: query,
        };
        if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.data = body;
        }
        try {
            this.logger.debug(`Proxying ${method.toUpperCase()} ${url}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.request(config));
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Proxy request failed for ${serviceName}:`, errorMessage);
            if (error instanceof Error && 'response' in error && typeof error.response === 'object' && 'status' in error.response && 'data' in error.response) {
                // Forward the error response from the backend service
                throw new common_1.BadGatewayException({
                    message: 'Backend service error',
                    service: serviceName,
                    statusCode: error.response.status,
                    error: error.response.data,
                });
            }
            throw new common_1.BadGatewayException({
                message: 'Service unavailable',
                service: serviceName,
                error: errorMessage,
            });
        }
    }
    async checkServiceHealth(serviceName) {
        const service = this.services.get(serviceName);
        if (!service)
            return false;
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${service.baseUrl}${service.healthPath}`, {
                timeout: 5000,
            }));
            return response.status === 200;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`Health check failed for ${serviceName}: ${errorMessage}`);
            return false;
        }
    }
    async getAllServicesHealth() {
        const healthChecks = Array.from(this.services.keys()).map(async (serviceName) => {
            const isHealthy = await this.checkServiceHealth(serviceName);
            return [serviceName, isHealthy];
        });
        const results = await Promise.all(healthChecks);
        return Object.fromEntries(results);
    }
    getServiceConfig(serviceName) {
        return this.services.get(serviceName);
    }
    getAllServices() {
        return Array.from(this.services.values());
    }
};
exports.ProxyService = ProxyService;
exports.ProxyService = ProxyService = ProxyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], ProxyService);
//# sourceMappingURL=proxy.service.js.map