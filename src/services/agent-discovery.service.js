"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentDiscoveryService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_service_js_1 = require("../lib/drizzle/drizzle.service.js");
const mcp_broker_service_tsx_1 = require("../mcp/services/mcp-broker.service.tsx");
const client_1 = require("@drizzle/client");
const event_emitter_1 = require("@nestjs/event-emitter");
/**
 * Service for discovering and registering agents
 * This implements the standard discovery protocol for all agents
 */
let AgentDiscoveryService = AgentDiscoveryService_1 = class AgentDiscoveryService {
    drizzle;
    mcpBroker;
    eventEmitter;
    logger = new common_1.Logger(AgentDiscoveryService_1.name);
    constructor(drizzle, mcpBroker, eventEmitter) {
        this.drizzle = drizzle;
        this.mcpBroker = mcpBroker;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Register a new agent with its tools
     */
    async registerAgent(name, description, type, userId, capabilities, tools) {
        try {
            this.logger.log(`Registering agent: ${name}`);
            // Check if agent already exists
            const existingAgent = await this.drizzle.agent.findFirst({
                where: {
                    name
                }
            });
            if (existingAgent) {
                this.logger.log(`Agent ${name} already registered with ID: ${existingAgent.id}`);
                return existingAgent;
            }
            // Register agent in database
            const agent = await this.drizzle.agent.create({
                data: {
                    name,
                    description,
                    type,
                    status: client_1.AgentStatus.ACTIVE,
                    userId,
                    config: {
                        capabilities,
                        tools,
                        metadata: {
                            registrationDate: new Date().toISOString(),
                            lastUpdated: new Date().toISOString()
                        }
                    }
                }
            });
            this.logger.log(`Successfully registered agent ${name} with ID: ${agent.id}`);
            // Create metrics entry for the agent
            await this.drizzle.codeMetrics.create({
                data: {
                    agentId: agent.id,
                    linesOfCode: 0,
                    tokensUsed: 0
                }
            });
            // Emit agent registered event
            this.eventEmitter.emit('agent.registered', { agent });
            return agent;
        }
        catch (error) {
            this.logger.error(`Error registering agent ${name}:`, error);
            throw error;
        }
    }
    /**
     * Discover all available MCP tools
     */
    async discoverMCPTools() {
        try {
            this.logger.log('Discovering MCP tools...');
            // Get all tools from MCP Broker
            const allTools = this.mcpBroker.getAllTools();
            // Transform tools into a structured format
            const structuredTools = {};
            for (const [serverName, tools] of Object.entries(allTools)) {
                structuredTools[serverName] = Object.entries(tools).map(([toolName, tool]) => ({
                    name: toolName,
                    description: tool.description,
                    parameters: tool.parameters,
                    capabilities: this.inferCapabilitiesFromTool(toolName, tool.description)
                }));
            }
            this.logger.log(`Discovered ${Object.keys(structuredTools).length} MCP tool categories`);
            return structuredTools;
        }
        catch (error) {
            this.logger.error('Error discovering MCP tools:', error);
            throw error;
        }
    }
    /**
     * Discover all registered agents
     */
    async discoverAgents() {
        try {
            this.logger.log('Discovering registered agents...');
            const agents = await this.drizzle.agent.findMany({
                where: {
                    status: client_1.AgentStatus.ACTIVE
                },
                include: {
                    metrics: true
                }
            });
            this.logger.log(`Discovered ${agents.length} registered agents`);
            return agents;
        }
        catch (error) {
            this.logger.error('Error discovering agents:', error);
            throw error;
        }
    }
    /**
     * Update agent tools
     */
    async updateAgentTools(agentId, tools) {
        try {
            this.logger.log(`Updating tools for agent ${agentId}`);
            const agent = await this.drizzle.agent.findUnique({
                where: { id: agentId }
            });
            if (!agent) {
                throw new Error(`Agent with ID ${agentId} not found`);
            }
            // Update agent config with new tools
            const config = agent.config || {};
            config.tools = tools;
            config.metadata = {
                ...config.metadata,
                lastUpdated: new Date().toISOString()
            };
            await this.drizzle.agent.update({
                where: { id: agentId },
                data: { config }
            });
            this.logger.log(`Updated tools for agent ${agentId}`);
            // Emit agent tools updated event
            this.eventEmitter.emit('agent.tools.updated', { agentId, tools });
            return true;
        }
        catch (error) {
            this.logger.error(`Error updating tools for agent ${agentId}:`, error);
            throw error;
        }
    }
    /**
     * Infer capabilities from tool name and description
     */
    inferCapabilitiesFromTool(name, description) {
        const capabilities = [];
        const lowerName = name.toLowerCase();
        const lowerDesc = description.toLowerCase();
        // Code-related capabilities
        if (lowerName.includes('code') || lowerDesc.includes('code')) {
            capabilities.push('code_manipulation');
        }
        if (lowerName.includes('file') || lowerDesc.includes('file')) {
            capabilities.push('file_manipulation');
        }
        if (lowerName.includes('search') || lowerDesc.includes('search')) {
            capabilities.push('search');
        }
        if (lowerName.includes('web') || lowerDesc.includes('web')) {
            capabilities.push('web_access');
        }
        if (lowerName.includes('process') || lowerDesc.includes('process')) {
            capabilities.push('process_management');
        }
        if (lowerName.includes('database') || lowerDesc.includes('database')) {
            capabilities.push('database_access');
        }
        if (lowerName.includes('api') || lowerDesc.includes('api')) {
            capabilities.push('api_access');
        }
        // If no capabilities were inferred, add a generic one
        if (capabilities.length === 0) {
            capabilities.push('tool_usage');
        }
        return capabilities;
    }
};
exports.AgentDiscoveryService = AgentDiscoveryService;
exports.AgentDiscoveryService = AgentDiscoveryService = AgentDiscoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof drizzle_service_js_1.DatabaseService !== "undefined" && drizzle_service_js_1.DatabaseService) === "function" ? _a : Object, mcp_broker_service_tsx_1.MCPBrokerService,
        event_emitter_1.EventEmitter2])
], AgentDiscoveryService);
//# sourceMappingURL=agent-discovery.service.js.map