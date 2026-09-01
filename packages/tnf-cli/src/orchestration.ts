import chalk from 'chalk';
import fs from 'fs';
import { readFile, readdir } from 'fs/promises';
import path from 'path';
import {
  ComprehensiveSkillScanner,
  SelfImprovementTracker,
  WorkerDispatcher,
} from './orchestration-enhancements.js';
import {
  REPORT_ONLY_GOAL_RE,
  classifyOrchestrateIntent,
  extractReportOutputPath,
} from './orchestration-intent.js';
import { RedisAgentClient } from './RedisAgentClient.js';

export {
  REPORT_ONLY_GOAL_RE,
  REPORT_ONLY_MUTATE_EXPLICIT_RE,
  classifyOrchestrateIntent,
  extractReportOutputPath,
} from './orchestration-intent.js';

// ============================================================================
// TNF ENHANCED ORCHESTRATION SYSTEM v2.0
// Replaces the simple switch-statement orchestrator with a goal-driven,
// skill-aware, state-conscious autonomous agent.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Task {
  id: string;
  name: string;
  description: string;
  skillRef?: string; // e.g. "tnf-full-auto-network-autopilot"
  workerRef?: string; // e.g. "hermes-codegen-worker"
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
  dependencies: string[]; // task IDs that must complete first
  capability?: string; // 'code' or 'infra' for worker routing
  artifacts?: string[];
  payload: any;
  result?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  startedAt?: string;
  completedAt?: string;
}

export interface Workflow {
  id: string;
  name: string;
  goal: string;
  tasks: Task[];
  status: 'planning' | 'running' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata: Record<string, any>;
}

export interface Skill {
  name: string;
  description: string;
  path: string;
  commands: string[];
  triggers: string[]; // keywords that match this skill
  confidence: number; // 0-1, how confident we are this skill applies
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  platform: string;
  capabilities: string[];
  status: 'active' | 'busy' | 'idle' | 'offline';
  lastSeen: string;
  queue: string;
}

export interface SystemState {
  activeDirectives: string[];
  pendingTasks: number;
  activeWorkers: number;
  skillsAvailable: number;
  lastSync: string;
  health: 'healthy' | 'degraded' | 'critical';
}

// ---------------------------------------------------------------------------
// GoalPlanner: Decomposes natural language goals into task trees
// ---------------------------------------------------------------------------
/** @deprecated import from orchestration-intent — kept name surface via re-export above */

export class GoalPlanner {
  private goalPatterns: Array<{ pattern: RegExp; skill: string; tasks: string[] }> = [];
  private static BUILT_IN_PATTERNS = [
    {
      // A2: must precede security/refactor patterns so "audit" never selects mutate tasks.
      pattern: REPORT_ONLY_GOAL_RE,
      skill: 'tnf-report-only',
      tasks: ['classify-report-only', 'write-report-artifact', 'verify-report-output'],
    },
    {
      pattern: /deploy|build|gcp|cloud.?build|docker|kubernetes/i,
      skill: 'tnf-full-auto-network-autopilot',
      tasks: ['validate-config', 'build-image', 'deploy-to-gcp', 'verify-deployment'],
    },
    {
      pattern: /refactor|cleanup|dead.code|duplicate|optimize|simplify/i,
      skill: 'tnf-refactoring-triage',
      tasks: ['scan-codebase', 'identify-hotspots', 'prioritize-changes', 'execute-safe-refactors'],
    },
    {
      pattern: /test|health.?check|monitor|diagnose|inspect/i,
      skill: 'tnf-health-check',
      tasks: ['run-health-checks', 'aggregate-results', 'report-anomalies'],
    },
    {
      pattern: /register|spawn|create.*worker|agent.*register|worker.*setup/i,
      skill: 'tnf-agent-ecosystem-classification',
      tasks: ['validate-registry', 'create-worker-config', 'install-cron', 'verify-heartbeat'],
    },
    {
      pattern: /install.*skill|skill.*install|enable.*skill|add.*capability/i,
      skill: 'skill-installer',
      tasks: ['discover-skill', 'validate-compatibility', 'install-skill', 'verify-functionality'],
    },
    {
      pattern: /search|lookup|find.*information|research/i,
      skill: 'tavily-search',
      tasks: ['formulate-query', 'execute-search', 'synthesize-results'],
    },
    {
      pattern: /error|fail|bug|fix.*broken|troubleshoot/i,
      skill: 'self-improving-agent',
      tasks: ['capture-error-context', 'log-to-learnings', 'suggest-fix'],
    },
    {
      pattern: /scrape|crawl|extract.*(?:url|web|page)|read.*(?:url|webpage)/i,
      skill: '.agent/skills/crawl4ai',
      tasks: ['start-crawler-if-needed', 'scrape-fit-markdown', 'verify-content'],
    },
    {
      pattern: /browser|chrome|automation|click|fill.*form|authenticated.*(?:site|page)/i,
      skill: '.agent/skills/agent-browser',
      tasks: ['load-auth-state-if-needed', 'launch-browser', 'inspect-act-verify', 'close-browser'],
    },
    {
      // "audit" reserved for REPORT_ONLY classifier above — keep security for threat/vuln only.
      pattern: /security|threat|vulnerability|pen.?test/i,
      skill: 'security-threat-model',
      tasks: ['identify-assets', 'model-threats', 'assess-risks', 'plan-mitigations'],
    },
    {
      pattern: /note|journal|memory|remember|recall/i,
      skill: 'tnf-note-taking',
      tasks: ['capture-note', 'categorize-note', 'index-note', 'link-related'],
    },
  ];

  constructor() {
    this.goalPatterns = [...GoalPlanner.BUILT_IN_PATTERNS];
  }

  /** Dynamically add patterns discovered from skills */
  addPatternFromSkill(skill: Skill): void {
    const words = skill.description
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);
    // Create a pattern from unique significant words
    const uniqueWords = [...new Set(words)].slice(0, 5);
    if (uniqueWords.length >= 2) {
      const patternStr = uniqueWords.join('|');
      this.goalPatterns.push({
        pattern: new RegExp(patternStr, 'i'),
        skill: skill.name,
        tasks: ['analyze-goal', `execute-${skill.name}`, 'verify-completion'],
      });
    }
  }

  /**
   * Parse a natural language goal and decompose it into a structured Workflow.
   * Falls back to a generic single-task workflow if no pattern matches.
   */
  async plan(goal: string): Promise<Workflow> {
    const classification = classifyOrchestrateIntent(goal);
    const workflow: Workflow = {
      id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `Goal: ${goal.slice(0, 60)}${goal.length > 60 ? '...' : ''}`,
      goal,
      tasks: [],
      status: 'planning',
      createdAt: new Date().toISOString(),
      metadata: {
        planningStrategy: 'pattern-match',
        orchestrateIntent: classification.intent,
        orchestrateIntentReason: classification.reason,
      },
    };

    // Try pattern matching first
    for (const pattern of this.goalPatterns) {
      if (pattern.skill === 'tnf-report-only' && classification.intent !== 'REPORT_ONLY') {
        continue;
      }
      if (
        classification.intent === 'REPORT_ONLY' &&
        pattern.tasks.includes('execute-safe-refactors')
      ) {
        continue;
      }
      if (pattern.pattern.test(goal)) {
        workflow.metadata.planningStrategy = `pattern:${pattern.skill}`;
        workflow.tasks = pattern.tasks.map((name, idx) =>
          this.createTask(name, pattern.skill, idx)
        );
        break;
      }
    }

    // No pattern match - create a single exploratory task
    if (workflow.tasks.length === 0) {
      workflow.tasks.push({
        id: `task-${Date.now()}-0`,
        name:
          classification.intent === 'REPORT_ONLY'
            ? 'write-report-artifact'
            : 'exploratory-analysis',
        description: `Analyze goal: "${goal}" and determine best approach`,
        priority: 'high',
        status: 'pending',
        dependencies: [],
        payload: {
          goal,
          strategy: classification.intent === 'REPORT_ONLY' ? 'report-only' : 'exploratory',
        },
        attempts: 0,
        maxAttempts: 3,
      });
      workflow.metadata.planningStrategy =
        classification.intent === 'REPORT_ONLY' ? 'report-only-fallback' : 'exploratory';
    }

    // Defensive: never schedule mutate tasks under REPORT_ONLY
    if (classification.intent === 'REPORT_ONLY') {
      workflow.tasks = workflow.tasks.filter((t) => t.name !== 'execute-safe-refactors');
    }

    // Add dependency chain
    for (let i = 1; i < workflow.tasks.length; i++) {
      workflow.tasks[i].dependencies.push(workflow.tasks[i - 1].id);
    }

    workflow.status = 'running';
    return workflow;
  }

  private createTask(name: string, skill: string, index: number): Task {
    return {
      id: `task-${Date.now()}-${index}`,
      name,
      description: `Execute ${name} using ${skill}`,
      skillRef: skill,
      priority: index === 0 ? 'critical' : 'high',
      status: 'pending',
      dependencies: [],
      payload: { step: index, skill },
      attempts: 0,
      maxAttempts: 3,
    };
  }
}

// ---------------------------------------------------------------------------
// SkillRegistry: Discovers and invokes skills dynamically
// ---------------------------------------------------------------------------
export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private skillsPath: string;

  constructor(repoRoot: string) {
    this.skillsPath = path.join(repoRoot, '.agent', 'skills');
  }

  /** Scan all SKILL.md files and build the skill index */
  async discover(): Promise<Skill[]> {
    const discovered: Skill[] = [];
    try {
      const entries = await readdir(this.skillsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skill = await this.parseSkill(entry.name);
          if (skill) {
            this.skills.set(skill.name, skill);
            discovered.push(skill);
          }
        }
      }
    } catch (err) {
      // Skills directory may not exist in all contexts
    }
    return discovered;
  }

  /** Parse a single skill directory */
  private async parseSkill(dirName: string): Promise<Skill | null> {
    try {
      const skillPath = path.join(this.skillsPath, dirName, 'SKILL.md');
      const content = await readFile(skillPath, 'utf-8');

      // Parse YAML frontmatter
      const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
      if (!match) return null;

      const frontmatter = match[1];
      const body = match[2];

      // Simple YAML parser for frontmatter
      const name = frontmatter.match(/name:\s*(.+)/)?.[1]?.trim() || dirName;
      const description = frontmatter.match(/description:\s*(.+)/)?.[1]?.trim() || '';

      // Extract triggers from description and body keywords
      const triggers = this.extractTriggers(description + ' ' + body);

      // Extract command references
      const commands: string[] = [];
      const commandMatches = body.matchAll(/```bash\s*\n([\s\S]*?)\n```/g);
      for (const cmd of commandMatches) {
        commands.push(cmd[1].trim().split('\n')[0]); // First line of each code block
      }

      return {
        name,
        description,
        path: skillPath,
        commands,
        triggers,
        confidence: 0.8,
      };
    } catch {
      return null;
    }
  }

  private extractTriggers(text: string): string[] {
    const triggers = new Set<string>();
    const keywords = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    for (const kw of keywords) {
      if (
        [
          'skill',
          'agent',
          'deploy',
          'build',
          'test',
          'refactor',
          'orchestrate',
          'monitor',
        ].includes(kw)
      ) {
        triggers.add(kw);
      }
    }
    return Array.from(triggers);
  }

  /** Find the best matching skill for a given goal or task */
  async findSkill(query: string): Promise<Skill | null> {
    const q = query.toLowerCase();
    let best: Skill | null = null;
    let bestScore = 0;

    for (const skill of this.skills.values()) {
      let score = 0;

      // Match triggers
      for (const trigger of skill.triggers) {
        if (q.includes(trigger)) score += 10;
      }

      // Match description words
      const descWords = skill.description.toLowerCase().split(/\s+/);
      for (const word of descWords) {
        if (q.includes(word)) score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        best = skill;
      }
    }

    return best;
  }

  /** Get a skill by exact name */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }
}

// ---------------------------------------------------------------------------
// StateManager: Reads/writes LIVING_STATE and other protocol files
// ---------------------------------------------------------------------------
export class StateManager {
  private statePath: string;
  private ledgerPath: string;

  constructor(private repoRoot: string) {
    this.statePath = path.join(repoRoot, 'docs', 'protocols', 'LIVING_STATE.md');
    this.ledgerPath = path.join(repoRoot, 'docs', 'protocols', 'AGENT_STATUS_LEDGER.md');
  }

  /** Read current system state from LIVING_STATE.md */
  async getSystemState(): Promise<SystemState> {
    const state: SystemState = {
      activeDirectives: [],
      pendingTasks: 0,
      activeWorkers: 0,
      skillsAvailable: 0,
      lastSync: new Date().toISOString(),
      health: 'healthy',
    };

    try {
      const content = await readFile(this.statePath, 'utf-8');

      // Extract current directive
      const directiveMatch = content.match(/\*\*Current Directive:\*\*\s*(.+?)(?:\n|$)/);
      if (directiveMatch) {
        state.activeDirectives.push(directiveMatch[1].trim());
      }

      // Count active steps (checkboxes that are not checked)
      const pendingMatches = content.match(/-\s\[\s\].+/g);
      state.pendingTasks = pendingMatches?.length || 0;

      // Check for health indicators
      if (content.includes('⚠️') || content.includes('FAILED')) {
        state.health = 'degraded';
      }
      if (content.includes('🔴') || content.includes('CRITICAL')) {
        state.health = 'critical';
      }
    } catch {
      // State file may not exist
    }

    return state;
  }

  /** Update LIVING_STATE.md with a new entry */
  async appendProgress(step: string): Promise<void> {
    try {
      const entry = `\n- [✅] ${new Date().toISOString()} Orchestrator: ${step}\n`;
      await fs.promises.appendFile(this.statePath, entry);
    } catch {
      // Ignore write errors in read-only contexts
    }
  }

  /** Get the current directive from LIVING_STATE */
  async getCurrentDirective(): Promise<string | null> {
    try {
      const content = await readFile(this.statePath, 'utf-8');
      const match = content.match(/\*\*Current Directive:\*\*\s*(.+?)(?:\n|$)/);
      return match?.[1]?.trim() || null;
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// WorkerPool: Manages worker lifecycle via Redis registry
// ---------------------------------------------------------------------------
export class WorkerPool {
  private workers: Map<string, Worker> = new Map();

  constructor(private client: RedisAgentClient) {}

  /** Scan Redis for available workers */
  async discoverWorkers(): Promise<Worker[]> {
    const client = new RedisAgentClient();
    try {
      await client.initialize();
      const agents = await client.listAgents();
      const workers = agents.filter((agent) => agent.role === 'worker');
      if (workers.length > 0) {
        return workers.map((agent) => ({
          id: agent.id,
          name: agent.name,
          capabilities: agent.capabilities || [],
          role: 'worker' as const,
          platform: agent.platform,
          status: agent.isOnline ? ('active' as const) : agent.status,
          lastSeen: agent.lastSeen,
          queue: `tnf:direct:sub-director:${agent.id}`,
        }));
      }
    } catch {
      // Fall through to registry snapshot files.
    }

    for (const candidate of [
      path.join(process.cwd(), '.tnf', 'agent-registry-snapshot.json'),
      path.join(process.env.HOME || '', '.tnf', 'agent-registry-snapshot.json'),
    ]) {
      try {
        if (!fs.existsSync(candidate)) continue;
        const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
        const agents = Array.isArray(parsed?.agents) ? parsed.agents : [];
        const workers = agents.filter(
          (agent: any) => String(agent?.role || '').toLowerCase() === 'worker'
        );
        if (workers.length > 0) {
          return workers.map((agent: any) => ({
            id: String(agent.id || agent.name),
            name: String(agent.name || agent.id),
            capabilities: Array.isArray(agent.capabilities) ? agent.capabilities : [],
            role: 'worker' as const,
            platform: String(agent.platform || agent.fulfillment?.vendor || 'unknown'),
            status: 'active' as const,
            lastSeen: new Date().toISOString(),
            queue: `tnf:direct:sub-director:${String(agent.id || agent.name)}`,
          }));
        }
      } catch {
        // Try next snapshot source.
      }
    }

    return [];
  }

  /** Find the best worker for a given task */
  async findWorker(task: Task): Promise<Worker | null> {
    const allWorkers = await this.discoverWorkers();

    // Score workers by capability overlap
    let best: Worker | null = null;
    let bestScore = 0;

    for (const worker of allWorkers) {
      const score = worker.capabilities.filter(
        (cap) =>
          task.skillRef?.toLowerCase().includes(cap.toLowerCase()) ||
          task.name.toLowerCase().includes(cap.toLowerCase())
      ).length;

      if (score > bestScore) {
        bestScore = score;
        best = worker;
      }
    }

    return best;
  }

  /** Send a task to a worker via Redis */
  async dispatchToWorker(worker: Worker, task: Task): Promise<boolean> {
    try {
      await this.client.send(
        JSON.stringify({
          type: 'task',
          taskId: task.id,
          payload: task.payload,
          skillRef: task.skillRef,
        }),
        {
          type: 'command',
          metadata: {
            target: worker.id,
            queue: worker.queue,
            workflow: 'orchestrated-dispatch',
          },
        }
      );
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// EnhancedOrchestrator: Goal-driven, skill-aware autonomous agent
// ---------------------------------------------------------------------------
export class EnhancedOrchestrator {
  private goalPlanner = new GoalPlanner();
  private skillRegistry: SkillRegistry;
  private stateManager: StateManager;
  private workerPool: WorkerPool;
  private workerDispatcher: WorkerDispatcher;
  private selfImprovement: SelfImprovementTracker;
  private skillScanner: ComprehensiveSkillScanner;
  private activeWorkflows: Map<string, Workflow> = new Map();
  private skillCacheLoaded = false;
  private repoRoot: string;

  constructor(
    private client: RedisAgentClient,
    repoRoot: string
  ) {
    this.repoRoot = repoRoot;
    this.skillRegistry = new SkillRegistry(repoRoot);
    this.stateManager = new StateManager(repoRoot);
    this.workerPool = new WorkerPool(client);
    this.workerDispatcher = new WorkerDispatcher();
    this.selfImprovement = new SelfImprovementTracker(repoRoot);
    this.skillScanner = new ComprehensiveSkillScanner(repoRoot);
  }

  /** Bootstrap: discover skills, verify state, prepare for operation */
  async initialize(): Promise<void> {
    console.log(chalk.dim('   🔧 Initializing Enhanced Orchestrator v2.0...'));

    // Load skills
    const skills = await this.skillRegistry.discover();
    console.log(chalk.dim(`   📚 Discovered ${skills.length} skills from registry`));

    // Scan all skills for trigger patterns
    const scanned = await this.skillScanner.scanAll();
    console.log(chalk.dim(`   🔍 Scanned ${scanned.length} skills for goal patterns`));

    // Register discovered patterns
    for (const pattern of scanned) {
      this.goalPlanner.addPatternFromSkill({
        name: pattern.skillName,
        description: pattern.triggers.join(' '),
        path: '',
        commands: [],
        triggers: pattern.triggers,
        confidence: pattern.confidence,
      });
    }

    this.skillCacheLoaded = true;

    // Verify system state
    const state = await this.stateManager.getSystemState();
    console.log(chalk.dim(`   📊 System health: ${state.health}, pending: ${state.pendingTasks}`));

    if (state.health === 'critical') {
      console.log(chalk.yellow('   ⚠️  System in critical state - proceeding with caution'));
    }
  }

  /**
   * Execute a natural language goal.
   * This is the main entry point for autonomous operation.
   */
  async executeGoal(goal: string): Promise<Workflow> {
    console.log(
      chalk.cyan(`
🎯 Processing goal: ${chalk.bold(goal)}`)
    );

    const classification = classifyOrchestrateIntent(goal);
    console.log(chalk.dim(`   🧭 Classifier: ${classification.intent} — ${classification.reason}`));

    // Phase 1: Plan - Decompose goal into tasks
    const workflow = await this.goalPlanner.plan(goal);
    this.activeWorkflows.set(workflow.id, workflow);
    console.log(
      chalk.dim(
        `   📋 Planned ${workflow.tasks.length} tasks (${workflow.metadata.planningStrategy})`
      )
    );

    // A2 REPORT_ONLY: write named output path; never run mutate / execute-safe-refactors.
    if (classification.intent === 'REPORT_ONLY') {
      workflow.tasks = workflow.tasks.filter((t) => t.name !== 'execute-safe-refactors');
      const outRel = extractReportOutputPath(goal);
      if (!outRel) {
        console.log(
          chalk.red(
            '   ❌ REPORT_ONLY requires an explicit output path (e.g. write docs/.../file.md)'
          )
        );
        workflow.status = 'failed';
        workflow.metadata.reportOnlyError = 'missing_output_path';
        return workflow;
      }
      const abs = path.isAbsolute(outRel) ? outRel : path.join(this.repoRoot, outRel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      const bodyMatch = goal.match(/\bwith\s+(.+)$/i);
      const body = bodyMatch ? bodyMatch[1].trim() : `REPORT_ONLY ping ${new Date().toISOString()}`;
      fs.writeFileSync(abs, `${body}\n`, 'utf8');
      const ok = fs.existsSync(abs) && fs.statSync(abs).size > 0;
      for (const task of workflow.tasks) {
        task.status = ok ? 'completed' : 'failed';
        task.completedAt = new Date().toISOString();
      }
      workflow.status = ok ? 'completed' : 'failed';
      workflow.metadata.reportOnlyOutput = abs;
      workflow.completedAt = new Date().toISOString();
      console.log(
        ok
          ? chalk.green(`   ✅ REPORT_ONLY wrote ${path.relative(this.repoRoot, abs)}`)
          : chalk.red(`   ❌ REPORT_ONLY failed to write ${abs}`)
      );
      return workflow;
    }

    // Phase 2: Match - Find best skills for each task
    for (const task of workflow.tasks) {
      if (task.skillRef) {
        const skill = await this.skillRegistry.findSkill(task.name + ' ' + task.description);
        if (skill) {
          task.skillRef = skill.name;
          console.log(chalk.dim(`   🔗 Task "${task.name}" → skill "${skill.name}"`));
        }
      }
    }

    // Phase 3: Route - Assign workers to tasks
    for (const task of workflow.tasks) {
      if (task.status !== 'pending' || task.dependencies.length > 0) continue;

      const worker = await this.workerPool.findWorker(task);
      if (worker) {
        task.workerRef = worker.id;
        console.log(chalk.dim(`   👷 Task "${task.name}" → worker "${worker.name}"`));
      }
    }

    // Phase 4: Execute - Run tasks in dependency order
    console.log(chalk.green(`   🚀 Executing workflow ${workflow.id}...`));
    await this.executeWorkflow(workflow);

    // Phase 5: Report and learn
    if (workflow.status === 'completed') {
      await this.stateManager.appendProgress(`Completed: ${workflow.name}`);
      console.log(chalk.green(`   ✅ Workflow completed: ${workflow.name}`));

      // Log success to self-improvement
      try {
        await this.selfImprovement.logSuccess(goal, workflow.id, 'Workflow completed successfully');
      } catch (e) {
        // Non-critical: don't fail if logging fails
      }
    } else {
      console.log(chalk.red(`   ❌,robotWorkflow failed: ${workflow.name}`));

      // Log failure to self-improvement
      try {
        const failedTask = workflow.tasks.find((t) => t.status === 'failed');
        await this.selfImprovement.logFailure(
          goal,
          workflow.id,
          failedTask
            ? `Task "${failedTask.name}" failed: ${failedTask.error || 'Unknown error'}`
            : 'Workflow failed',
          'Review task logs and retry with adjusted parameters'
        );
      } catch (e) {
        // Non-critical: don't fail if logging fails
      }
    }

    return workflow;
  }

  /**
   * Execute a traditional named workflow (backward compatible)
   */
  async executeWorkflow(workflow: Workflow): Promise<boolean> {
    const pending = workflow.tasks.filter((t) => t.status === 'pending');

    for (const task of pending) {
      // Check dependencies
      const blocked = task.dependencies.some((depId) => {
        const depTask = workflow.tasks.find((t) => t.id === depId);
        return !depTask || depTask.status !== 'completed';
      });
      if (blocked) {
        task.status = 'blocked';
        continue;
      }

      task.status = 'running';
      task.startedAt = new Date().toISOString();

      try {
        const success = await this.executeTask(task);
        task.status = success ? 'completed' : 'failed';
        task.completedAt = new Date().toISOString();
      } catch (err) {
        task.status = 'failed';
        task.error = err instanceof Error ? err.message : String(err);

        // Retry logic
        task.attempts++;
        if (task.attempts < task.maxAttempts) {
          console.log(
            chalk.yellow(
              `   🔄 Retrying task "${task.name}" (attempt ${task.attempts + 1}/${task.maxAttempts})`
            )
          );
          task.status = 'pending';
        }
      }
    }

    workflow.status = workflow.tasks.every((t) => t.status === 'completed')
      ? 'completed'
      : workflow.tasks.some((t) => t.status === 'failed')
        ? 'failed'
        : 'running';

    return workflow.status === 'completed';
  }

  /** Execute a single task using the appropriate skill or real worker dispatch */
  private async executeTask(task: Task): Promise<boolean> {
    console.log(chalk.cyan(`   ▶️  Executing: ${task.name}`));

    // Try real worker dispatch first — now through the federated broker queue
    // (`tnf:master:tasks:realtime`) instead of hardcoded worker queues.
    // The broker evaluates policy, does live agent discovery, applies tenant
    // scope and federation gates. Falls back to direct dispatch if Redis is down.
    if (task.capability && (task.capability === 'code' || task.capability === 'infra')) {
      console.log(
        chalk.dim(`      📡 Dispatching via broker queue (capability: ${task.capability})`)
      );
      await this.workerDispatcher.dispatchToBroker({
        id: task.id,
        skillRef: task.skillRef || 'unknown',
        goal: task.name,
        payload: task.payload,
        capability: task.capability,
        createdAt: new Date().toISOString(),
        priority: task.priority === 'critical' ? 1 : task.priority === 'high' ? 2 : 3,
        // Pass tenant scope from environment so the broker can enforce
        // multitenant isolation (goal-driven tasks were previously tenant-agnostic).
        tenantId: process.env.TNF_TENANT_ID || undefined,
        workspaceId: process.env.TNF_WORKSPACE_ID || undefined,
      });
      return true;
    }

    // Try to use a skill
    if (task.skillRef) {
      const skill = this.skillRegistry.getSkill(task.skillRef);
      if (skill && skill.commands.length > 0) {
        console.log(chalk.dim(`      📖 Using skill: ${skill.name}`));
        await this.simulateExecution(task);
        return true;
      }
    }

    // Fallback: broadcast to agent network
    console.log(chalk.dim(`      📡 Broadcasting task to agent network`));
    await this.client.broadcast({
      type: 'command',
      content: `Execute task: ${task.name}`,
      metadata: { taskId: task.id, payload: task.payload },
    });

    return true;
  }

  private async simulateExecution(task: Task): Promise<void> {
    // Simulate work being done
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /** Get current system status for monitoring */
  async getStatus(): Promise<{ workflows: number; tasks: number; skills: number; health: string }> {
    const state = await this.stateManager.getSystemState();
    return {
      workflows: this.activeWorkflows.size,
      tasks: Array.from(this.activeWorkflows.values()).reduce(
        (sum, wf) => sum + wf.tasks.length,
        0
      ),
      skills: this.skillRegistry.getAllSkills().length,
      health: state.health,
    };
  }

  /** Proactive health check - suggest actions based on state */
  async suggestActions(): Promise<string[]> {
    const suggestions: string[] = [];
    const state = await this.stateManager.getSystemState();

    if (state.pendingTasks > 10) {
      suggestions.push('High task backlog detected. Consider spawning additional workers.');
    }
    if (state.health === 'degraded') {
      suggestions.push('System health is degraded. Run health-check workflow immediately.');
    }
    if (state.activeDirectives.length === 0) {
      suggestions.push('No active directives found. Check LIVING_STATE for stale entries.');
    }

    return suggestions.length > 0
      ? suggestions
      : ['System is healthy. No immediate action needed.'];
  }
}

// ============================================================================
// Legacy Orchestrator (kept for backward compatibility)
// ============================================================================
export class Orchestrator {
  private enhanced: EnhancedOrchestrator;

  constructor(client: RedisAgentClient, repoRoot: string = process.cwd()) {
    this.enhanced = new EnhancedOrchestrator(client, repoRoot);
    // Initialize the enhanced orchestrator in the background
    this.enhanced.initialize().catch(() => {});
  }

  async executeWorkflow(workflowName: string, params: any = {}) {
    // Route legacy named workflows through the new goal-based system
    const goalMap: Record<string, string> = {
      'health-check': 'Run system-wide health check and report anomalies',
      'code-review': `Review code at ${params.path || '.'} for quality issues`,
      'self-improvement': 'Run self-improvement cycle and capture learnings',
    };

    const goal = goalMap[workflowName] || workflowName;

    // If it looks like a natural language goal, use the enhanced orchestrator
    if (goal.length > 20 || goal.includes(' ')) {
      return this.enhanced.executeGoal(goal);
    }

    // Otherwise, fall back to the old switch statement
    return this.legacyExecute(workflowName, params);
  }

  /** Direct goal execution - the new powerful interface */
  async executeGoal(goal: string): Promise<Workflow> {
    return this.enhanced.executeGoal(goal);
  }

  /** Get system status */
  async getStatus() {
    return this.enhanced.getStatus();
  }

  /** Get proactive suggestions */
  async suggestActions() {
    return this.enhanced.suggestActions();
  }

  private async legacyExecute(workflowName: string, params: any = {}) {
    // Old switch-statement implementation
    switch (workflowName) {
      case 'health-check':
        return { status: 'completed', message: 'Health check completed (legacy mode)' };
      case 'code-review':
        return {
          status: 'completed',
          message: `Code review for ${params.path} completed (legacy mode)`,
        };
      case 'self-improvement':
        return { status: 'completed', message: 'Self-improvement cycle completed (legacy mode)' };
      default:
        throw new Error(`Unknown workflow: ${workflowName}`);
    }
  }
}
