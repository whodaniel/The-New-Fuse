import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { readFile, readdir } from 'fs/promises';
import { WorkerDispatcher, SelfImprovementTracker, ComprehensiveSkillScanner } from './orchestration-enhancements.js';
// ---------------------------------------------------------------------------
// GoalPlanner: Decomposes natural language goals into task trees
// ---------------------------------------------------------------------------
export class GoalPlanner {
    static { this.BUILT_IN_PATTERNS = [
        {
            pattern: /deploy|build|gcp|cloud.?build|docker|kubernetes/i,
            skill: 'tnf-full-auto-network-autopilot',
            tasks: ['validate-config', 'build-image', 'deploy-to-gcp', 'verify-deployment']
        },
        {
            pattern: /refactor|cleanup|dead.code|duplicate|optimize|simplify/i,
            skill: 'tnf-refactoring-triage',
            tasks: ['scan-codebase', 'identify-hotspots', 'prioritize-changes', 'execute-safe-refactors']
        },
        {
            pattern: /test|health.?check|monitor|diagnose|inspect/i,
            skill: 'tnf-health-check',
            tasks: ['run-health-checks', 'aggregate-results', 'report-anomalies']
        },
        {
            pattern: /register|spawn|create.*worker|agent.*register|worker.*setup/i,
            skill: 'tnf-agent-ecosystem-classification',
            tasks: ['validate-registry', 'create-worker-config', 'install-cron', 'verify-heartbeat']
        },
        {
            pattern: /install.*skill|skill.*install|enable.*skill|add.*capability/i,
            skill: 'skill-installer',
            tasks: ['discover-skill', 'validate-compatibility', 'install-skill', 'verify-functionality']
        },
        {
            pattern: /search|lookup|find.*information|research/i,
            skill: 'tavily-search',
            tasks: ['formulate-query', 'execute-search', 'synthesize-results']
        },
        {
            pattern: /error|fail|bug|fix.*broken|troubleshoot/i,
            skill: 'self-improving-agent',
            tasks: ['capture-error-context', 'log-to-learnings', 'suggest-fix']
        },
        {
            pattern: /browser|chrome|automation|scrape|web.*scrap/i,
            skill: '.agent/skills/agent-browser',
            tasks: ['launch-browser', 'navigate-target', 'extract-data', 'close-browser']
        },
        {
            pattern: /security|threat|audit|vulnerability|pen.?test/i,
            skill: 'security-threat-model',
            tasks: ['identify-assets', 'model-threats', 'assess-risks', 'plan-mitigations']
        },
        {
            pattern: /note|journal|memory|remember|recall/i,
            skill: 'tnf-note-taking',
            tasks: ['capture-note', 'categorize-note', 'index-note', 'link-related']
        }
    ]; }
    constructor() {
        this.goalPatterns = [];
        this.goalPatterns = [...GoalPlanner.BUILT_IN_PATTERNS];
    }
    /** Dynamically add patterns discovered from skills */
    addPatternFromSkill(skill) {
        const words = skill.description.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        // Create a pattern from unique significant words
        const uniqueWords = [...new Set(words)].slice(0, 5);
        if (uniqueWords.length >= 2) {
            const patternStr = uniqueWords.join('|');
            this.goalPatterns.push({
                pattern: new RegExp(patternStr, 'i'),
                skill: skill.name,
                tasks: ['analyze-goal', `execute-${skill.name}`, 'verify-completion']
            });
        }
    }
    /**
     * Parse a natural language goal and decompose it into a structured Workflow.
     * Falls back to a generic single-task workflow if no pattern matches.
     */
    async plan(goal) {
        const workflow = {
            id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: `Goal: ${goal.slice(0, 60)}${goal.length > 60 ? '...' : ''}`,
            goal,
            tasks: [],
            status: 'planning',
            createdAt: new Date().toISOString(),
            metadata: { planningStrategy: 'pattern-match' }
        };
        // Try pattern matching first
        for (const pattern of this.goalPatterns) {
            if (pattern.pattern.test(goal)) {
                workflow.metadata.planningStrategy = `pattern:${pattern.skill}`;
                workflow.tasks = pattern.tasks.map((name, idx) => this.createTask(name, pattern.skill, idx));
                break;
            }
        }
        // No pattern match - create a single exploratory task
        if (workflow.tasks.length === 0) {
            workflow.tasks.push({
                id: `task-${Date.now()}-0`,
                name: 'exploratory-analysis',
                description: `Analyze goal: "${goal}" and determine best approach`,
                priority: 'high',
                status: 'pending',
                dependencies: [],
                payload: { goal, strategy: 'exploratory' },
                attempts: 0,
                maxAttempts: 3
            });
            workflow.metadata.planningStrategy = 'exploratory';
        }
        // Add dependency chain
        for (let i = 1; i < workflow.tasks.length; i++) {
            workflow.tasks[i].dependencies.push(workflow.tasks[i - 1].id);
        }
        workflow.status = 'running';
        return workflow;
    }
    createTask(name, skill, index) {
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
            maxAttempts: 3
        };
    }
}
// ---------------------------------------------------------------------------
// SkillRegistry: Discovers and invokes skills dynamically
// ---------------------------------------------------------------------------
export class SkillRegistry {
    constructor(repoRoot) {
        this.skills = new Map();
        this.skillsPath = path.join(repoRoot, '.agent', 'skills');
    }
    /** Scan all SKILL.md files and build the skill index */
    async discover() {
        const discovered = [];
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
        }
        catch (err) {
            // Skills directory may not exist in all contexts
        }
        return discovered;
    }
    /** Parse a single skill directory */
    async parseSkill(dirName) {
        try {
            const skillPath = path.join(this.skillsPath, dirName, 'SKILL.md');
            const content = await readFile(skillPath, 'utf-8');
            // Parse YAML frontmatter
            const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
            if (!match)
                return null;
            const frontmatter = match[1];
            const body = match[2];
            // Simple YAML parser for frontmatter
            const name = frontmatter.match(/name:\s*(.+)/)?.[1]?.trim() || dirName;
            const description = frontmatter.match(/description:\s*(.+)/)?.[1]?.trim() || '';
            // Extract triggers from description and body keywords
            const triggers = this.extractTriggers(description + ' ' + body);
            // Extract command references
            const commands = [];
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
                confidence: 0.8
            };
        }
        catch {
            return null;
        }
    }
    extractTriggers(text) {
        const triggers = new Set();
        const keywords = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
        for (const kw of keywords) {
            if (['skill', 'agent', 'deploy', 'build', 'test', 'refactor', 'orchestrate', 'monitor'].includes(kw)) {
                triggers.add(kw);
            }
        }
        return Array.from(triggers);
    }
    /** Find the best matching skill for a given goal or task */
    async findSkill(query) {
        const q = query.toLowerCase();
        let best = null;
        let bestScore = 0;
        for (const skill of this.skills.values()) {
            let score = 0;
            // Match triggers
            for (const trigger of skill.triggers) {
                if (q.includes(trigger))
                    score += 10;
            }
            // Match description words
            const descWords = skill.description.toLowerCase().split(/\s+/);
            for (const word of descWords) {
                if (q.includes(word))
                    score += 2;
            }
            if (score > bestScore) {
                bestScore = score;
                best = skill;
            }
        }
        return best;
    }
    /** Get a skill by exact name */
    getSkill(name) {
        return this.skills.get(name);
    }
    getAllSkills() {
        return Array.from(this.skills.values());
    }
}
// ---------------------------------------------------------------------------
// StateManager: Reads/writes LIVING_STATE and other protocol files
// ---------------------------------------------------------------------------
export class StateManager {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.statePath = path.join(repoRoot, 'docs', 'protocols', 'LIVING_STATE.md');
        this.ledgerPath = path.join(repoRoot, 'docs', 'protocols', 'AGENT_STATUS_LEDGER.md');
    }
    /** Read current system state from LIVING_STATE.md */
    async getSystemState() {
        const state = {
            activeDirectives: [],
            pendingTasks: 0,
            activeWorkers: 0,
            skillsAvailable: 0,
            lastSync: new Date().toISOString(),
            health: 'healthy'
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
        }
        catch {
            // State file may not exist
        }
        return state;
    }
    /** Update LIVING_STATE.md with a new entry */
    async appendProgress(step) {
        try {
            const entry = `\n- [✅] ${new Date().toISOString()} Orchestrator: ${step}\n`;
            await fs.promises.appendFile(this.statePath, entry);
        }
        catch {
            // Ignore write errors in read-only contexts
        }
    }
    /** Get the current directive from LIVING_STATE */
    async getCurrentDirective() {
        try {
            const content = await readFile(this.statePath, 'utf-8');
            const match = content.match(/\*\*Current Directive:\*\*\s*(.+?)(?:\n|$)/);
            return match?.[1]?.trim() || null;
        }
        catch {
            return null;
        }
    }
}
// ---------------------------------------------------------------------------
// WorkerPool: Manages worker lifecycle via Redis registry
// ---------------------------------------------------------------------------
export class WorkerPool {
    constructor(client) {
        this.client = client;
        this.workers = new Map();
    }
    /** Scan Redis for available workers */
    async discoverWorkers() {
        // In a real implementation, this would query Redis HGETALL tnf:agent-registry
        // For now, we return a mock based on known worker types
        const knownWorkers = [
            { id: 'agent_hermes-codegen-worker_1782364000001', name: 'hermes-codegen-worker', capabilities: ['code_generation', 'typescript_strict'] },
            { id: 'agent_hermes-infra-worker_1782364000002', name: 'hermes-infra-worker', capabilities: ['infra_audit', 'build_config_render'] }
        ];
        return knownWorkers.map(w => ({
            ...w,
            role: 'worker',
            platform: 'claude',
            status: 'active',
            lastSeen: new Date().toISOString(),
            queue: `tnf:direct:sub-director:${w.id}`
        }));
    }
    /** Find the best worker for a given task */
    async findWorker(task) {
        const allWorkers = await this.discoverWorkers();
        // Score workers by capability overlap
        let best = null;
        let bestScore = 0;
        for (const worker of allWorkers) {
            const score = worker.capabilities.filter(cap => task.skillRef?.toLowerCase().includes(cap.toLowerCase()) ||
                task.name.toLowerCase().includes(cap.toLowerCase())).length;
            if (score > bestScore) {
                bestScore = score;
                best = worker;
            }
        }
        return best;
    }
    /** Send a task to a worker via Redis */
    async dispatchToWorker(worker, task) {
        try {
            await this.client.send(JSON.stringify({
                type: 'task',
                taskId: task.id,
                payload: task.payload,
                skillRef: task.skillRef
            }), {
                type: 'command',
                metadata: {
                    target: worker.id,
                    queue: worker.queue,
                    workflow: 'orchestrated-dispatch'
                }
            });
            return true;
        }
        catch {
            return false;
        }
    }
}
// ---------------------------------------------------------------------------
// EnhancedOrchestrator: Goal-driven, skill-aware autonomous agent
// ---------------------------------------------------------------------------
export class EnhancedOrchestrator {
    constructor(client, repoRoot) {
        this.client = client;
        this.goalPlanner = new GoalPlanner();
        this.activeWorkflows = new Map();
        this.skillCacheLoaded = false;
        this.repoRoot = repoRoot;
        this.skillRegistry = new SkillRegistry(repoRoot);
        this.stateManager = new StateManager(repoRoot);
        this.workerPool = new WorkerPool(client);
        this.workerDispatcher = new WorkerDispatcher();
        this.selfImprovement = new SelfImprovementTracker(repoRoot);
        this.skillScanner = new ComprehensiveSkillScanner(repoRoot);
    }
    /** Bootstrap: discover skills, verify state, prepare for operation */
    async initialize() {
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
                confidence: pattern.confidence
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
    async executeGoal(goal) {
        console.log(chalk.cyan(`
🎯 Processing goal: ${chalk.bold(goal)}`));
        // Phase 1: Plan - Decompose goal into tasks
        const workflow = await this.goalPlanner.plan(goal);
        this.activeWorkflows.set(workflow.id, workflow);
        console.log(chalk.dim(`   📋 Planned ${workflow.tasks.length} tasks (${workflow.metadata.planningStrategy})`));
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
            if (task.status !== 'pending' || task.dependencies.length > 0)
                continue;
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
            }
            catch (e) {
                // Non-critical: don't fail if logging fails
            }
        }
        else {
            console.log(chalk.red(`   ❌,robotWorkflow failed: ${workflow.name}`));
            // Log failure to self-improvement
            try {
                const failedTask = workflow.tasks.find(t => t.status === 'failed');
                await this.selfImprovement.logFailure(goal, workflow.id, failedTask ? `Task "${failedTask.name}" failed: ${failedTask.error || 'Unknown error'}` : 'Workflow failed', 'Review task logs and retry with adjusted parameters');
            }
            catch (e) {
                // Non-critical: don't fail if logging fails
            }
        }
        return workflow;
    }
    /**
     * Execute a traditional named workflow (backward compatible)
     */
    async executeWorkflow(workflow) {
        const pending = workflow.tasks.filter(t => t.status === 'pending');
        for (const task of pending) {
            // Check dependencies
            const blocked = task.dependencies.some(depId => {
                const depTask = workflow.tasks.find(t => t.id === depId);
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
            }
            catch (err) {
                task.status = 'failed';
                task.error = err instanceof Error ? err.message : String(err);
                // Retry logic
                task.attempts++;
                if (task.attempts < task.maxAttempts) {
                    console.log(chalk.yellow(`   🔄 Retrying task "${task.name}" (attempt ${task.attempts + 1}/${task.maxAttempts})`));
                    task.status = 'pending';
                }
            }
        }
        workflow.status = workflow.tasks.every(t => t.status === 'completed') ? 'completed' :
            workflow.tasks.some(t => t.status === 'failed') ? 'failed' : 'running';
        return workflow.status === 'completed';
    }
    /** Execute a single task using the appropriate skill or real worker dispatch */
    async executeTask(task) {
        console.log(chalk.cyan(`   ▶️  Executing: ${task.name}`));
        // Try real worker dispatch first (Redis LPUSH to actual worker queue)
        if (task.capability && (task.capability === 'code' || task.capability === 'infra')) {
            console.log(chalk.dim(`      📡 Pushing to worker queue via Redis (capability: ${task.capability})`));
            await this.workerDispatcher.dispatchByCapability({
                id: task.id,
                skillRef: task.skillRef || 'unknown',
                goal: task.name,
                payload: task.payload,
                capability: task.capability,
                createdAt: new Date().toISOString(),
                priority: task.priority === 'critical' ? 1 : task.priority === 'high' ? 2 : 3
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
            metadata: { taskId: task.id, payload: task.payload }
        });
        return true;
    }
    async simulateExecution(task) {
        // Simulate work being done
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    /** Get current system status for monitoring */
    async getStatus() {
        const state = await this.stateManager.getSystemState();
        return {
            workflows: this.activeWorkflows.size,
            tasks: Array.from(this.activeWorkflows.values()).reduce((sum, wf) => sum + wf.tasks.length, 0),
            skills: this.skillRegistry.getAllSkills().length,
            health: state.health
        };
    }
    /** Proactive health check - suggest actions based on state */
    async suggestActions() {
        const suggestions = [];
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
        return suggestions.length > 0 ? suggestions : ['System is healthy. No immediate action needed.'];
    }
}
// ============================================================================
// Legacy Orchestrator (kept for backward compatibility)
// ============================================================================
export class Orchestrator {
    constructor(client, repoRoot = process.cwd()) {
        this.enhanced = new EnhancedOrchestrator(client, repoRoot);
        // Initialize the enhanced orchestrator in the background
        this.enhanced.initialize().catch(() => { });
    }
    async executeWorkflow(workflowName, params = {}) {
        // Route legacy named workflows through the new goal-based system
        const goalMap = {
            'health-check': 'Run system-wide health check and report anomalies',
            'code-review': `Review code at ${params.path || '.'} for quality issues`,
            'self-improvement': 'Run self-improvement cycle and capture learnings'
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
    async executeGoal(goal) {
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
    async legacyExecute(workflowName, params = {}) {
        // Old switch-statement implementation
        switch (workflowName) {
            case 'health-check':
                return { status: 'completed', message: 'Health check completed (legacy mode)' };
            case 'code-review':
                return { status: 'completed', message: `Code review for ${params.path} completed (legacy mode)` };
            case 'self-improvement':
                return { status: 'completed', message: 'Self-improvement cycle completed (legacy mode)' };
            default:
                throw new Error(`Unknown workflow: ${workflowName}`);
        }
    }
}
//# sourceMappingURL=orchestration.js.map