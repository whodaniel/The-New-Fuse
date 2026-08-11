import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface GoalTask {
  id: string;
  description: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

/**
 * Which external agent capability a goal closes parity against.
 *
 * Replaces the original `hermesFeature?: string`, whose shape could only ever
 * express Hermes parity. TNF tracks parity against every agent CLI in
 * `ParityService.REFERENCE_AGENTS`, so the agent must be part of the record.
 */
export interface ParityRef {
  /** Agent id from the ParityService roster, e.g. 'codex', 'hermes'. */
  agent: string;
  /** The command or flag on that agent this goal maps to. */
  feature: string;
}

export interface Goal {
  id: string;
  /** UFTE Base58/Sha256 Federated Entity Hash */
  federatedId?: string;
  slug: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'trivial';
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  category: string;
  progress: number; // 0-100
  tasks: GoalTask[];
  tags: string[];
  /** Cross-agent parity mapping. Supersedes `hermesFeature`. */
  parity?: ParityRef;
  /** @deprecated Migrated to `parity` on load. Retained so older goals.json files and external readers keep working. */
  hermesFeature?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
  notes?: string;
}

interface GoalsConfig {
  activeGoalId?: string;
  priorities: Record<string, number>;
}

export interface GoalCreateInput {
  title: string;
  description?: string;
  priority?: Goal['priority'];
  category?: string;
  dueDate?: string;
  parity?: ParityRef;
  /** @deprecated Pass `parity: { agent: 'hermes', feature }` instead. */
  hermesFeature?: string;
  tags?: string[];
}

export class GoalsService {
  private goalsDir: string;
  private configPath: string;
  private config: GoalsConfig;

  constructor() {
    this.goalsDir = path.join(os.homedir(), '.tnf', 'goals');
    this.configPath = path.join(this.goalsDir, 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): GoalsConfig {
    if (!fs.existsSync(this.goalsDir)) {
      fs.mkdirSync(this.goalsDir, { recursive: true });
    }
    if (fs.existsSync(this.configPath)) {
      try {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(raw);
      } catch {
        /* ignore */
      }
    }
    return { priorities: {} };
  }

  private saveConfig(): void {
    if (!fs.existsSync(this.goalsDir)) {
      fs.mkdirSync(this.goalsDir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  private getGoalsFile(): string {
    return path.join(this.goalsDir, 'goals.json');
  }

  private loadGoals(): Goal[] {
    const file = this.getGoalsFile();
    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        const stored = JSON.parse(raw) as Goal[];
        const migrated = stored.map((g) => this.migrateGoal(g));
        // Persist the migration once so other readers (dashboard, exports)
        // see the cross-agent shape rather than re-deriving it every load.
        if (migrated.some((g, i) => g !== stored[i])) this.saveGoals(migrated);
        return migrated;
      } catch {
        /* ignore */
      }
    }
    return [];
  }

  /**
   * Forward-migrate a persisted goal.
   *
   * Goals written before cross-agent parity carry `hermesFeature: string`.
   * Lift those into the `parity` shape so every consumer can assume it, while
   * leaving the legacy key in place for anything still reading it.
   */
  private generateFederatedId(title: string, category: string, tags: string[]): string {
    const hash = crypto
      .createHash('sha256')
      .update(`tnf:ufte:${title}:${category}:${(tags || []).join(',')}`)
      .digest('hex')
      .substring(0, 16);
    return `tnf:ufte:goal:${hash}`;
  }

  private migrateGoal(goal: Goal): Goal {
    const federatedId =
      goal.federatedId || this.generateFederatedId(goal.title, goal.category, goal.tags);
    if (goal.parity || !goal.hermesFeature) {
      return { ...goal, federatedId };
    }
    return { ...goal, federatedId, parity: { agent: 'hermes', feature: goal.hermesFeature } };
  }

  private saveGoals(goals: Goal[]): void {
    if (!fs.existsSync(this.goalsDir)) {
      fs.mkdirSync(this.goalsDir, { recursive: true });
    }
    fs.writeFileSync(this.getGoalsFile(), JSON.stringify(goals, null, 2));
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  private generateId(): string {
    return `go-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  }

  // Initialize with default goals if none exist
  async initializeDefaults(): Promise<Goal[]> {
    const existing = this.loadGoals();
    if (existing.length > 0) return existing;

    const defaults: GoalCreateInput[] = [
      {
        title: 'Achieve Full Feature Parity with Hermes',
        description: 'Map and implement all 38+ Hermes commands/features in TNF CLI',
        priority: 'critical',
        category: 'Feature Parity',
        parity: { agent: 'hermes', feature: 'all-commands' },
        tags: ['hermes', 'parity', 'roadmap'],
      },
      {
        title: 'Implement Model Selection & Provider Fallback',
        description: 'Add `tnf model` command for model/provider switching and fallback chain',
        priority: 'high',
        category: 'Core',
        parity: { agent: 'hermes', feature: 'model/fallback' },
        tags: ['model', 'provider', 'fallback'],
      },
      {
        title: 'Build Interactive Setup Wizard',
        description: 'Create `tnf setup` for first-time user onboarding',
        priority: 'high',
        category: 'UX',
        parity: { agent: 'hermes', feature: 'setup' },
        tags: ['setup', 'wizard', 'onboarding'],
      },
      {
        title: 'Complete Skills Hub Integration',
        description: 'Implement skill browse, install, inspect, update, audit like `hermes skills`',
        priority: 'high',
        category: 'Features',
        parity: { agent: 'hermes', feature: 'skills' },
        tags: ['skills', 'hub', 'procedural-memory'],
      },
      {
        title: 'Expand Messaging Gateway',
        description:
          'Full gateway for Telegram, Discord, Slack, WhatsApp, Signal like `hermes gateway`',
        priority: 'high',
        category: 'Integration',
        parity: { agent: 'hermes', feature: 'gateway' },
        tags: ['gateway', 'telegram', 'discord', 'slack', 'whatsapp'],
      },
      {
        title: 'Session Management Suite',
        description: 'Full session list, rename, export, prune, delete like `hermes sessions`',
        priority: 'medium',
        category: 'Core',
        parity: { agent: 'hermes', feature: 'sessions' },
        tags: ['sessions', 'history', 'management'],
      },
      {
        title: 'Usage Insights & Analytics',
        description: 'Build `tnf insights` for usage analytics, cost tracking, and reporting',
        priority: 'medium',
        category: 'Analytics',
        parity: { agent: 'hermes', feature: 'insights' },
        tags: ['insights', 'analytics', 'reporting'],
      },
      {
        title: 'Diagnostic System',
        description: 'Implement `tnf doctor` for configuration and dependency health checks',
        priority: 'medium',
        category: 'DevOps',
        parity: { agent: 'hermes', feature: 'doctor' },
        tags: ['doctor', 'diagnostics', 'health'],
      },
      {
        title: 'Backup & Restore System',
        description: 'Add `tnf backup` and `tnf import` for portable agent state',
        priority: 'medium',
        category: 'Data',
        parity: { agent: 'hermes', feature: 'backup/import' },
        tags: ['backup', 'import', 'restore'],
      },
      {
        title: 'Multi-Profile Support',
        description: 'Isolated TNF profiles like `hermes profile create/list/switch`',
        priority: 'medium',
        category: 'Core',
        parity: { agent: 'hermes', feature: 'profile' },
        tags: ['profile', 'isolation', 'multi-tenant'],
      },
      {
        title: 'Web UI Dashboard',
        description: 'Build `tnf dashboard` web interface for agent monitoring and control',
        priority: 'medium',
        category: 'UI',
        parity: { agent: 'hermes', feature: 'dashboard' },
        tags: ['dashboard', 'web-ui', 'monitoring'],
      },
      {
        title: 'Log Management',
        description: 'Implement `tnf logs` for viewing, filtering, and tailing agent logs',
        priority: 'low',
        category: 'DevOps',
        parity: { agent: 'hermes', feature: 'logs' },
        tags: ['logs', 'monitoring', 'debugging'],
      },
    ];

    const goals = defaults.map((input) => this.createGoalFromInput(input));
    this.saveGoals(goals);
    return goals;
  }

  private createGoalFromInput(input: GoalCreateInput): Goal {
    const now = new Date().toISOString();
    const tags = input.tags || [];
    const category = input.category || 'general';
    return {
      id: this.generateId(),
      federatedId: this.generateFederatedId(input.title, category, tags),
      slug: this.generateSlug(input.title),
      title: input.title,
      description: input.description || '',
      priority: input.priority || 'medium',
      status: 'active',
      category: input.category || 'general',
      progress: 0,
      tasks: [],
      tags: input.tags || [],
      parity:
        input.parity ??
        (input.hermesFeature ? { agent: 'hermes', feature: input.hermesFeature } : undefined),
      hermesFeature: input.hermesFeature,
      createdAt: now,
      updatedAt: now,
      dueDate: input.dueDate,
    };
  }

  async list(): Promise<Goal[]> {
    let goals = this.loadGoals();
    if (goals.length === 0) {
      goals = await this.initializeDefaults();
    }
    return goals;
  }

  async get(idOrSlug: string): Promise<Goal | undefined> {
    const goals = await this.list();
    return goals.find((g) => g.id === idOrSlug || g.slug === idOrSlug);
  }

  async create(input: GoalCreateInput): Promise<Goal> {
    const goals = await this.list();
    const goal = this.createGoalFromInput(input);
    goals.push(goal);
    this.saveGoals(goals);
    return goal;
  }

  async update(
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'tasks'>>
  ): Promise<Goal | null> {
    const goals = await this.list();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;

    goals[idx] = { ...goals[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveGoals(goals);
    return goals[idx];
  }

  async delete(id: string): Promise<boolean> {
    const goals = await this.list();
    const filtered = goals.filter((g) => g.id !== id);
    if (filtered.length === goals.length) return false;
    this.saveGoals(filtered);
    return true;
  }

  async setProgress(id: string, progress: number): Promise<Goal | null> {
    const clamped = Math.max(0, Math.min(100, progress));
    return this.update(id, { progress });
  }

  async setStatus(id: string, status: Goal['status']): Promise<Goal | null> {
    const updates: Partial<Goal> = { status };
    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
      updates.progress = 100;
    }
    return this.update(id, updates);
  }

  async addTask(goalId: string, description: string): Promise<GoalTask | null> {
    const goals = await this.list();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    const task: GoalTask = {
      id: `task-${Date.now().toString(36)}`,
      description,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    goal.tasks.push(task);
    this.recalculateProgress(goal);
    this.saveGoals(goals);
    return task;
  }

  async completeTask(goalId: string, taskId: string): Promise<Goal | null> {
    const goals = await this.list();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return null;

    const task = goal.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    task.completed = true;
    task.completedAt = new Date().toISOString();
    this.recalculateProgress(goal);
    this.saveGoals(goals);
    return goal;
  }

  private recalculateProgress(goal: Goal): void {
    if (goal.tasks.length === 0) return;
    const completed = goal.tasks.filter((t) => t.completed).length;
    goal.progress = Math.round((completed / goal.tasks.length) * 100);
    if (goal.progress === 100 && goal.status !== 'completed') {
      goal.status = 'completed';
      goal.completedAt = new Date().toISOString();
    }
    goal.updatedAt = new Date().toISOString();
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    byPriority: Record<string, number>;
  }> {
    const goals = await this.list();
    return {
      total: goals.length,
      active: goals.filter((g) => g.status === 'active').length,
      completed: goals.filter((g) => g.status === 'completed').length,
      byPriority: {
        critical: goals.filter((g) => g.priority === 'critical').length,
        high: goals.filter((g) => g.priority === 'high').length,
        medium: goals.filter((g) => g.priority === 'medium').length,
        low: goals.filter((g) => g.priority === 'low').length,
      },
    };
  }

  async search(query: string): Promise<Goal[]> {
    const goals = await this.list();
    const q = query.toLowerCase();
    return goals.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q)) ||
        (g.parity?.agent.toLowerCase().includes(q) ?? false) ||
        (g.parity?.feature.toLowerCase().includes(q) ?? false)
    );
  }

  /** All goals tracking parity against a given agent. */
  async listByAgent(agent: string): Promise<Goal[]> {
    const goals = await this.list();
    const needle = agent.toLowerCase();
    return goals.filter((g) => g.parity?.agent.toLowerCase() === needle);
  }

  /** Look up the goal covering a specific agent capability. */
  async getByParityFeature(agent: string, feature: string): Promise<Goal | undefined> {
    const goals = await this.list();
    return goals.find(
      (g) => g.parity?.agent.toLowerCase() === agent.toLowerCase() && g.parity?.feature === feature
    );
  }

  /** @deprecated Use `getByParityFeature('hermes', feature)`. */
  async getByHermesFeature(feature: string): Promise<Goal | undefined> {
    return this.getByParityFeature('hermes', feature);
  }

  /**
   * Reconcile the goals backlog against a parity audit.
   *
   * Creates one goal per missing capability that has no goal yet, and returns
   * what it did. Existing goals are never mutated — the audit is evidence, not
   * an authority over human-set priority or status.
   */
  async syncFromParityGaps(
    gaps: Array<{ agent: string; feature: string; kind: 'command' | 'option'; note?: string }>,
    options: { priority?: Goal['priority']; dryRun?: boolean } = {}
  ): Promise<{ created: Goal[]; skipped: Array<{ agent: string; feature: string }> }> {
    const created: Goal[] = [];
    const skipped: Array<{ agent: string; feature: string }> = [];

    for (const gap of gaps) {
      const existing = await this.getByParityFeature(gap.agent, gap.feature);
      if (existing) {
        skipped.push({ agent: gap.agent, feature: gap.feature });
        continue;
      }

      const subject =
        gap.kind === 'option' ? `root option \`${gap.feature}\`` : `\`${gap.feature}\``;
      const input: GoalCreateInput = {
        title: `Parity: ${gap.agent} ${gap.feature}`,
        description:
          `TNF has no counterpart for ${subject} exposed by \`${gap.agent}\`` +
          (gap.note ? ` (${gap.note})` : '') +
          '. Detected by `tnf parity audit`.',
        priority: options.priority ?? 'medium',
        category: 'Feature Parity',
        parity: { agent: gap.agent, feature: gap.feature },
        tags: ['parity', gap.agent, gap.kind],
      };

      if (options.dryRun) {
        created.push(this.createGoalFromInput(input));
      } else {
        created.push(await this.create(input));
      }
    }

    return { created, skipped };
  }
}
