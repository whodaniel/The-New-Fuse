import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@the-new-fuse/database';
import { SelfImprovementController } from '../controllers/self-improvement.controller';
import { AgentFactory } from './agent.factory';
import { AgentsService } from './agents.service';
import { AnalyzerAgentService } from './analyzer.service';
import { ArchitectAgentService } from './architect.service';
import { CoordinatorAgentService } from './coordinator.service';
import { ImplementerAgentService } from './implementer.service';
import { ReviewerAgentService } from './reviewer.service';

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
    PrismaService,
    AgentsService,
    AgentFactory,
    // Mock UnifiedMonitoringService since it's typed as 'any'
    {
      provide: 'UnifiedMonitoringService',
      useValue: {
        recordMetric: (metric: string, value: any, tags: any) => {
          console.log(`[UnifiedMonitoringService] Record Metric: ${metric}`, value, tags);
        },
        captureError: (error: any, context: any) => {
          console.error(`[UnifiedMonitoringService] Capture Error:`, error, context);
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
    PrismaService,
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
