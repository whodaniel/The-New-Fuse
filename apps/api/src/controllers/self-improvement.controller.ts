import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AnalyzerAgentService } from '../agents/analyzer.service';
import { ArchitectAgentService } from '../agents/architect.service';
import { CoordinatorAgentService } from '../agents/coordinator.service';
import { ImplementerAgentService } from '../agents/implementer.service';
import { ReviewerAgentService } from '../agents/reviewer.service';

@Controller('self-improvement')
export class SelfImprovementController {
  private readonly logger = new Logger(SelfImprovementController.name);

  constructor(
    private readonly coordinator: CoordinatorAgentService,
    private readonly analyzer: AnalyzerAgentService,
    private readonly architect: ArchitectAgentService,
    private readonly implementer: ImplementerAgentService,
    private readonly reviewer: ReviewerAgentService
  ) {}

  @Post('cycle/start')
  async startCycle() {
    this.logger.log('Starting self-improvement cycle via API...');

    const cycle = await this.coordinator.startSelfImprovementCycle();

    return {
      success: true,
      cycleId: cycle.id,
      status: cycle.status,
      message: 'Self-improvement cycle started',
    };
  }

  @Get('cycle/status')
  async getCycleStatus() {
    const cycle = await this.coordinator.getCurrentCycle();

    if (!cycle) {
      return {
        active: false,
        message: 'No active cycle',
      };
    }

    const progress = await this.coordinator.trackProgress();

    return {
      active: true,
      cycleId: cycle.id,
      status: cycle.status,
      phase: cycle.phase,
      progress,
      metrics: cycle.metrics,
    };
  }

  @Get('cycle/report')
  async getCycleReport() {
    try {
      const report = await this.coordinator.getCycleReport();

      return {
        success: true,
        report,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  @Get('chat')
  async getChatHistory() {
    const chatHistory = await this.coordinator.getChatHistory();

    return {
      success: true,
      messages: chatHistory,
      count: chatHistory.length,
    };
  }

  @Post('analyze')
  async runAnalysis() {
    this.logger.log('Running codebase analysis...');

    const report = await this.analyzer.scanCodebase();

    return {
      success: true,
      analysis: {
        totalIssues: report.issues.length,
        criticalIssues: report.metrics.criticalIssues,
        highIssues: report.metrics.highIssues,
        technicalDebtScore: report.metrics.technicalDebtScore,
        topIssues: report.prioritizedIssues.slice(0, 5),
      },
    };
  }

  @Post('architecture')
  async reviewArchitecture() {
    this.logger.log('Running architecture review...');

    const review = await this.architect.reviewArchitecture();

    return {
      success: true,
      review: {
        decisions: review.decisions.length,
        missingFeatures: review.missingFeatures,
        topDecisions: review.decisions.slice(0, 5),
        capabilities: review.capabilities,
      },
    };
  }

  @Post('implement')
  async implement(@Body() body: { issue: any }) {
    this.logger.log('Implementing improvement...');

    const result = await this.implementer.implementQuickFix(body.issue);

    return {
      success: result.success,
      implementation: result,
    };
  }

  @Post('review')
  async review(@Body() body: { implementation: any }) {
    this.logger.log('Reviewing implementation...');

    const review = await this.reviewer.reviewImplementation(body.implementation);

    return {
      success: true,
      review: {
        approved: review.approved,
        score: review.score,
        decision: review.decision,
        feedback: review.feedback,
        criticalIssues: review.securityIssues.filter((s) => s.severity === 'critical').length,
      },
    };
  }

  @Get('agents/status')
  async getAgentsStatus() {
    return {
      success: true,
      agents: [
        {
          name: 'Analyzer',
          status: 'active',
          description: 'Scans codebase for issues and generates improvement suggestions',
        },
        {
          name: 'Architect',
          status: 'active',
          description: 'Reviews architecture and suggests refactoring opportunities',
        },
        {
          name: 'Implementer',
          status: 'active',
          description: 'Implements approved improvements and creates tests',
        },
        {
          name: 'Reviewer',
          status: 'active',
          description: 'Reviews code for bugs, security issues, and quality',
        },
        {
          name: 'Coordinator',
          status: 'active',
          description: 'Orchestrates the entire self-improvement workflow',
        },
      ],
    };
  }
}
