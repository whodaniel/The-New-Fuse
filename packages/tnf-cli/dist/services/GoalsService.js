import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export class GoalsService {
    constructor() {
        this.goalsDir = path.join(os.homedir(), '.tnf', 'goals');
        this.configPath = path.join(this.goalsDir, 'config.json');
        this.config = this.loadConfig();
    }
    loadConfig() {
        if (!fs.existsSync(this.goalsDir)) {
            fs.mkdirSync(this.goalsDir, { recursive: true });
        }
        if (fs.existsSync(this.configPath)) {
            try {
                const raw = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(raw);
            }
            catch { /* ignore */ }
        }
        return { priorities: {} };
    }
    saveConfig() {
        if (!fs.existsSync(this.goalsDir)) {
            fs.mkdirSync(this.goalsDir, { recursive: true });
        }
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    }
    getGoalsFile() {
        return path.join(this.goalsDir, 'goals.json');
    }
    loadGoals() {
        const file = this.getGoalsFile();
        if (fs.existsSync(file)) {
            try {
                const raw = fs.readFileSync(file, 'utf8');
                return JSON.parse(raw);
            }
            catch { /* ignore */ }
        }
        return [];
    }
    saveGoals(goals) {
        if (!fs.existsSync(this.goalsDir)) {
            fs.mkdirSync(this.goalsDir, { recursive: true });
        }
        fs.writeFileSync(this.getGoalsFile(), JSON.stringify(goals, null, 2));
    }
    generateSlug(title) {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
    }
    generateId() {
        return `go-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    }
    // Initialize with default goals if none exist
    async initializeDefaults() {
        const existing = this.loadGoals();
        if (existing.length > 0)
            return existing;
        const defaults = [
            {
                title: 'Achieve Full Feature Parity with Hermes',
                description: 'Map and implement all 38+ Hermes commands/features in TNF CLI',
                priority: 'critical',
                category: 'Feature Parity',
                hermesFeature: 'all-commands',
                tags: ['hermes', 'parity', 'roadmap']
            },
            {
                title: 'Implement Model Selection & Provider Fallback',
                description: 'Add `tnf model` command for model/provider switching and fallback chain',
                priority: 'high',
                category: 'Core',
                hermesFeature: 'model/fallback',
                tags: ['model', 'provider', 'fallback']
            },
            {
                title: 'Build Interactive Setup Wizard',
                description: 'Create `tnf setup` for first-time user onboarding',
                priority: 'high',
                category: 'UX',
                hermesFeature: 'setup',
                tags: ['setup', 'wizard', 'onboarding']
            },
            {
                title: 'Complete Skills Hub Integration',
                description: 'Implement skill browse, install, inspect, update, audit like `hermes skills`',
                priority: 'high',
                category: 'Features',
                hermesFeature: 'skills',
                tags: ['skills', 'hub', 'procedural-memory']
            },
            {
                title: 'Expand Messaging Gateway',
                description: 'Full gateway for Telegram, Discord, Slack, WhatsApp, Signal like `hermes gateway`',
                priority: 'high',
                category: 'Integration',
                hermesFeature: 'gateway',
                tags: ['gateway', 'telegram', 'discord', 'slack', 'whatsapp']
            },
            {
                title: 'Session Management Suite',
                description: 'Full session list, rename, export, prune, delete like `hermes sessions`',
                priority: 'medium',
                category: 'Core',
                hermesFeature: 'sessions',
                tags: ['sessions', 'history', 'management']
            },
            {
                title: 'Usage Insights & Analytics',
                description: 'Build `tnf insights` for usage analytics, cost tracking, and reporting',
                priority: 'medium',
                category: 'Analytics',
                hermesFeature: 'insights',
                tags: ['insights', 'analytics', 'reporting']
            },
            {
                title: 'Diagnostic System',
                description: 'Implement `tnf doctor` for configuration and dependency health checks',
                priority: 'medium',
                category: 'DevOps',
                hermesFeature: 'doctor',
                tags: ['doctor', 'diagnostics', 'health']
            },
            {
                title: 'Backup & Restore System',
                description: 'Add `tnf backup` and `tnf import` for portable agent state',
                priority: 'medium',
                category: 'Data',
                hermesFeature: 'backup/import',
                tags: ['backup', 'import', 'restore']
            },
            {
                title: 'Multi-Profile Support',
                description: 'Isolated TNF profiles like `hermes profile create/list/switch`',
                priority: 'medium',
                category: 'Core',
                hermesFeature: 'profile',
                tags: ['profile', 'isolation', 'multi-tenant']
            },
            {
                title: 'Web UI Dashboard',
                description: 'Build `tnf dashboard` web interface for agent monitoring and control',
                priority: 'medium',
                category: 'UI',
                hermesFeature: 'dashboard',
                tags: ['dashboard', 'web-ui', 'monitoring']
            },
            {
                title: 'Log Management',
                description: 'Implement `tnf logs` for viewing, filtering, and tailing agent logs',
                priority: 'low',
                category: 'DevOps',
                hermesFeature: 'logs',
                tags: ['logs', 'monitoring', 'debugging']
            },
        ];
        const goals = defaults.map(input => this.createGoalFromInput(input));
        this.saveGoals(goals);
        return goals;
    }
    createGoalFromInput(input) {
        const now = new Date().toISOString();
        return {
            id: this.generateId(),
            slug: this.generateSlug(input.title),
            title: input.title,
            description: input.description || '',
            priority: input.priority || 'medium',
            status: 'active',
            category: input.category || 'general',
            progress: 0,
            tasks: [],
            tags: input.tags || [],
            hermesFeature: input.hermesFeature,
            createdAt: now,
            updatedAt: now,
            dueDate: input.dueDate,
        };
    }
    async list() {
        let goals = this.loadGoals();
        if (goals.length === 0) {
            goals = await this.initializeDefaults();
        }
        return goals;
    }
    async get(idOrSlug) {
        const goals = await this.list();
        return goals.find(g => g.id === idOrSlug || g.slug === idOrSlug);
    }
    async create(input) {
        const goals = await this.list();
        const goal = this.createGoalFromInput(input);
        goals.push(goal);
        this.saveGoals(goals);
        return goal;
    }
    async update(id, updates) {
        const goals = await this.list();
        const idx = goals.findIndex(g => g.id === id);
        if (idx === -1)
            return null;
        goals[idx] = { ...goals[idx], ...updates, updatedAt: new Date().toISOString() };
        this.saveGoals(goals);
        return goals[idx];
    }
    async delete(id) {
        const goals = await this.list();
        const filtered = goals.filter(g => g.id !== id);
        if (filtered.length === goals.length)
            return false;
        this.saveGoals(filtered);
        return true;
    }
    async setProgress(id, progress) {
        const clamped = Math.max(0, Math.min(100, progress));
        return this.update(id, { progress });
    }
    async setStatus(id, status) {
        const updates = { status };
        if (status === 'completed') {
            updates.completedAt = new Date().toISOString();
            updates.progress = 100;
        }
        return this.update(id, updates);
    }
    async addTask(goalId, description) {
        const goals = await this.list();
        const goal = goals.find(g => g.id === goalId);
        if (!goal)
            return null;
        const task = {
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
    async completeTask(goalId, taskId) {
        const goals = await this.list();
        const goal = goals.find(g => g.id === goalId);
        if (!goal)
            return null;
        const task = goal.tasks.find(t => t.id === taskId);
        if (!task)
            return null;
        task.completed = true;
        task.completedAt = new Date().toISOString();
        this.recalculateProgress(goal);
        this.saveGoals(goals);
        return goal;
    }
    recalculateProgress(goal) {
        if (goal.tasks.length === 0)
            return;
        const completed = goal.tasks.filter(t => t.completed).length;
        goal.progress = Math.round((completed / goal.tasks.length) * 100);
        if (goal.progress === 100 && goal.status !== 'completed') {
            goal.status = 'completed';
            goal.completedAt = new Date().toISOString();
        }
        goal.updatedAt = new Date().toISOString();
    }
    async getStats() {
        const goals = await this.list();
        return {
            total: goals.length,
            active: goals.filter(g => g.status === 'active').length,
            completed: goals.filter(g => g.status === 'completed').length,
            byPriority: {
                critical: goals.filter(g => g.priority === 'critical').length,
                high: goals.filter(g => g.priority === 'high').length,
                medium: goals.filter(g => g.priority === 'medium').length,
                low: goals.filter(g => g.priority === 'low').length,
            }
        };
    }
    async search(query) {
        const goals = await this.list();
        const q = query.toLowerCase();
        return goals.filter(g => g.title.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q) ||
            g.tags.some(t => t.toLowerCase().includes(q)) ||
            (g.hermesFeature && g.hermesFeature.toLowerCase().includes(q)));
    }
    async getByHermesFeature(feature) {
        const goals = await this.list();
        return goals.find(g => g.hermesFeature === feature);
    }
}
//# sourceMappingURL=GoalsService.js.map