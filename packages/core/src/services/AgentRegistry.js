"use strict";
/**
 * Agent Registry
 *
 * Central registry for all integrated AI agents in The New Fuse Framework.
 * Provides discovery, metadata, and capability information for all available agents.
 *
 * @module AgentRegistry
 * @since 2025-10-05
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRegistry = exports.AgentStatus = exports.AgentType = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
var AgentType;
(function (AgentType) {
    AgentType["CLI_AGENT"] = "cli_agent";
    AgentType["API_AGENT"] = "api_agent";
    AgentType["SUB_AGENT"] = "sub_agent";
    AgentType["PYDANTIC_AGENT"] = "pydantic_agent";
    AgentType["MCP_SERVER"] = "mcp_server";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["AVAILABLE"] = "available";
    AgentStatus["UNAVAILABLE"] = "unavailable";
    AgentStatus["AUTHENTICATION_REQUIRED"] = "authentication_required";
    AgentStatus["NOT_INSTALLED"] = "not_installed";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
let AgentRegistry = AgentRegistry_1 = class AgentRegistry {
    eventEmitter;
    logger = new common_1.Logger(AgentRegistry_1.name);
    agents = new Map();
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.initializeBuiltInAgents();
    }
    /**
     * Initialize built-in agents
     */
    initializeBuiltInAgents() {
        // Google Jules CLI
        this.registerAgent({
            id: 'jules-cli',
            name: 'jules',
            displayName: 'Google Jules CLI',
            type: AgentType.CLI_AGENT,
            provider: 'google',
            version: '0.1.30',
            description: 'Asynchronous AI coding agent from Google. Writes code, tests, fixes bugs, and updates dependencies.',
            status: AgentStatus.AVAILABLE,
            capabilities: [
                {
                    id: 'code-generation',
                    name: 'Code Generation',
                    description: 'Generate code based on natural language descriptions',
                    category: 'coding',
                },
                {
                    id: 'bug-fixing',
                    name: 'Bug Fixing',
                    description: 'Automatically fix bugs and issues',
                    category: 'coding',
                },
                {
                    id: 'test-writing',
                    name: 'Test Writing',
                    description: 'Write comprehensive unit and integration tests',
                    category: 'testing',
                },
                {
                    id: 'documentation',
                    name: 'Documentation Generation',
                    description: 'Generate code documentation and API docs',
                    category: 'documentation',
                },
                {
                    id: 'dependency-updates',
                    name: 'Dependency Updates',
                    description: 'Update and manage project dependencies',
                    category: 'coding',
                },
            ],
            protocols: ['GOOGLE_JULES', 'A2A_V2'],
            requiresAuth: true,
            authMethod: 'cli_login',
            cliCommand: 'jules',
            documentation: 'https://jules.google/docs',
            icon: '🤖',
            tags: ['coding', 'async', 'google', 'cli', 'github-integration'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        // Google Gemini CLI
        this.registerAgent({
            id: 'gemini-cli',
            name: 'gemini',
            displayName: 'Google Gemini CLI',
            type: AgentType.CLI_AGENT,
            provider: 'google',
            version: '2.5-pro',
            description: 'Google Gemini AI model via CLI. Provides advanced reasoning, code analysis, and multi-modal capabilities.',
            status: AgentStatus.AVAILABLE,
            capabilities: [
                {
                    id: 'code-analysis',
                    name: 'Code Analysis',
                    description: 'Deep code analysis and review',
                    category: 'analysis',
                },
                {
                    id: 'reasoning',
                    name: 'Advanced Reasoning',
                    description: 'Complex problem solving and reasoning',
                    category: 'analysis',
                },
                {
                    id: 'multimodal',
                    name: 'Multimodal Processing',
                    description: 'Process text, code, and images',
                    category: 'other',
                },
                {
                    id: 'web-search',
                    name: 'Web Search',
                    description: 'Search and retrieve information from the web',
                    category: 'other',
                },
            ],
            protocols: ['GOOGLE_A2A', 'A2A_V2'],
            requiresAuth: true,
            authMethod: 'cli_login',
            cliCommand: 'gemini',
            documentation: 'https://ai.google.dev/gemini-api/docs',
            icon: '💎',
            tags: ['reasoning', 'multimodal', 'google', 'cli', 'web-search'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        // Claude Code (Anthropic)
        this.registerAgent({
            id: 'claude-code',
            name: 'claude',
            displayName: 'Claude Code',
            type: AgentType.CLI_AGENT,
            provider: 'anthropic',
            version: '4.5',
            description: 'Anthropic Claude AI with advanced coding capabilities. Excels at code understanding, refactoring, and documentation.',
            status: AgentStatus.AVAILABLE,
            capabilities: [
                {
                    id: 'code-understanding',
                    name: 'Code Understanding',
                    description: 'Deep understanding of complex codebases',
                    category: 'analysis',
                },
                {
                    id: 'refactoring',
                    name: 'Code Refactoring',
                    description: 'Refactor and optimize code structure',
                    category: 'coding',
                },
                {
                    id: 'explanation',
                    name: 'Code Explanation',
                    description: 'Explain complex code and algorithms',
                    category: 'documentation',
                },
                {
                    id: 'security-review',
                    name: 'Security Review',
                    description: 'Identify security vulnerabilities',
                    category: 'analysis',
                },
            ],
            protocols: ['ANTHROPIC_MCP', 'A2A_V2', 'CLAUDE_SUB_AGENT'],
            requiresAuth: true,
            authMethod: 'api_key',
            documentation: 'https://claude.ai/docs',
            icon: '🎭',
            tags: ['coding', 'analysis', 'anthropic', 'security', 'refactoring'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        // Jules API
        this.registerAgent({
            id: 'jules-api',
            name: 'jules-api',
            displayName: 'Google Jules API',
            type: AgentType.API_AGENT,
            provider: 'google',
            version: '1.0',
            description: 'Jules API for programmatic integration. Same capabilities as Jules CLI but via REST API.',
            status: AgentStatus.AVAILABLE,
            capabilities: [
                {
                    id: 'api-coding',
                    name: 'API-based Coding',
                    description: 'Code generation via API',
                    category: 'coding',
                },
                {
                    id: 'webhook-integration',
                    name: 'Webhook Integration',
                    description: 'Trigger tasks via webhooks',
                    category: 'communication',
                },
            ],
            protocols: ['GOOGLE_JULES', 'HTTP', 'WEBSOCKET'],
            requiresAuth: true,
            authMethod: 'api_key',
            apiEndpoint: 'https://jules.google/api/v1',
            documentation: 'https://developer.google.com/jules/api',
            icon: '🔌',
            tags: ['api', 'webhooks', 'google', 'async'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        this.logger.log(`Initialized ${this.agents.size} built-in agents);
  }

  /**
   * Register a new agent
   */
  registerAgent(metadata: AgentMetadata): void {
    this.agents.set(metadata.id, metadata);
    this.eventEmitter.emit('agent.registered', metadata);`, this.logger.log(`Registered agent: ${metadata.displayName}`($, { metadata, : .id })));
    }
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            this.agents.delete(agentId);
            this.eventEmitter.emit('agent.unregistered', agent);
            `
      this.logger.log(`;
            Unregistered;
            agent: $;
            {
                agentId;
            }
            ``;
            ;
            return true;
        }
        return false;
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Get all agents
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agents by type
     */
    getAgentsByType(type) {
        return this.getAllAgents().filter(agent => agent.type === type);
    }
    /**
     * Get agents by provider
     */
    getAgentsByProvider(provider) {
        return this.getAllAgents().filter(agent => agent.provider === provider);
    }
    /**
     * Get agents by capability
     */
    getAgentsByCapability(capabilityId) {
        return this.getAllAgents().filter(agent => agent.capabilities.some(cap => cap.id === capabilityId));
    }
    /**
     * Get agents by status
     */
    getAgentsByStatus(status) {
        return this.getAllAgents().filter(agent => agent.status === status);
    }
    /**
     * Search agents
     */
    searchAgents(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllAgents().filter(agent => agent.name.toLowerCase().includes(lowerQuery) ||
            agent.displayName.toLowerCase().includes(lowerQuery) ||
            agent.description.toLowerCase().includes(lowerQuery) ||
            agent.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
    }
    /**
     * Get available agents (status = available)
     */
    getAvailableAgents() {
        return this.getAgentsByStatus(AgentStatus.AVAILABLE);
    }
    /**
     * Get CLI agents
     */
    getCLIAgents() {
        return this.getAgentsByType(AgentType.CLI_AGENT);
    }
    /**
     * Get API agents
     */
    getAPIAgents() {
        return this.getAgentsByType(AgentType.API_AGENT);
    }
    /**
     * Update agent status
     */
    updateAgentStatus(agentId, status) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = status;
            agent.updatedAt = new Date();
            this.eventEmitter.emit('agent.status.updated', { agentId, status });
            return true;
        }
        return false;
    }
    /**
     * Check if agent exists
     */
    hasAgent(agentId) {
        return this.agents.has(agentId);
    }
    /**
     * Get agent count
     */
    getAgentCount() {
        return this.agents.size;
    }
    /**
     * Get agent statistics
     */
    getStatistics() {
        const agents = this.getAllAgents();
        return {
            total: agents.length,
            byType: {
                [AgentType.CLI_AGENT]: this.getAgentsByType(AgentType.CLI_AGENT).length,
                [AgentType.API_AGENT]: this.getAgentsByType(AgentType.API_AGENT).length,
                [AgentType.SUB_AGENT]: this.getAgentsByType(AgentType.SUB_AGENT).length,
                [AgentType.PYDANTIC_AGENT]: this.getAgentsByType(AgentType.PYDANTIC_AGENT).length,
                [AgentType.MCP_SERVER]: this.getAgentsByType(AgentType.MCP_SERVER).length,
            },
            byProvider: agents.reduce((acc, agent) => {
                acc[agent.provider] = (acc[agent.provider] || 0) + 1;
                return acc;
            }, {}),
            byStatus: {
                [AgentStatus.AVAILABLE]: this.getAgentsByStatus(AgentStatus.AVAILABLE).length,
                [AgentStatus.UNAVAILABLE]: this.getAgentsByStatus(AgentStatus.UNAVAILABLE).length,
                [AgentStatus.AUTHENTICATION_REQUIRED]: this.getAgentsByStatus(AgentStatus.AUTHENTICATION_REQUIRED).length,
                [AgentStatus.NOT_INSTALLED]: this.getAgentsByStatus(AgentStatus.NOT_INSTALLED).length,
                [AgentStatus.ERROR]: this.getAgentsByStatus(AgentStatus.ERROR).length,
            },
        };
    }
    /**
     * Export agent registry as JSON
     */
    exportRegistry() {
        const registry = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            agents: this.getAllAgents(),
        };
        return JSON.stringify(registry, null, 2);
    }
    /**
     * Get agents compatible with a protocol
     */
    getAgentsByProtocol(protocol) {
        return this.getAllAgents().filter(agent => agent.protocols.includes(protocol));
    }
};
exports.AgentRegistry = AgentRegistry;
exports.AgentRegistry = AgentRegistry = AgentRegistry_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], AgentRegistry);
//# sourceMappingURL=AgentRegistry.js.map