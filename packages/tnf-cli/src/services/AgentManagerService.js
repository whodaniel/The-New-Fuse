"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManagerService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const crypto_1 = require("crypto");
class AgentManagerService {
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
        const id = (0, crypto_1.randomUUID)();
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
exports.AgentManagerService = AgentManagerService;
//# sourceMappingURL=AgentManagerService.js.map