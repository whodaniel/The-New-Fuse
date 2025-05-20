import { Module } from '@nestjs/common';
import { MCPAgentServer } from '../mcp/MCPAgentServer.js';
import { WorkflowMonitoringService } from '../services/WorkflowMonitoringService.js';
import { WorkflowMCPIntegrationService } from '../services/WorkflowMCPIntegrationService.js';
import { AnalyticsIntegrationService } from '../services/AnalyticsIntegrationService.js';
import { SchemaValidationService } from '../services/SchemaValidationService.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { RedisService } from '../redis/redis.service.js';
import { Logger } from '../common/logger.service.js';

@Module({
  providers: [
    MCPAgentServer,
    WorkflowMonitoringService,
    WorkflowMCPIntegrationService,
    AnalyticsIntegrationService,
    SchemaValidationService,
    PrismaService,
    MetricsService,
    RedisService,
    Logger
  ],
  exports: [
    MCPAgentServer,
    WorkflowMonitoringService,
    WorkflowMCPIntegrationService,
    AnalyticsIntegrationService,
    SchemaValidationService
  ]
})
export class MCPWorkflowModule {
  constructor(
    private readonly workflowMCPIntegration: WorkflowMCPIntegrationService,
    private readonly analytics: AnalyticsIntegrationService,
    private readonly schemaValidation: SchemaValidationService,
    private readonly logger: Logger
  ) {
    this.initializeModule();
  }

  private async initializeModule(): Promise<void> {
    try {
      // Initialize MCP integration
      const tools = await this.workflowMCPIntegration.getAvailableMCPTools();
      this.logger.info(`Loaded ${tools.length} MCP tools`);

      // Initialize analytics
      await this.analytics.trackToolUsage('module_initialization');

      // Set up workflow validation hooks
      this.setupValidationHooks();

      this.logger.info('MCP Workflow Module initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MCP Workflow Module:', error);
      throw error;
    }
  }

  private setupValidationHooks(): void {
    // Add hooks for workflow validation before execution
    this.workflowMCPIntegration.onBeforeWorkflowExecution(async (workflow) => {
      const validation = await this.schemaValidation.validateWorkflow(workflow);
      if (!validation.valid) {
        throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
      }
    });

    // Add hooks for analytics after workflow completion
    this.workflowMCPIntegration.onWorkflowComplete(async (workflowId) => {
      await this.analytics.trackWorkflowPerformance(workflowId);
    });
  }
}