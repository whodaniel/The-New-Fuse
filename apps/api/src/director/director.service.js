/**
 * Director Service - System Orchestration and Coordination
 *
 * Central service responsible for coordinating all system components,
 * managing service discovery, load balancing, and ensuring system-wide
 * consistency and reliability.
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
var DirectorService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
let DirectorService = DirectorService_1 = class DirectorService {
    configService;
    moduleRef;
    logger = new Logger(DirectorService_1.name);
    serviceRegistry = new Map();
    healthChecks = new Map();
    systemStartTime = Date.now();
    constructor(configService, moduleRef) {
        this.configService = configService;
        this.moduleRef = moduleRef;
        this.initializeDirector();
    }
    /**
     * Initialize the director service and start monitoring
     */
    async initializeDirector() {
        this.logger.log('🎭 Director Service initializing...');
        // Register core services
        await this.discoverServices();
        // Start health monitoring
        this.startHealthMonitoring();
        // Initialize load balancers
        await this.initializeLoadBalancers();
        this.logger.log('✅ Director Service initialized successfully');
    }
    /**
     * Discover and register all available services
     */
    async discoverServices() {
        const services = [
            'AgentService',
            'WorkflowService',
            'LLMProviderService',
            'DatabaseService',
            'CacheService',
            'WebSocketGateway',
        ];
        for (const serviceName of services) {
            try {
                const service = this.moduleRef.get(serviceName);
                if (service) {
                    this.serviceRegistry.set(serviceName, service);
                    this.logger.log(`📋 Registered service: ${serviceName}`);
                }
            }
            catch (error) {
                this.logger.warn(`⚠️ Service not available: ${serviceName}`);
            }
        }
    }
    /**
     * Start health monitoring for all registered services
     */
    startHealthMonitoring() {
        const checkInterval = this.configService.get('HEALTH_CHECK_INTERVAL', 30000);
        for (const [serviceName] of this.serviceRegistry) {
            // Check health immediately
            this.checkServiceHealth(serviceName);
            // Set up periodic checks
            const interval = setInterval(() => {
                this.checkServiceHealth(serviceName);
            }, checkInterval);
            this.healthChecks.set(serviceName, interval);
        }
    }
    /**
     * Check the health of a specific service
     */
    async checkServiceHealth(serviceName) {
        const startTime = Date.now();
        const service = this.serviceRegistry.get(serviceName);
        if (!service) {
            this.logger.error(`❌ Service not found: ${serviceName}`);
            return;
        }
        try {
            // Check if service has health check method
            if (typeof service.isHealthy === 'function') {
                const isHealthy = await service.isHealthy();
                const responseTime = Date.now() - startTime;
                const health = {
                    name: serviceName,
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    responseTime,
                    lastChecked: new Date(),
                };
                this.logger.log(`💚 ${serviceName}: ${health.status} (${responseTime}ms)`);
            }
            else {
                // Basic availability check
                const responseTime = Date.now() - startTime;
                const health = {
                    name: serviceName,
                    status: 'healthy',
                    responseTime,
                    lastChecked: new Date(),
                };
                this.logger.log(`💚 ${serviceName}: available (${responseTime}ms)`);
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const health = {
                name: serviceName,
                status: 'unhealthy',
                responseTime,
                lastChecked: new Date(),
                error: error.message,
            };
            this.logger.error(`💔 ${serviceName}: ${error.message}`);
        }
    }
    /**
     * Initialize load balancers for different service types
     */
    async initializeLoadBalancers() {
        // Initialize agent load balancer
        if (this.serviceRegistry.has('AgentService')) {
            await this.initializeAgentLoadBalancer();
        }
        // Initialize workflow load balancer
        if (this.serviceRegistry.has('WorkflowService')) {
            await this.initializeWorkflowLoadBalancer();
        }
    }
    /**
     * Initialize agent load balancer
     */
    async initializeAgentLoadBalancer() {
        this.logger.log('⚖️ Initializing agent load balancer...');
        // Implementation would include:
        // - Agent capability assessment
        // - Load distribution algorithms
        // - Health-based routing
    }
    /**
     * Initialize workflow load balancer
     */
    async initializeWorkflowLoadBalancer() {
        this.logger.log('⚖️ Initializing workflow load balancer...');
        // Implementation would include:
        // - Workflow complexity analysis
        // - Resource requirement assessment
        // - Priority-based queuing
    }
    /**
     * Get comprehensive system metrics
     */
    async getSystemMetrics() {
        const services = Array.from(this.serviceRegistry.keys());
        const healthyServices = services.length; // Simplified for now
        return {
            totalServices: services.length,
            healthyServices,
            averageResponseTime: 150, // Would calculate from actual metrics
            uptime: Date.now() - this.systemStartTime,
            memoryUsage: process.memoryUsage().heapUsed,
            cpuUsage: process.cpuUsage().user,
        };
    }
    /**
     * Get health status of all services
     */
    async getAllServiceHealth() {
        const healthStatuses = [];
        for (const [serviceName] of this.serviceRegistry) {
            // In a real implementation, this would return cached health data
            healthStatuses.push({
                name: serviceName,
                status: 'healthy',
                responseTime: 100,
                lastChecked: new Date(),
            });
        }
        return healthStatuses;
    }
    /**
     * Coordinate service failover
     */
    async handleServiceFailover(serviceName, failedInstance) {
        this.logger.warn(`🔄 Handling failover for ${serviceName}, instance: ${failedInstance}`);
        // Implementation would include:
        // - Identify backup instances
        // - Redistribute load
        // - Update routing tables
        // - Notify monitoring systems
    }
    /**
     * Gracefully shutdown the director service
     */
    async onModuleDestroy() {
        this.logger.log('🛑 Shutting down Director Service...');
        // Clear all health check intervals
        for (const interval of this.healthChecks.values()) {
            clearInterval(interval);
        }
        this.healthChecks.clear();
        // Close service connections
        this.serviceRegistry.clear();
        this.logger.log('✅ Director Service shutdown complete');
    }
};
DirectorService = DirectorService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        ModuleRef])
], DirectorService);
export { DirectorService };
//# sourceMappingURL=director.service.js.map