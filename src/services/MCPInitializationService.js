var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { WorkflowMCPIntegrationService } from './WorkflowMCPIntegrationService.js';
import { AnalyticsIntegrationService } from './AnalyticsIntegrationService.js';
import { SchemaValidationService } from './SchemaValidationService.js';
import { Logger } from '../common/logger.service.js';
let MCPInitializationService = class MCPInitializationService {
    mcpBroker;
    workflowIntegration;
    analytics;
    schemaValidation;
    logger;
    constructor(mcpBroker, workflowIntegration, analytics, schemaValidation, logger) {
        this.mcpBroker = mcpBroker;
        this.workflowIntegration = workflowIntegration;
        this.analytics = analytics;
        this.schemaValidation = schemaValidation;
        this.logger = logger;
    }
    async onModuleInit() {
        try {
            await this.initializeMCPSystem();
        }
        catch (error) {
            this.logger.error('Failed to initialize MCP system:', error);
            throw error;
        }
    }
    async initializeMCPSystem() {
        // Step 1: Initialize core MCP services
        await this.initializeCoreMCP();
        // Step 2: Register system capabilities
        await this.registerSystemCapabilities();
        // Step 3: Initialize integrations
        await this.initializeIntegrations();
        // Step 4: Validate system state
        await this.validateSystemState();
        this.logger.info('MCP system initialization complete');
    }
    async initializeCoreMCP() {
        await this.mcpBroker.initialize({
            serverTypes: ['agent', 'workflow', 'analytics'],
            redisConfig: {
                enablePubSub: true,
                enableCache: true
            },
            security: {
                enableAuthentication: true,
                enableEncryption: true
            }
        });
    }
    async registerSystemCapabilities() {
        const systemCapabilities = [
            {
                name: 'workflow_execution',
                description: 'Execute and manage workflows',
                version: '1.0.0'
            },
            {
                name: 'analytics_tracking',
                description: 'Track and analyze system metrics',
                version: '1.0.0'
            },
            {
                name: 'schema_validation',
                description: 'Validate workflow and agent schemas',
                version: '1.0.0'
            }
        ];
        for (const capability of systemCapabilities) {
            await this.mcpBroker.executeDirective('agent', 'registerCapability', capability);
        }
    }
    async initializeIntegrations() {
        // Initialize workflow integration
        const tools = await this.workflowIntegration.getAvailableMCPTools();
        this.logger.info(`Registered ${tools.length} MCP tools for workflow integration`);
        // Initialize analytics
        await this.analytics.trackToolUsage('system_initialization');
        // Set up schema validation
        const validationResult = await this.schemaValidation.validateAgent({
            id: 'system',
            name: 'MCP System',
            type: 'system',
            capabilities: ['workflow_execution', 'analytics_tracking', 'schema_validation'],
            status: 'active'
        });
        if (!validationResult.valid) {
            throw new Error(`System agent validation failed: ${validationResult.errors.join(', ')}`);
        }
    }
    async validateSystemState() {
        const checks = [
            this.validateMCPBroker(),
            this.validateWorkflowIntegration(),
            this.validateAnalytics(),
            this.validateSchemaSystem()
        ];
        const results = await Promise.allSettled(checks);
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            const errors = failures.map(f => f.reason.message);
            throw new Error(`System validation failed:\n${errors.join('\n')}`);
        }
    }
    async validateMCPBroker() {
        const status = await this.mcpBroker.getStatus();
        if (status !== 'ready') {
            throw new Error(`MCP Broker not ready. Status: ${status}`);
        }
    }
    async validateWorkflowIntegration() {
        const tools = await this.workflowIntegration.getAvailableMCPTools();
        if (tools.length === 0) {
            throw new Error('No MCP tools available for workflow integration');
        }
    }
    async validateAnalytics() {
        try {
            await this.analytics.trackToolUsage('system_validation');
        }
        catch (error) {
            throw new Error(`Analytics validation failed: ${error.message}`);
        }
    }
    async validateSchemaSystem() {
        const testWorkflow = {
            id: 'test',
            name: 'Test Workflow',
            version: '1.0.0',
            tasks: []
        };
        const validation = await this.schemaValidation.validateWorkflow(testWorkflow);
        if (!validation.valid) {
            throw new Error(`Schema validation system check failed: ${validation.errors.join(', ')}`);
        }
    }
};
MCPInitializationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MCPBrokerService,
        WorkflowMCPIntegrationService,
        AnalyticsIntegrationService,
        SchemaValidationService,
        Logger])
], MCPInitializationService);
export { MCPInitializationService };
