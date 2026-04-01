import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DrizzleService } from '@the-new-fuse/database';
import { SelfImprovementController } from '../controllers/self-improvement.controller';
import { AgentFactory } from './agent.factory';
import { AgentsService } from './agents.service';
import { AnalyzerAgentService } from './analyzer.service';
import { ArchitectAgentService } from './architect.service';
import { CoordinatorAgentService } from './coordinator.service';
import { ImplementerAgentService } from './implementer.service';
import { ReviewerAgentService } from './reviewer.service';

const logger = new Logger('UnifiedMonitoringService');

/**
 * Self-Improvement Agents Module
 *
 * This module contains a swarm of AI agents that work together to analyze,
 * suggest, and implement improvements to The New Fuse framework itself.
 *
 * Agent Hierarchy:
 * - Coordinator: Orchestrates the entire improvement workflow
 * - Analyzer: Scans codebase for issues and bottlenecks
 * - Architect: Reviews architecture and suggests improvements
 * - Implementer: Writes code improvements and tests
 * - Reviewer: Reviews code for quality and security
 */
@Module({
  imports: [ConfigModule],
  controllers: [SelfImprovementController],
  providers: [
    DrizzleService,
    AgentsService,
    AgentFactory,
    // Mock UnifiedMonitoringService - TODO: Replace with actual implementation
    {
      provide: 'UnifiedMonitoringService',
      useValue: {
        recordMetric: (metric: string, value: any, tags: any) => {
          logger.log(`Record Metric: ${metric}`, { value, tags });
        },
        captureError: (error: any, context: any) => {
          logger.error(`Capture Error: ${error instanceof Error ? error.message : String(error)}`, context);
        },
      },
    },
    AnalyzerAgentService,
    ArchitectAgentService,
    ImplementerAgentService,
    ReviewerAgentService,
    CoordinatorAgentService,
  ],
  exports: [
    DrizzleService,
    AgentsService,
    AgentFactory,
    AnalyzerAgentService,
    ArchitectAgentService,
    ImplementerAgentService,
    ReviewerAgentService,
    CoordinatorAgentService,
  ],
})
export class AgentsModule {}
