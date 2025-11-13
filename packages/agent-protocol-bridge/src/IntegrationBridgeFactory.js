"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationBridgeFactoryImplementation = void 0;
const AgentHub_1 = require("./services/AgentHub");
const AgentDiscoveryService_1 = require("./services/AgentDiscoveryService");
const TaskOrchestrator_1 = require("./services/TaskOrchestrator");
const AgentCommunicationBridge_1 = require("./services/AgentCommunicationBridge");
const MCPClient_1 = require("../../core/src/mcp/MCPClient");
const ProtobufAdapter_1 = require("./adapters/ProtobufAdapter");
const WebSocketBridge_1 = require("./bridges/WebSocketBridge");
const SSEBridge_1 = require("./bridges/SSEBridge");
const N8NBridge_1 = require("./bridges/N8NBridge");
const WebhookBridge_1 = require("./bridges/WebhookBridge");
const ClaudeSubAgentBridge_1 = require("./bridges/ClaudeSubAgentBridge");
// Placeholder implementations for other bridges
const placeholderN8NBridge = {
    executeWorkflow: async (workflowId) => { throw new Error('Not implemented'); },
    registerWebhook: async (workflowId, path) => { throw new Error('Not implemented'); },
    handleWebhook: async (path, payload) => { throw new Error('Not implemented'); },
};
const placeholderWebhookBridge = {
    createWebhook: async (config) => { throw new Error('Not implemented'); },
    deliverEvent: async (eventType, data) => { throw new Error('Not implemented'); },
    validateWebhook: async (url) => { throw new Error('Not implemented'); },
};
const placeholderSSEBridge = {
    createConnection: async (clientId, response) => { throw new Error('Not implemented'); },
    subscribe: async (clientId, eventTypes) => { throw new Error('Not implemented'); },
    broadcast: async (event) => { throw new Error('Not implemented'); },
    closeConnection: async (clientId) => { throw new Error('Not implemented'); },
};
const placeholderWebSocketBridge = {
    createConnection: async (socket, connectionId) => { throw new Error('Not implemented'); },
    sendMessage: async (connectionId, message) => { throw new Error('Not implemented'); },
    broadcast: async (message, targets) => { throw new Error('Not implemented'); },
    createRoom: async (name, options) => { throw new Error('Not implemented'); },
};
const placeholderWeb3Bridge = {
    createAccount: async (userId, options) => { throw new Error('Not implemented'); },
    connectWallet: async (userId, walletType) => { throw new Error('Not implemented'); },
    sendTransaction: async (accountId, transaction) => { throw new Error('Not implemented'); },
    deployContract: async (accountId, deployment) => { throw new Error('Not implemented'); },
    monitorEvents: async (contractAddress, eventFilters) => { throw new Error('Not implemented'); },
};
const placeholderTheiaBridge = {
    createWorkspace: async (config) => { throw new Error('Not implemented'); },
    startSession: async (workspaceId, options) => { throw new Error('Not implemented'); },
    executeFileOperation: async (projectId, operation, filePath) => { throw new Error('Not implemented'); },
    executeCommand: async (projectId, command) => { throw new Error('Not implemented'); },
    setupLanguageServer: async (projectId, language) => { throw new Error('Not implemented'); },
};
class IntegrationBridgeFactoryImplementation {
    createN8NBridge(config) {
        return Promise.resolve(new N8NBridge_1.N8NBridgeImplementation(config));
    }
    createWebhookBridge(config) {
        return Promise.resolve(new WebhookBridge_1.WebhookBridgeImplementation(config));
    }
    createSSEBridge(config) {
        return Promise.resolve(new SSEBridge_1.SSEBridgeImplementation(config));
    }
    createWebSocketBridge(config) {
        return Promise.resolve(new WebSocketBridge_1.WebSocketBridgeImplementation(config));
    }
    createWeb3Bridge(config) {
        return Promise.resolve(placeholderWeb3Bridge);
    }
    createTheiaBridge(config) {
        return Promise.resolve(placeholderTheiaBridge);
    }
    createClaudeBridge(config) {
        return Promise.resolve(new ClaudeSubAgentBridge_1.ClaudeSubAgentBridgeImplementation(config));
    }
    /**
     * Create an AgentHub instance with proper dependencies
     */
    async createAgentHub(config = {}) {
        // Create or use provided ProtobufAdapter
        const protobufAdapter = config.protobufAdapter || new ProtobufAdapter_1.ProtobufAdapter();
        const agentHub = new AgentHub_1.AgentHub(config.a2aService, config.mcpClient, config.messageRouter, config.agentsDirectory, config.discoveryService, config.communicationBridge, protobufAdapter);
        // Wait for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        return agentHub;
    }
    /**
     * Create an AgentDiscoveryService instance
     */
    async createAgentDiscoveryService(options = {}) {
        const discoveryService = new AgentDiscoveryService_1.AgentDiscoveryService(options);
        // Perform initial discovery
        await discoveryService.discoverAgents();
        return discoveryService;
    }
    /**
     * Create a TaskOrchestrator instance
     */
    async createTaskOrchestrator(options = {}) {
        const orchestrator = new TaskOrchestrator_1.TaskOrchestrator(options);
        return orchestrator;
    }
    /**
     * Create an AgentCommunicationBridge instance
     */
    async createAgentCommunicationBridge(a2aService, mcpClient, messageRouter, config) {
        const bridge = new AgentCommunicationBridge_1.AgentCommunicationBridge(a2aService, mcpClient, messageRouter, config);
        return bridge;
    }
    /**
     * Create an integrated agent stack with all services properly configured
     */
    async createIntegratedAgentStack(config = {}) {
        // Create shared ProtobufAdapter for consistent protocol handling
        const protobufAdapter = config.protobufAdapter || new ProtobufAdapter_1.ProtobufAdapter();
        // Create discovery service first with consistent directory configuration
        const discoveryOptions = {
            ...config.discoveryOptions,
            agentsDirectory: config.agentsDirectory || config.discoveryOptions?.agentsDirectory,
        };
        const discoveryService = await this.createAgentDiscoveryService(discoveryOptions);
        // Create task orchestrator
        const taskOrchestrator = await this.createTaskOrchestrator(config.orchestratorOptions);
        // Create communication bridge
        const communicationBridge = await this.createAgentCommunicationBridge(config.a2aService, config.mcpClient, config.messageRouter, config.bridgeConfiguration);
        // Create agent hub with all dependencies including discovery service, communication bridge, and shared adapter
        const agentHub = await this.createAgentHub({
            ...config,
            discoveryService,
            communicationBridge,
            protobufAdapter,
        });
        // Wire up the services
        this.wireServices(agentHub, discoveryService, taskOrchestrator, communicationBridge);
        return {
            agentHub,
            discoveryService,
            taskOrchestrator,
            communicationBridge,
        };
    }
    /**
     * Wire up services to work together
     */
    wireServices(agentHub, discoveryService, taskOrchestrator, communicationBridge) {
        // Forward discovery events to agent hub
        discoveryService.on('agentsDiscovered', (agents) => {
            agentHub.emit('agentsDiscovered', agents);
        });
        discoveryService.on('agentUpdated', (agent) => {
            agentHub.emit('agentConfigurationUpdated', agent);
        });
        // Forward agent hub events to orchestrator
        agentHub.on('taskCreated', (task) => {
            // Could queue task in orchestrator if needed
        });
        // Forward communication events
        communicationBridge.on('messageSent', (event) => {
            agentHub.emit('messageSent', event);
        });
        communicationBridge.on('messageError', (event) => {
            agentHub.emit('messageError', event);
        });
        // Set up error handling
        discoveryService.on('discoveryError', (error) => {
            agentHub.emit('error', { source: 'discovery', error });
        });
        taskOrchestrator.on('processingError', (error) => {
            agentHub.emit('error', { source: 'orchestrator', error });
        });
    }
    /**
     * Create a lightweight AgentHub with minimal dependencies
     */
    async createSimpleAgentHub() {
        return this.createAgentHub();
    }
    /**
     * Create pre-configured services for common use cases
     */
    async createA2AService() {
        // This would typically be injected or configured externally
        throw new Error('A2AService creation requires external configuration');
    }
    async createMCPClient() {
        // This would typically be injected or configured externally
        return new MCPClient_1.MCPClient();
    }
    async createMessageRouter() {
        // MessageRouter requires fully initialized A2AService and MCPService dependencies.
        // This factory method cannot create a functional MessageRouter without these services.
        // Please provide a properly configured MessageRouter via AgentHubConfig.messageRouter.
        throw new Error('MessageRouter creation requires external configuration of A2AService and MCPService');
    }
    /**
     * Validate service configuration
     */
    validateConfiguration(config) {
        const errors = [];
        // Validate discovery options
        if (config.discoveryOptions) {
            if (config.discoveryOptions.agentsDirectory && typeof config.discoveryOptions.agentsDirectory !== 'string') {
                errors.push('agentsDirectory must be a string');
            }
        }
        // Validate orchestrator options
        if (config.orchestratorOptions) {
            if (config.orchestratorOptions.processingInterval && config.orchestratorOptions.processingInterval < 100) {
                errors.push('processingInterval must be at least 100ms');
            }
            if (config.orchestratorOptions.maxConcurrentTasks && config.orchestratorOptions.maxConcurrentTasks < 1) {
                errors.push('maxConcurrentTasks must be at least 1');
            }
        }
        // Validate bridge configuration
        if (config.bridgeConfiguration) {
            if (config.bridgeConfiguration.defaultTimeout && config.bridgeConfiguration.defaultTimeout < 1000) {
                errors.push('defaultTimeout must be at least 1000ms');
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
exports.IntegrationBridgeFactoryImplementation = IntegrationBridgeFactoryImplementation;
//# sourceMappingURL=IntegrationBridgeFactory.js.map