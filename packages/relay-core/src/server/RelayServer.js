/**
 * Unified Relay Server for The New Fuse Framework
 *
 * Consolidates functionality from:
 * - comprehensive-tnf-relay.js
 * - enhanced-tnf-relay.js
 * - basic-relay.js
 * - relay-adapter.js
 * - message-bridge.js
 */
import { EventEmitter } from 'events';
import { WebSocketTransport } from '../transports/WebSocketTransport.js';
import { HTTPTransport } from '../transports/HTTPTransport.js';
import { FileTransport } from '../transports/FileTransport.js';
import { MCPTransport } from '../transports/MCPTransport.js';
import { RedisTransport } from '../transports/RedisTransport.js';
import { UnifiedBridge } from '../adapters/UnifiedBridge.js';
import { AgentRegistry } from '../utils/AgentRegistry.js';
import { MessageRouter } from '../utils/MessageRouter.js';
import { Logger } from '../utils/Logger.js';
import { ProtocolTranslator } from '../protocols/ProtocolTranslator.js';
import { A2AProtocolAdapter } from '../protocols/A2AProtocolAdapter.js';
import { AnthropicXmlAdapter } from '../protocols/AnthropicXmlAdapter.js';
import { OpenAIAdapter } from '../protocols/OpenAIAdapter.js';
import { LangchainAdapter } from '../protocols/LangchainAdapter.js';
import { CrewAIAdapter } from '../protocols/CrewAIAdapter.js';
import { OrchestratorIntegrationService } from '../services/OrchestratorIntegrationService.js';
export class RelayServer extends EventEmitter {
    config;
    logger;
    transports;
    agentRegistry;
    messageRouter;
    bridge;
    protocolTranslator;
    systemStatus;
    isRunning = false;
    interceptedMessages = [];
    orchestratorService;
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger(config.logLevel, config.workspaceDir);
        this.transports = new Map();
        this.agentRegistry = new AgentRegistry(this.logger);
        this.messageRouter = new MessageRouter(this.logger);
        this.bridge = new UnifiedBridge(this.logger);
        this.protocolTranslator = new ProtocolTranslator(this.logger);
        // Initialize orchestrator integration service
        this.orchestratorService = new OrchestratorIntegrationService({
            workspaceRoot: config.workspaceDir,
            enableHeartbeatMonitoring: true,
            enableCleanup: true,
            enableStatePreservation: true,
            redis: config.redis || { host: 'localhost', port: 6379, database: 0 },
            heartbeat: {
                intervalMs: 30000, // 30 seconds
                timeoutMs: 120000, // 2 minutes
                maxRetries: 3,
                escalationDelay: 300000, // 5 minutes
                stagnationThresholdMs: 900000 // 15 minutes
            },
            cleanup: {
                backupDirectory: `${config.workspaceDir}/backups`,
                dryRun: false,
                createBackups: true
            }
        }, this.logger);
        this.systemStatus = {
            startTime: new Date().toISOString(),
            isRunning: false,
            activeConnections: 0,
            interceptCount: 0,
            messageCount: 0,
            agents: 0,
            uptime: 0
        };
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.agentRegistry.on('agentRegistered', (agent) => {
            this.logger.info(`Agent registered: ${agent.id} (${agent.type})`);
            this.systemStatus.agents = this.agentRegistry.getAgentCount();
            this.emit('agentRegistered', agent);
        });
        this.agentRegistry.on('agentDisconnected', (agentId) => {
            this.logger.info(`Agent disconnected: ${agentId}`);
            this.systemStatus.agents = this.agentRegistry.getAgentCount();
            this.emit('agentDisconnected', agentId);
        });
        this.messageRouter.on('messageRouted', (message) => {
            this.systemStatus.messageCount++;
            this.emit('messageRouted', message);
        });
        this.messageRouter.on('messageIntercepted', (message) => {
            this.interceptedMessages.push(message);
            this.systemStatus.interceptCount++;
            this.emit('messageIntercepted', message);
        });
    }
    async start() {
        try {
            this.logger.info(`Starting Unified TNF Relay Server v${this.config.version}`);
            // Initialize transports based on config
            await this.initializeTransports();
            // Start all enabled transports
            await this.startTransports();
            // Start agent discovery
            await this.agentRegistry.startDiscovery();
            // Initialize protocol adapters
            this.initializeProtocolAdapters();
            // Initialize orchestrator services
            await this.orchestratorService.initialize();
            this.isRunning = true;
            this.systemStatus.isRunning = true;
            this.systemStatus.startTime = new Date().toISOString();
            this.logger.info('Unified TNF Relay Server started successfully');
            this.emit('started');
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to start relay server: ${error instanceof Error ? error.message : String(error)}`);
            this.emit('error', error);
            return false;
        }
    }
    async stop() {
        try {
            this.logger.info('Stopping Unified TNF Relay Server');
            // Stop all transports
            for (const transport of this.transports.values()) {
                await transport.stop();
            }
            // Stop agent discovery
            await this.agentRegistry.stopDiscovery();
            // Shutdown orchestrator services
            await this.orchestratorService.shutdown();
            this.isRunning = false;
            this.systemStatus.isRunning = false;
            this.logger.info('Unified TNF Relay Server stopped');
            this.emit('stopped');
        }
        catch (error) {
            this.logger.error(`Error stopping relay server: ${error instanceof Error ? error.message : String(error)}`);
            this.emit('error', error);
        }
    }
    async initializeTransports() {
        // WebSocket Transport
        if (this.config.transports.websocket) {
            const wsTransport = new WebSocketTransport({
                port: this.config.ports.websocket,
                logger: this.logger
            });
            this.transports.set('websocket', wsTransport);
        }
        // HTTP Transport  
        if (this.config.transports.http) {
            const httpTransport = new HTTPTransport({
                port: this.config.ports.http,
                interceptRules: this.config.interceptRules,
                logger: this.logger
            });
            this.transports.set('http', httpTransport);
        }
        // File Transport
        if (this.config.transports.file) {
            const fileTransport = new FileTransport({
                workspaceDir: this.config.workspaceDir,
                logger: this.logger
            });
            this.transports.set('file', fileTransport);
        }
        // MCP Transport
        if (this.config.transports.mcp) {
            const mcpTransport = new MCPTransport({
                relayId: this.config.id,
                version: this.config.version,
                logger: this.logger
            });
            this.transports.set('mcp', mcpTransport);
        }
        // Redis Transport
        if (this.config.transports.redis) {
            const redisTransport = new RedisTransport({
                ...this.config.redis,
                logger: this.logger,
                channels: {
                    agentCommunication: 'tnf:agents',
                    workflowExecution: 'tnf:workflows',
                    systemEvents: 'tnf:system',
                    heartbeat: 'tnf:heartbeat'
                }
            });
            this.transports.set('redis', redisTransport);
        }
        // Setup transport message handlers
        for (const transport of this.transports.values()) {
            transport.onMessage((message) => {
                this.handleMessage(message);
            });
            this.bridge.addTransport(transport);
        }
    }
    async startTransports() {
        for (const [name, transport] of this.transports.entries()) {
            try {
                const success = await transport.start();
                if (success) {
                    this.logger.info(`Transport started: ${name}`);
                }
                else {
                    this.logger.warn(`Failed to start transport: ${name}`);
                }
            }
            catch (error) {
                this.logger.error(`Error starting transport ${name}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    async handleMessage(message) {
        try {
            const translatedMessage = await this.protocolTranslator.translate(message, 'a2a-v2.0');
            this.logger.debug(`Received message: ${translatedMessage.type} from ${translatedMessage.source}`);
            // Handle special message types
            switch (translatedMessage.type) {
                case 'REGISTER':
                    await this.handleAgentRegistration(translatedMessage);
                    break;
                case 'HEARTBEAT':
                    await this.handleHeartbeat(translatedMessage);
                    break;
                case 'WORKFLOW_EXECUTION':
                    await this.handleWorkflowExecution(translatedMessage);
                    break;
                default:
                    // Route message through message router
                    await this.messageRouter.route(translatedMessage, this.transports, this.agentRegistry);
            }
        }
        catch (error) {
            this.logger.error(`Error handling message: ${error instanceof Error ? error.message : String(error)}`);
            this.emit('messageError', { message, error });
        }
    }
    async handleAgentRegistration(message) {
        const { payload } = message;
        const agent = {
            id: payload.id || message.source,
            type: payload.type,
            capabilities: payload.capabilities || [],
            registeredAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            status: 'connected',
            metadata: payload.metadata
        };
        await this.agentRegistry.registerAgent(agent);
        // Send registration confirmation
        const confirmationMessage = {
            id: `confirm_${Date.now()}`,
            type: 'REGISTRATION_CONFIRMED',
            source: this.config.id,
            target: agent.id,
            payload: {
                relayInfo: {
                    id: this.config.id,
                    version: this.config.version,
                    capabilities: this.getRelayCapabilities()
                }
            },
            timestamp: new Date().toISOString()
        };
        await this.messageRouter.route(confirmationMessage, this.transports, this.agentRegistry);
    }
    async handleHeartbeat(message) {
        await this.agentRegistry.updateAgentLastSeen(message.source);
    }
    async handleWorkflowExecution(message) {
        // Delegate to workflow execution handler
        this.emit('workflowExecution', message);
    }
    getRelayCapabilities() {
        return [
            'agent_discovery',
            'message_routing',
            'protocol_translation',
            'workflow_execution',
            'api_interception',
            'multi_transport_support',
            'real_time_communication'
        ];
    }
    getSystemStatus() {
        this.systemStatus.uptime = Date.now() - new Date(this.systemStatus.startTime).getTime();
        this.systemStatus.activeConnections = Array.from(this.transports.values())
            .filter(transport => transport.isConnected()).length;
        return { ...this.systemStatus };
    }
    getAgents() {
        return this.agentRegistry.getAllAgents();
    }
    getInterceptedMessages(limit = 50) {
        return this.interceptedMessages.slice(-limit);
    }
    async sendMessage(message) {
        return await this.messageRouter.route(message, this.transports, this.agentRegistry);
    }
    addInterceptRule(hostname, rule) {
        this.config.interceptRules.set(hostname, rule);
        this.logger.info(`Added intercept rule: ${hostname} -> ${rule.action}`);
    }
    removeInterceptRule(hostname) {
        this.config.interceptRules.delete(hostname);
        this.logger.info(`Removed intercept rule: ${hostname}`);
    }
    initializeProtocolAdapters() {
        // Register all protocol adapters for comprehensive framework support
        this.logger.info('Initializing protocol adapters');
        // Core A2A adapter
        const a2aAdapter = new A2AProtocolAdapter();
        this.protocolTranslator.registerAdapter(a2aAdapter);
        // Anthropic XML adapter
        const anthropicAdapter = new AnthropicXmlAdapter(this.logger);
        this.protocolTranslator.registerAdapter(anthropicAdapter);
        // OpenAI Assistant adapter
        const openaiAdapter = new OpenAIAdapter(this.logger);
        this.protocolTranslator.registerAdapter(openaiAdapter);
        // Langchain adapter
        const langchainAdapter = new LangchainAdapter(this.logger);
        this.protocolTranslator.registerAdapter(langchainAdapter);
        // CrewAI adapter
        const crewaiAdapter = new CrewAIAdapter(this.logger);
        this.protocolTranslator.registerAdapter(crewaiAdapter);
        this.logger.info('Protocol adapters initialized: A2A, Anthropic XML, OpenAI, Langchain, CrewAI');
    }
}
//# sourceMappingURL=RelayServer.js.map