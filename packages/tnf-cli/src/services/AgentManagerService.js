import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
export class AgentManagerService {
    constructor(configDir) {
        this.agents = new Map();
        this.configDir = configDir || path.join(os.homedir(), '.config', 'tnf', 'agents');
        this.loadAgents();
    }
    loadAgents() {
        const agentsPath = path.join(this.configDir, 'agents.json');
        if (fs.existsSync(agentsPath)) {
            try {
                const agentsData = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
                if (Array.isArray(agentsData)) {
                    for (const agent of agentsData) {
                        this.agents.set(agent.id, agent);
                    }
                }
            }
            catch {
                // Agents file doesn't exist or is invalid
            }
        }
    }
    saveAgents() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        const agentsPath = path.join(this.configDir, 'agents.json');
        const agentsArray = Array.from(this.agents.values());
        fs.writeFileSync(agentsPath, JSON.stringify(agentsArray, null, 2));
    }
    create(name, role, platform, options) {
        const id = randomUUID();
        const now = new Date().toISOString();
        const agent = {
            id,
            name,
            role,
            platform,
            capabilities: options?.capabilities || this.getDefaultCapabilities(role, platform),
            isOnline: false,
            lastSeen: now,
            createdAt: now,
            metadata: options?.metadata,
        };
        this.agents.set(id, agent);
        this.saveAgents();
        return agent;
    }
    getDefaultCapabilities(role, platform) {
        const roleCapabilities = {
            orchestrator: ['coordinate', 'delegate', 'plan', 'review'],
            broker: ['route', 'transform', 'mediate'],
            worker: ['execute', 'report', 'collaborate'],
            participant: ['message', 'observe', 'respond'],
        };
        const platformCapabilities = {
            antigravity: ['file:read', 'file:write', 'bash', 'web'],
            gemini: ['search', 'analyze', 'generate', 'multimodal'],
            claude: ['reason', 'code', 'analyze', 'instruct'],
            jules: ['github', 'pr', 'issue', 'workflow'],
            vscode: ['file:read', 'file:write', 'terminal', 'debug'],
            browser: ['web', 'render', 'interact'],
            custom: [],
        };
        return [...(roleCapabilities[role] || []), ...(platformCapabilities[platform] || [])];
    }
    list() {
        return Array.from(this.agents.values());
    }
    get(id) {
        return this.agents.get(id);
    }
    getByName(name) {
        for (const agent of this.agents.values()) {
            if (agent.name === name)
                return agent;
        }
        return undefined;
    }
    update(id, updates) {
        const agent = this.agents.get(id);
        if (!agent)
            return undefined;
        const updated = { ...agent, ...updates };
        this.agents.set(id, updated);
        this.saveAgents();
        return updated;
    }
    delete(id) {
        const existed = this.agents.delete(id);
        if (existed) {
            this.saveAgents();
        }
        return existed;
    }
    markOnline(id) {
        return this.update(id, { isOnline: true, lastSeen: new Date().toISOString() });
    }
    markOffline(id) {
        return this.update(id, { isOnline: false, lastSeen: new Date().toISOString() });
    }
    importTemplate(template) {
        return this.create(template.name, template.role, template.platform, {
            capabilities: template.capabilities,
            metadata: template.systemPrompt ? { systemPrompt: template.systemPrompt } : undefined,
        });
    }
    exportTemplate(id) {
        const agent = this.agents.get(id);
        if (!agent)
            return undefined;
        return {
            name: agent.name,
            role: agent.role,
            platform: agent.platform,
            capabilities: agent.capabilities,
            systemPrompt: agent.metadata?.systemPrompt,
        };
    }
}
//# sourceMappingURL=AgentManagerService.js.map