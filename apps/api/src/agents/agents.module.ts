import { Module } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
import { AnalyzerAgentService } from './analyzer.service';
import { ArchitectAgentService } from './architect.service';
import { ImplementerAgentService } from './implementer.service';
import { ReviewerAgentService } from './reviewer.service';
import { CoordinatorAgentService } from './coordinator.service';
import { SelfImprovementController } from '../controllers/self-improvement.controller';

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
  controllers: [SelfImprovementController],
  providers: [
    PrismaService,
    AnalyzerAgentService,
    ArchitectAgentService,
    ImplementerAgentService,
    ReviewerAgentService,
    CoordinatorAgentService,
  ],
  exports: [
    PrismaService,
    AnalyzerAgentService,
    ArchitectAgentService,
    ImplementerAgentService,
    ReviewerAgentService,
    CoordinatorAgentService,
  ],
})
export class AgentsModule {}