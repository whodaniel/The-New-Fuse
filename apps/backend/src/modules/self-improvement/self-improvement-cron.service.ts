/**
 * Self-Improvement Cron Service
 * Implements The Perpetual System's autonomous improvement loop
 *
 * Schedule:
 * - Every 5 minutes: Health monitoring
 * - Every 6 hours: Pattern extraction
 * - Daily (midnight): System self-improvement
 * - Weekly (Sunday midnight): Meta-system analysis
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  and,
  db,
  desc,
  drizzleSchema,
  eq,
  lt,
  sql,
  type DrizzleTask as Task,
} from '@the-new-fuse/database';

const { agents, tasks, agentRegistrations, julesSessions } = drizzleSchema;

import * as fs from 'fs/promises';
import * as path from 'path';

interface PatternMatch {
  pattern: string;
  occurrences: number;
  successRate: number;
  examples: string[];
}

interface SkillPerformance {
  skillName: string;
  uses: number;
  successRate: number;
  avgDuration: number;
  lastUsed: Date;
}

@Injectable()
export class SelfImprovementCronService {
  private readonly logger = new Logger(SelfImprovementCronService.name);
  private readonly skillsPath = path.join(process.cwd(), '.agent', 'skills');
  private readonly patternsPath = path.join(
    process.cwd(),
    '.agent',
    'context',
    'pattern-library.md'
  );

  constructor() {}

  /**
   * Every 5 minutes: Health Monitoring
   * - Check all agent heartbeats
   * - Auto-restart failed agents
   * - Ensure minimal downtime
   */
  @Cron('*/5 * * * *')
  async healthMonitoring() {
    try {
      this.logger.debug('[Health] Starting health monitoring');

      // Find agent registrations with stale heartbeats (>2 minutes old)
      const staleThreshold = new Date(Date.now() - 2 * 60 * 1000);
      const staleRegistrations = await db
        .select()
        .from(agentRegistrations)
        .where(
          and(
            lt(agentRegistrations.lastHeartbeat, staleThreshold),
            eq(agentRegistrations.isOnline, true)
          )
        );

      if (staleRegistrations.length > 0) {
        this.logger.warn(`[Health] Found ${staleRegistrations.length} stale agent registrations`);

        for (const reg of staleRegistrations) {
          // Mark as offline
          await db
            .update(agentRegistrations)
            .set({ isOnline: false, updatedAt: new Date() })
            .where(eq(agentRegistrations.id, reg.id));

          // Also update parent agent status if needed
          await db
            .update(agents)
            .set({ status: 'OFFLINE', updatedAt: new Date() })
            .where(eq(agents.id, reg.agentId));

          this.logger.log(`[Health] Marked agent ${reg.agentId} as OFFLINE due to stale heartbeat`);
        }
      }

      this.logger.debug('[Health] Health monitoring complete');
    } catch (error) {
      this.logger.error('[Health] Error in health monitoring:', error);
    }
  }

  /**
   * Every 6 hours: Pattern Extraction
   * - Analyze agent interactions
   * - Identify recurring workflows
   * - Extract patterns → pattern-library.md
   * - Trigger skill-builder if new pattern found
   */
  @Cron('0 */6 * * *')
  async patternExtraction() {
    try {
      this.logger.log('[Patterns] Starting pattern extraction');

      // Get all completed tasks from last 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const recentTasks = await db
        .select()
        .from(tasks)
        .where(and(sql`${tasks.createdAt} >= ${sixHoursAgo}`, eq(tasks.status, 'COMPLETED')))
        .orderBy(desc(tasks.createdAt))
        .limit(1000);

      if (recentTasks.length === 0) {
        this.logger.debug('[Patterns] No recent tasks to analyze');
        return;
      }

      this.logger.log(`[Patterns] Analyzing ${recentTasks.length} tasks`);

      // Extract patterns from task sequences
      const patterns = await this.extractPatterns(recentTasks);

      if (patterns.length > 0) {
        this.logger.log(`[Patterns] Found ${patterns.length} patterns`);

        // Update pattern library
        await this.updatePatternLibrary(patterns);

        // Check if any pattern is frequent enough to warrant a new skill
        const frequentPatterns = patterns.filter((p) => p.occurrences >= 5 && p.successRate >= 0.8);

        if (frequentPatterns.length > 0) {
          this.logger.log(
            `[Patterns] ${frequentPatterns.length} patterns qualify for skill creation`
          );

          // Trigger skill-builder meta-skill
          for (const pattern of frequentPatterns) {
            this.logger.log(`[Patterns] Queuing skill creation for pattern: ${pattern.pattern}`);
            await this.createJulesImprovementTask(pattern);
          }
        }
      }

      this.logger.log('[Patterns] Pattern extraction complete');
    } catch (error) {
      this.logger.error('[Patterns] Error in pattern extraction:', error);
    }
  }

  /**
   * Daily at midnight: System Self-Improvement
   * - Review all tasks from past 24h
   * - Calculate success/failure rates per skill
   * - Identify inefficiencies
   * - Create improvement tasks for agents
   * - Update skills with optimizations
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailySelfImprovement() {
    try {
      this.logger.log('[Daily] Starting daily self-improvement');

      // Get all tasks from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dailyTasks = await db
        .select()
        .from(tasks)
        .where(sql`${tasks.createdAt} >= ${oneDayAgo}`);

      if (dailyTasks.length === 0) {
        this.logger.debug('[Daily] No tasks from last 24h');
        return;
      }

      this.logger.log(`[Daily] Analyzing ${dailyTasks.length} tasks`);

      // Calculate success metrics
      const completed = dailyTasks.filter((t) => t.status === 'COMPLETED').length;
      const failed = dailyTasks.filter((t) => t.status === 'FAILED').length;
      const successRate = dailyTasks.length > 0 ? completed / dailyTasks.length : 0;

      this.logger.log(
        `[Daily] Success rate: ${(successRate * 100).toFixed(2)}% (${completed}/${dailyTasks.length})`
      );

      // Analyze skill performance
      const skillPerformance = await this.analyzeSkillPerformance(dailyTasks);

      // Identify underperforming skills (success rate < 70%)
      const underperforming = skillPerformance.filter((s) => s.successRate < 0.7);

      if (underperforming.length > 0) {
        this.logger.warn(`[Daily] ${underperforming.length} underperforming skills`);

        for (const skill of underperforming) {
          this.logger.log(
            `[Daily] ${skill.skillName}: ${(skill.successRate * 100).toFixed(2)}% success (${skill.uses} uses)`
          );

          // TODO: Create improvement task
          // - Analyze failed uses
          // - Suggest optimization
          // - Queue for skill-builder review
        }
      }

      // Identify high-performing skills to study
      const highPerforming = skillPerformance.filter((s) => s.successRate >= 0.95 && s.uses >= 5);

      if (highPerforming.length > 0) {
        this.logger.log(`[Daily] ${highPerforming.length} high-performing skills to study`);
        // Could extract patterns from these for best practices
      }

      this.logger.log('[Daily] Daily self-improvement complete');
    } catch (error) {
      this.logger.error('[Daily] Error in daily self-improvement:', error);
    }
  }

  /**
   * Weekly on Sunday at midnight: Meta-System Analysis
   * - Analyze the knowledge base itself
   * - Check for outdated skills (>30 days unused)
   * - Identify knowledge gaps
   * - Generate meta-improvement tasks
   * - Archive obsolete skills
   */
  @Cron(CronExpression.EVERY_WEEK)
  async weeklyMetaAnalysis() {
    try {
      this.logger.log('[Weekly] Starting weekly meta-system analysis');

      // Scan all skills
      const skills = await this.scanAllSkills();
      this.logger.log(`[Weekly] Found ${skills.length} skills in library`);

      // Analyze skill usage
      const skillUsage = await this.analyzeSkillUsage(skills);

      // Find unused skills (>30 days)
      const unusedSkills = skillUsage.filter((s) => {
        const daysSinceUse = s.lastUsed
          ? (Date.now() - s.lastUsed.getTime()) / (24 * 60 * 60 * 1000)
          : 9999;
        return daysSinceUse > 30;
      });

      if (unusedSkills.length > 0) {
        this.logger.warn(`[Weekly] ${unusedSkills.length} skills unused for >30 days`);

        for (const skill of unusedSkills) {
          this.logger.log(
            `[Weekly] Unused: ${skill.skillName} (last used: ${skill.lastUsed || 'never'})`
          );

          // TODO: Archive to .agent/archive/
          // Could move skills that haven't been used to an archive
        }
      }

      // Identify knowledge gaps
      // Look for task types that failed repeatedly but have no corresponding skill
      const gaps = await this.identifyKnowledgeGaps();

      if (gaps.length > 0) {
        this.logger.log(`[Weekly] ${gaps.length} knowledge gaps identified`);

        for (const gap of gaps) {
          this.logger.log(`[Weekly] Gap: ${gap}`);

          // TODO: Create task for skill-builder to fill gap
          // Create documentation for needed skills
        }
      }

      // Calculate meta-metrics
      const totalTasksResult = await db.select({ count: sql<number>`count(*)` }).from(tasks);
      const totalTasks = Number(totalTasksResult[0]?.count || 0);

      const totalAgentsResult = await db.select({ count: sql<number>`count(*)` }).from(agents);
      const totalAgents = Number(totalAgentsResult[0]?.count || 0);

      const activeAgentsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(agents)
        .where(eq(agents.status, 'ACTIVE'));
      const activeAgents = Number(activeAgentsResult[0]?.count || 0);

      this.logger.log(`[Weekly] Meta-metrics:`);
      this.logger.log(`  - Total tasks: ${totalTasks}`);
      this.logger.log(`  - Total agents: ${totalAgents}`);
      this.logger.log(`  - Active agents: ${activeAgents}`);
      this.logger.log(`  - Skills: ${skills.length}`);
      this.logger.log(`  - Unused skills: ${unusedSkills.length}`);
      this.logger.log(`  - Knowledge gaps: ${gaps.length}`);

      this.logger.log('[Weekly] Weekly meta-analysis complete');
    } catch (error) {
      this.logger.error('[Weekly] Error in weekly meta-analysis:', error);
    }
  }

  /**
   * Extract patterns from task sequences
   */
  private async extractPatterns(tasks: Task[]): Promise<PatternMatch[]> {
    // Group tasks by user/agent
    const tasksByAgent: Record<string, Task[]> = {};

    for (const task of tasks) {
      const key = task.assignedToId || task.userId || 'unknown';
      if (!tasksByAgent[key]) {
        tasksByAgent[key] = [];
      }
      tasksByAgent[key].push(task);
    }

    const patterns: Map<string, PatternMatch> = new Map();

    // Analyze sequences for each agent
    for (const [agentKey, agentTasks] of Object.entries(tasksByAgent)) {
      // Sort by creation time
      agentTasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Look for sequences (window of 3 tasks)
      for (let i = 0; i < agentTasks.length - 2; i++) {
        const sequence = agentTasks.slice(i, i + 3);
        const pattern = sequence.map((t) => t.type || 'unknown').join(' → ');

        if (!patterns.has(pattern)) {
          patterns.set(pattern, {
            pattern,
            occurrences: 0,
            successRate: 0,
            examples: [],
          });
        }

        const patternData = patterns.get(pattern)!;
        patternData.occurrences++;

        const allCompleted = sequence.every((t) => t.status === 'COMPLETED');
        if (allCompleted) {
          patternData.successRate =
            (patternData.successRate * (patternData.occurrences - 1) + 1) / patternData.occurrences;
        } else {
          patternData.successRate =
            (patternData.successRate * (patternData.occurrences - 1)) / patternData.occurrences;
        }

        if (patternData.examples.length < 3) {
          patternData.examples.push(sequence.map((t) => t.title).join(' → '));
        }
      }
    }

    return Array.from(patterns.values()).sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Update pattern library with new patterns
   */
  private async updatePatternLibrary(patterns: PatternMatch[]): Promise<void> {
    let content = `# Pattern Library\n\nLast updated: ${new Date().toISOString()}\n\n`;
    content += `## Recurring Patterns\n\n`;

    for (const pattern of patterns) {
      content += `### ${pattern.pattern}\n\n`;
      content += `- Occurrences: ${pattern.occurrences}\n`;
      content += `- Success Rate: ${(pattern.successRate * 100).toFixed(2)}%\n`;
      content += `- Examples:\n`;
      for (const example of pattern.examples) {
        content += `  - ${example}\n`;
      }
      content += `\n`;
    }

    await fs.mkdir(path.dirname(this.patternsPath), { recursive: true });
    await fs.writeFile(this.patternsPath, content, 'utf-8');

    this.logger.log(`[Patterns] Updated pattern library: ${this.patternsPath}`);
  }

  /**
   * Analyze skill performance from tasks
   */
  private async analyzeSkillPerformance(tasks: Task[]): Promise<SkillPerformance[]> {
    const skillStats: Map<
      string,
      { uses: number; successes: number; durations: number[]; lastUsed: Date }
    > = new Map();

    for (const task of tasks) {
      // Extract skill from task metadata or description
      const skillName = this.extractSkillName(task);
      if (!skillName) continue;

      if (!skillStats.has(skillName)) {
        skillStats.set(skillName, {
          uses: 0,
          successes: 0,
          durations: [],
          lastUsed: task.createdAt,
        });
      }

      const stats = skillStats.get(skillName)!;
      stats.uses++;

      if (task.status === 'COMPLETED') {
        stats.successes++;
      }

      if (task.endTime && task.startTime) {
        const duration = task.endTime.getTime() - task.startTime.getTime();
        stats.durations.push(duration);
      }

      if (task.createdAt > stats.lastUsed) {
        stats.lastUsed = task.createdAt;
      }
    }

    return Array.from(skillStats.entries()).map(([skillName, stats]) => ({
      skillName,
      uses: stats.uses,
      successRate: stats.uses > 0 ? stats.successes / stats.uses : 0,
      avgDuration:
        stats.durations.length > 0
          ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
          : 0,
      lastUsed: stats.lastUsed,
    }));
  }

  /**
   * Scan all skills in the library
   */
  private async scanAllSkills(): Promise<string[]> {
    const skills: string[] = [];

    try {
      const skillDirs = await fs.readdir(this.skillsPath);

      for (const dir of skillDirs) {
        const skillPath = path.join(this.skillsPath, dir, 'SKILL.md');
        try {
          await fs.access(skillPath);
          skills.push(dir);
        } catch {
          // Not a skill directory
        }
      }
    } catch (error) {
      this.logger.error('[Weekly] Error scanning skills:', error);
    }

    return skills;
  }

  /**
   * Analyze skill usage
   */
  private async analyzeSkillUsage(skills: string[]): Promise<SkillPerformance[]> {
    // Get all tasks to analyze skill usage
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(10000);

    return this.analyzeSkillPerformance(allTasks);
  }

  /**
   * Identify knowledge gaps (tasks that failed repeatedly with no skill)
   */
  private async identifyKnowledgeGaps(): Promise<string[]> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const failedTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.status, 'FAILED'), sql`${tasks.createdAt} >= ${oneWeekAgo}`));

    // Group by task type/description
    const failureTypes: Map<string, number> = new Map();

    for (const task of failedTasks) {
      const type = task.type || 'unknown';
      failureTypes.set(type, (failureTypes.get(type) || 0) + 1);
    }

    // Return types that failed >= 3 times (knowledge gap)
    return Array.from(failureTypes.entries())
      .filter(([_, count]) => count >= 3)
      .map(([type, _]) => type);
  }

  /**
   * Extract skill name from task
   */
  private extractSkillName(task: Task): string | null {
    // Try to extract from metadata
    if (task.metadata && typeof task.metadata === 'object') {
      const meta = task.metadata as any;
      if (meta.skill) return meta.skill;
      if (meta.skillName) return meta.skillName;
    }

    // Try to extract from description/title
    const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();

    // Common skill patterns
    const skillPatterns = [
      /using\s+([a-z-]+)\s+skill/,
      /skill:\s*([a-z-]+)/,
      /\[skill:([a-z-]+)\]/,
    ];

    for (const pattern of skillPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Create an improvement task for Jules
   */
  private async createJulesImprovementTask(pattern: PatternMatch): Promise<void> {
    try {
      // Find system agent
      let systemAgent = (await db
        .select()
        .from(agents)
        .where(eq(agents.type, 'SYSTEM'))
        .limit(1))[0];

      if (!systemAgent) {
        // Fallback to first available agent if no system agent
        systemAgent = (await db.select().from(agents).limit(1))[0];
        if (!systemAgent) {
          this.logger.warn('[Patterns] No agent found to assign task');
          return;
        }
      }

      // Find previous sessions for context (Self-Referencing)
      const previousSessions = await db
        .select()
        .from(julesSessions)
        .where(sql`${julesSessions.metadata}->>'pattern' = ${pattern.pattern}`)
        .orderBy(desc(julesSessions.createdAt))
        .limit(3);

      let context = `Pattern: ${pattern.pattern}\nOccurrences: ${pattern.occurrences}\nSuccess Rate: ${pattern.successRate}\nExamples:\n${pattern.examples.join('\n')}`;

      if (previousSessions.length > 0) {
        context += `\n\nPrevious Improvement Attempts:\n`;
        previousSessions.forEach((session, i) => {
          context += `${i + 1}. Status: ${session.status}, Result: ${JSON.stringify(session.result || {})}\n`;
        });
      }

      const prompt = `Analyze the following pattern and generate a new skill or improvement strategy.\n\n${context}`;

      // Create Task
      const [task] = await db
        .insert(tasks)
        .values({
          title: `Improvement: ${pattern.pattern}`,
          type: 'IMPROVEMENT',
          status: 'PENDING',
          priority: 'MEDIUM',
          assignedToId: systemAgent.id,
          userId: systemAgent.userId, // Inherit user ID
          description: prompt,
          metadata: { pattern: pattern.pattern },
        })
        .returning();

      // Create Jules Session
      await db.insert(julesSessions).values({
        julesSessionId: `jules-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Temporary ID
        taskId: task.id,
        delegatedByAgentId: systemAgent.id,
        userId: systemAgent.userId,
        status: 'PENDING',
        metadata: {
          prompt,
          pattern: pattern.pattern,
        },
      });

      this.logger.log(`[Patterns] Created Jules improvement task for pattern: ${pattern.pattern}`);
    } catch (error) {
      this.logger.error('[Patterns] Error creating Jules task:', error);
    }
  }
}
