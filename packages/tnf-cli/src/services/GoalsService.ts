import * as crypto from 'crypto';
import { UnifiedLedgerClient } from './UnifiedLedgerClient.js';

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
  /** Owning authenticated TNF account (cloud identity key). */
  ownerAccountId?: string;
  /** Stable per-user id (profile_id) owning this goal. */
  ownerUserId?: string;
}

export interface GoalSubject {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'exploring' | 'structuring' | 'active' | 'archived';
  notebookLmUrl?: string;
  notebookLmTitle?: string;
  components: string[];
  looseContextNotes?: string;
  goalIds: string[];
  createdAt: string;
  updatedAt: string;
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
  constructor(private readonly ledger = new UnifiedLedgerClient()) {}

  private async loadGoals(): Promise<Goal[]> {
    const [goals, records] = await Promise.all([
      this.ledger.request<any[]>('GET', 'goals'),
      this.ledger.request<any[]>('GET', 'records'),
    ]);
    const byId = new Map(records.map((record) => [record.id, record]));
    return goals.map((row) => {
      const metadata = row.metadata || {};
      const tasks: GoalTask[] = (row.linkedRecordIds || [])
        .map((id: string) => byId.get(id))
        .filter(Boolean)
        .map((record: any) => ({
          id: record.id,
          description: record.description || record.title,
          completed: record.status === 'completed',
          createdAt: record.createdAt,
          completedAt: record.status === 'completed' ? record.updatedAt : undefined,
        }));
      return this.migrateGoal({
        ...metadata,
        id: row.id,
        title: row.title,
        description: row.description,
        slug: metadata.slug || this.generateSlug(row.title),
        priority: metadata.priority || 'medium',
        status:
          row.status === 'archived' ? 'abandoned' : row.status === 'draft' ? 'active' : row.status,
        category: metadata.category || 'general',
        tags: metadata.tags || [],
        tasks,
        progress: tasks.length
          ? Math.round((tasks.filter((task) => task.completed).length / tasks.length) * 100)
          : row.status === 'completed'
            ? 100
            : 0,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    });
  }

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
    const existing = await this.loadGoals();
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

    const goals: Goal[] = [];
    for (const input of defaults) goals.push(await this.create(input));
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
    return this.loadGoals();
  }

  async get(idOrSlug: string): Promise<Goal | undefined> {
    return (await this.list()).find((goal) => goal.id === idOrSlug || goal.slug === idOrSlug);
  }

  async create(input: GoalCreateInput): Promise<Goal> {
    const goal = this.createGoalFromInput(input);
    const { tasks, id, createdAt, updatedAt, ...metadata } = goal;
    const row = await this.ledger.request<any>('POST', 'goals', {
      title: goal.title,
      description: goal.description,
      metadata,
    });
    return { ...goal, id: row.id, createdAt: row.createdAt, updatedAt: row.updatedAt };
  }

  async update(
    id: string,
    updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'tasks'>>
  ): Promise<Goal | null> {
    const goal = await this.get(id);
    if (!goal) return null;
    const { tasks, id: ignored, createdAt, updatedAt, ...metadata } = { ...goal, ...updates };
    const row = await this.ledger.request<any>('PATCH', `goals/${encodeURIComponent(id)}`, {
      title: metadata.title,
      description: metadata.description,
      status: metadata.status === 'abandoned' ? 'archived' : metadata.status,
      metadata,
    });
    if (!row) return null;
    return (await this.get(id)) || null;
  }

  async addTask(goalId: string, description: string): Promise<GoalTask | null> {
    if (!(await this.get(goalId))) return null;
    const row = await this.ledger.request<any>(
      'POST',
      `goals/${encodeURIComponent(goalId)}/tasks`,
      { title: description, description }
    );
    return { id: row.id, description, completed: false, createdAt: row.createdAt };
  }

  async completeTask(goalId: string, taskId: string): Promise<Goal | null> {
    const goal = await this.get(goalId);
    if (!goal || !goal.tasks.some((task) => task.id === taskId)) return null;
    await this.ledger.request('PATCH', `records/${encodeURIComponent(taskId)}`, {
      status: 'completed',
    });
    const updated = await this.get(goalId);
    if (updated?.progress === 100)
      return this.update(goalId, { status: 'completed', completedAt: new Date().toISOString() });
    return updated || null;
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
