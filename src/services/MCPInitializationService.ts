import { Injectable, OnModuleInit } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.js';
import { WorkflowMCPIntegrationService } from './WorkflowMCPIntegrationService.js';
import { AnalyticsIntegrationService } from './AnalyticsIntegrationService.js';
import { SchemaValidationService } from './SchemaValidationService.js';
import { Logger } from '../common/logger.service.js';

@Injectable()
export class MCPInitializationService implements OnModuleInit {
  constructor(
    private readonly mcpBroker: MCPBrokerService,
    private readonly workflowIntegration: WorkflowMCPIntegrationService,
    private readonly analytics: AnalyticsIntegrationService,
    private readonly schemaValidation: SchemaValidationService,
    private readonly logger: Logger
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.initializeMCPSystem();
    } catch (error) {
      this.logger.error('Failed to initialize MCP system:', error);
      throw error;
    }
  }

  private async initializeMCPSystem(): Promise<void> {
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

  private async initializeCoreMCP(): Promise<void> {
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

  private async registerSystemCapabilities(): Promise<void> {
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

  private async initializeIntegrations(): Promise<void> {
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

  private async validateSystemState(): Promise<void> {
    const checks = [
      this.validateMCPBroker(),
      this.validateWorkflowIntegration(),
      this.validateAnalytics(),
      this.validateSchemaSystem()
    ];

    const results = await Promise.allSettled(checks);
    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
      const errors = failures.map(f => (f as PromiseRejectedResult).reason.message);
      throw new Error(`System validation failed:\n${errors.join('\n')}`);
    }
  }

  private async validateMCPBroker(): Promise<void> {
    const status = await this.mcpBroker.getStatus();
    if (status !== 'ready') {
      throw new Error(`MCP Broker not ready. Status: ${status}`);
    }
  }

  private async validateWorkflowIntegration(): Promise<void> {
    const tools = await this.workflowIntegration.getAvailableMCPTools();
    if (tools.length === 0) {
      throw new Error('No MCP tools available for workflow integration');
    }
  }

  private async validateAnalytics(): Promise<void> {
    try {
      await this.analytics.trackToolUsage('system_validation');
    } catch (error) {
      throw new Error(`Analytics validation failed: ${error.message}`);
    }
  }

  private async validateSchemaSystem(): Promise<void> {
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
}