import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { AnalyzerAgentService } from './analyzer.service';
import { ArchitectAgentService } from './architect.service';
import { ImplementerAgentService } from './implementer.service';
import { ReviewerAgentService } from './reviewer.service';

interface ImprovementCycle {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  phase: 'analysis' | 'architecture' | 'implementation' | 'review' | 'deployment';
  improvements: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    assignedAgent: string;
    startTime: Date;
    endTime?: Date;
    result?: any;
  }>;
  metrics: {
    totalIssuesFound: number;
    issuesFixed: number;
    featuresAdded: number;
    testsCreated: number;
    codeReviewScore: number;
  };
  logs: Array<{
    timestamp: Date;
    agent: string;
    message: string;
    level: 'info' | 'warning' | 'error';
  }>;
}

interface ChatMessage {
  from: string;
  to: string;
  message: string;
  timestamp: Date;
  metadata?: any;
}

@Injectable()
export class CoordinatorAgentService {
  private readonly logger = new Logger(CoordinatorAgentService.name);
  private currentCycle: ImprovementCycle | null = null;
  private chatHistory: ChatMessage[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyzer: AnalyzerAgentService,
    private readonly architect: ArchitectAgentService,
    private readonly implementer: ImplementerAgentService,
    private readonly reviewer: ReviewerAgentService
  ) {}

  async startSelfImprovementCycle(): Promise<ImprovementCycle> {
    this.logger.log('🚀 Starting self-improvement cycle...');

    const cycle: ImprovementCycle = {
      id: `cycle-${Date.now()}`,
      startTime: new Date(),
      status: 'running',
      phase: 'analysis',
      improvements: [],
      metrics: {
        totalIssuesFound: 0,
        issuesFixed: 0,
        featuresAdded: 0,
        testsCreated: 0,
        codeReviewScore: 0,
      },
      logs: [],
    };

    this.currentCycle = cycle;
    this.addLog('Coordinator', 'Self-improvement cycle initiated', 'info');

    try {
      // Phase 1: Analysis
      await this.runAnalysisPhase(cycle);

      // Phase 2: Architecture Review
      await this.runArchitecturePhase(cycle);

      // Phase 3: Implementation (top 3 improvements)
      await this.runImplementationPhase(cycle);

      // Phase 4: Code Review
      await this.runReviewPhase(cycle);

      // Phase 5: Deployment (approve changes)
      await this.runDeploymentPhase(cycle);

      cycle.status = 'completed';
      cycle.endTime = new Date();

      this.addLog('Coordinator', 'Self-improvement cycle completed successfully', 'info');
    } catch (error) {
      cycle.status = 'failed';
      cycle.endTime = new Date();
      this.addLog('Coordinator', `Cycle failed: ${error.message}`, 'error');
    }

    await this.storeCycle(cycle);
    return cycle;
  }

  private async runAnalysisPhase(cycle: ImprovementCycle): Promise<void> {
    cycle.phase = 'analysis';
    this.addLog('Coordinator', 'Starting analysis phase...', 'info');
    this.sendMessage('Coordinator', 'Analyzer', 'Please scan the codebase for issues');

    const analysisStart = Date.now();
    const report = await this.analyzer.scanCodebase();
    const analysisDuration = Date.now() - analysisStart;

    this.sendMessage(
      'Analyzer',
      'Coordinator',
      `Analysis complete: Found ${report.issues.length} issues in ${analysisDuration}ms`
    );

    cycle.metrics.totalIssuesFound = report.issues.length;

    // Create improvement tasks from top issues
    report.prioritizedIssues.slice(0, 10).forEach((issue) => {
      cycle.improvements.push({
        id: issue.id,
        title: issue.description,
        status: 'pending',
        assignedAgent: 'Implementer',
        startTime: new Date(),
      });
    });

    this.addLog('Analyzer', `Found ${report.issues.length} issues, prioritized top 10`, 'info');
  }

  private async runArchitecturePhase(cycle: ImprovementCycle): Promise<void> {
    cycle.phase = 'architecture';
    this.addLog('Coordinator', 'Starting architecture review phase...', 'info');
    this.sendMessage(
      'Coordinator',
      'Architect',
      'Please review architecture and suggest improvements'
    );

    const review = await this.architect.reviewArchitecture();

    this.sendMessage(
      'Architect',
      'Coordinator',
      `Architecture review complete: ${review.decisions.length} decisions, ${review.missingFeatures.length} missing features`
    );

    // Add architectural improvements to the cycle
    review.decisions.slice(0, 3).forEach((decision) => {
      cycle.improvements.push({
        id: decision.id,
        title: decision.title,
        status: 'pending',
        assignedAgent: 'Implementer',
        startTime: new Date(),
      });
    });

    this.addLog(
      'Architect',
      `Proposed ${review.decisions.length} architecture improvements`,
      'info'
    );
  }

  private async runImplementationPhase(cycle: ImprovementCycle): Promise<void> {
    cycle.phase = 'implementation';
    this.addLog('Coordinator', 'Starting implementation phase...', 'info');

    // Implement top 3 improvements
    const toImplement = cycle.improvements.filter((i) => i.status === 'pending').slice(0, 3);

    for (const improvement of toImplement) {
      this.sendMessage('Coordinator', 'Implementer', `Please implement: ${improvement.title}`);

      improvement.status = 'in_progress';

      try {
        const result = await this.implementer.implementQuickFix({
          file: 'auto-detected',
          description: improvement.title,
          suggestion: 'Auto-implementation',
        });

        improvement.status = 'completed';
        improvement.endTime = new Date();
        improvement.result = result;

        if (result.success) {
          cycle.metrics.issuesFixed++;
          cycle.metrics.testsCreated += result.testsCreated.length;

          this.sendMessage(
            'Implementer',
            'Coordinator',
            `Implemented successfully: ${result.filesModified.length} files modified`
          );

          this.addLog('Implementer', `Fixed: ${improvement.title}`, 'info');
        } else {
          this.sendMessage('Implementer', 'Coordinator', `Implementation failed: ${result.error}`);

          this.addLog('Implementer', `Failed: ${improvement.title} - ${result.error}`, 'error');
        }
      } catch (error) {
        improvement.status = 'failed';
        this.addLog(
          'Implementer',
          `Error implementing ${improvement.title}: ${error.message}`,
          'error'
        );
      }
    }
  }

  private async runReviewPhase(cycle: ImprovementCycle): Promise<void> {
    cycle.phase = 'review';
    this.addLog('Coordinator', 'Starting review phase...', 'info');

    const completedImprovements = cycle.improvements.filter((i) => i.status === 'completed');

    for (const improvement of completedImprovements) {
      if (!improvement.result) continue;

      this.sendMessage(
        'Coordinator',
        'Reviewer',
        `Please review implementation: ${improvement.title}`
      );

      const review = await this.reviewer.reviewImplementation({
        taskId: improvement.id,
        filesModified: improvement.result.filesModified || [],
        testsCreated: improvement.result.testsCreated || [],
      });

      cycle.metrics.codeReviewScore = (cycle.metrics.codeReviewScore + review.score) / 2;

      if (review.approved) {
        this.sendMessage(
          'Reviewer',
          'Coordinator',
          `Approved: ${improvement.title} (score: ${review.score}/100)`
        );

        this.addLog('Reviewer', `Approved: ${improvement.title}`, 'info');
      } else {
        this.sendMessage(
          'Reviewer',
          'Coordinator',
          `Rejected: ${improvement.title} - ${review.decision}`
        );

        this.addLog('Reviewer', `Rejected: ${improvement.title}`, 'warning');
      }
    }
  }

  private async runDeploymentPhase(cycle: ImprovementCycle): Promise<void> {
    cycle.phase = 'deployment';
    this.addLog('Coordinator', 'Starting deployment phase...', 'info');

    const approvedImprovements = cycle.improvements.filter(
      (i) => i.status === 'completed' && i.result?.success
    );

    this.logger.log(`Deploying ${approvedImprovements.length} approved improvements`);

    // In a real system, this would create PRs or deploy changes
    for (const improvement of approvedImprovements) {
      this.addLog('Coordinator', `Deployed: ${improvement.title}`, 'info');
    }

    this.broadcastMessage(
      'Coordinator',
      `Deployment complete: ${approvedImprovements.length} improvements deployed`
    );
  }

  private addLog(agent: string, message: string, level: 'info' | 'warning' | 'error'): void {
    if (!this.currentCycle) return;

    this.currentCycle.logs.push({
      timestamp: new Date(),
      agent,
      message,
      level,
    });

    const emoji = level === 'info' ? '📝' : level === 'warning' ? '⚠️' : '❌';
    this.logger.log(`${emoji} [${agent}] ${message}`);
  }

  private sendMessage(from: string, to: string, message: string, metadata?: any): void {
    const chatMessage: ChatMessage = {
      from,
      to,
      message,
      timestamp: new Date(),
      metadata,
    };

    this.chatHistory.push(chatMessage);
    this.logger.log(`💬 ${from} → ${to}: ${message}`);
  }

  private broadcastMessage(from: string, message: string): void {
    ['Analyzer', 'Architect', 'Implementer', 'Reviewer'].forEach((agent) => {
      this.sendMessage(from, agent, message);
    });
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    return this.chatHistory;
  }

  async getCurrentCycle(): Promise<ImprovementCycle | null> {
    return this.currentCycle;
  }

  async getCycleReport(): Promise<{
    summary: string;
    metrics: ImprovementCycle['metrics'];
    improvements: Array<{ title: string; status: string }>;
    chatLog: ChatMessage[];
    timeline: Array<{ time: Date; event: string }>;
  }> {
    if (!this.currentCycle) {
      throw new Error('No active cycle');
    }

    const cycle = this.currentCycle;
    const duration = cycle.endTime
      ? (cycle.endTime.getTime() - cycle.startTime.getTime()) / 1000
      : 0;

    const summary = `
Self-Improvement Cycle Report
==============================

Status: ${cycle.status}
Duration: ${duration}s
Phase: ${cycle.phase}

Metrics:
- Total Issues Found: ${cycle.metrics.totalIssuesFound}
- Issues Fixed: ${cycle.metrics.issuesFixed}
- Features Added: ${cycle.metrics.featuresAdded}
- Tests Created: ${cycle.metrics.testsCreated}
- Avg Code Review Score: ${cycle.metrics.codeReviewScore.toFixed(1)}/100

Improvements: ${cycle.improvements.length} total
- Completed: ${cycle.improvements.filter((i) => i.status === 'completed').length}
- In Progress: ${cycle.improvements.filter((i) => i.status === 'in_progress').length}
- Pending: ${cycle.improvements.filter((i) => i.status === 'pending').length}
- Failed: ${cycle.improvements.filter((i) => i.status === 'failed').length}
    `.trim();

    const timeline = cycle.logs.map((log) => ({
      time: log.timestamp,
      event: `[${log.agent}] ${log.message}`,
    }));

    return {
      summary,
      metrics: cycle.metrics,
      improvements: cycle.improvements.map((i) => ({
        title: i.title,
        status: i.status,
      })),
      chatLog: this.chatHistory,
      timeline,
    };
  }

  private async storeCycle(_cycle: ImprovementCycle): Promise<void> {
    try {
      this.logger.log('Storing improvement cycle in database...');
      // Store in database
    } catch (error) {
      this.logger.error(`Failed to store cycle: ${error.message}`);
    }
  }

  async prioritizeTasks(): Promise<void> {
    if (!this.currentCycle) return;

    this.logger.log('Prioritizing tasks based on impact and effort...');

    // Re-sort improvements by priority
    this.currentCycle.improvements.sort((a, b) => {
      // Prioritize by status first, then by other factors
      const statusPriority = {
        in_progress: 0,
        pending: 1,
        completed: 2,
        failed: 3,
      };

      return statusPriority[a.status] - statusPriority[b.status];
    });
  }

  async trackProgress(): Promise<{
    totalTasks: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
    percentComplete: number;
  }> {
    if (!this.currentCycle) {
      return {
        totalTasks: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        failed: 0,
        percentComplete: 0,
      };
    }

    const improvements = this.currentCycle.improvements;
    const completed = improvements.filter((i) => i.status === 'completed').length;
    const inProgress = improvements.filter((i) => i.status === 'in_progress').length;
    const pending = improvements.filter((i) => i.status === 'pending').length;
    const failed = improvements.filter((i) => i.status === 'failed').length;

    return {
      totalTasks: improvements.length,
      completed,
      inProgress,
      pending,
      failed,
      percentComplete:
        improvements.length > 0 ? Math.round((completed / improvements.length) * 100) : 0,
    };
  }
}
