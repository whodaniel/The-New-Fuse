"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayServer = void 0;
const events_1 = require("events");
const UnifiedBridge_js_1 = require("../adapters/UnifiedBridge.js");
const JWTAuthService_js_1 = require("../auth/JWTAuthService.js");
const A2AProtocolAdapter_js_1 = require("../protocols/A2AProtocolAdapter.js");
const AnthropicXmlAdapter_js_1 = require("../protocols/AnthropicXmlAdapter.js");
const CrewAIAdapter_js_1 = require("../protocols/CrewAIAdapter.js");
const LangchainAdapter_js_1 = require("../protocols/LangchainAdapter.js");
const OpenAIAdapter_js_1 = require("../protocols/OpenAIAdapter.js");
const ProtocolTranslator_js_1 = require("../protocols/ProtocolTranslator.js");
const OrchestratorIntegrationService_js_1 = require("../services/OrchestratorIntegrationService.js");
const FileTransport_js_1 = require("../transports/FileTransport.js");
const HTTPTransport_js_1 = require("../transports/HTTPTransport.js");
const MCPTransport_js_1 = require("../transports/MCPTransport.js");
const RedisTransport_js_1 = require("../transports/RedisTransport.js");
const WebSocketTransport_js_1 = require("../transports/WebSocketTransport.js");
const AgentRegistry_js_1 = require("../utils/AgentRegistry.js");
const Logger_js_1 = require("../utils/Logger.js");
const MessageRouter_js_1 = require("../utils/MessageRouter.js");
class RelayServer extends events_1.EventEmitter {
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
    authService;
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger_js_1.Logger(config.logLevel, config.workspaceDir);
        this.transports = new Map();
        this.agentRegistry = new AgentRegistry_js_1.AgentRegistry(this.logger);
        this.messageRouter = new MessageRouter_js_1.MessageRouter(this.logger);
        this.bridge = new UnifiedBridge_js_1.UnifiedBridge(this.logger);
        this.protocolTranslator = new ProtocolTranslator_js_1.ProtocolTranslator(this.logger);
        this.authService = (0, JWTAuthService_js_1.createAuthService)();
        // Initialize orchestrator integration service
        this.orchestratorService = new OrchestratorIntegrationService_js_1.OrchestratorIntegrationService({
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
                stagnationThresholdMs: 900000, // 15 minutes
            },
            stall: {
                stallThresholdMs: 30000, // 30 seconds
                checkIntervalMs: 5000, // 5 seconds
                maxRecoveryAttempts: 3,
                autoRecover: true,
            },
            cleanup: {
                backupDirectory: `${config.workspaceDir}/backups`,
                dryRun: false,
                createBackups: true,
            },
        }, this.logger);
        this.systemStatus = {
            startTime: new Date().toISOString(),
            isRunning: false,
            activeConnections: 0,
            interceptCount: 0,
            messageCount: 0,
            agents: 0,
            uptime: 0,
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
            const wsTransport = new WebSocketTransport_js_1.WebSocketTransport({
                port: this.config.ports.websocket,
                logger: this.logger,
            });
            this.transports.set('websocket', wsTransport);
        }
        // HTTP Transport
        if (this.config.transports.http) {
            const httpTransport = new HTTPTransport_js_1.HTTPTransport({
                port: this.config.ports.http,
                interceptRules: this.config.interceptRules,
                logger: this.logger,
            });
            this.transports.set('http', httpTransport);
        }
        // File Transport
        if (this.config.transports.file) {
            const fileTransport = new FileTransport_js_1.FileTransport({
                workspaceDir: this.config.workspaceDir,
                logger: this.logger,
            });
            this.transports.set('file', fileTransport);
        }
        // MCP Transport
        if (this.config.transports.mcp) {
            const mcpTransport = new MCPTransport_js_1.MCPTransport({
                relayId: this.config.id,
                version: this.config.version,
                logger: this.logger,
            });
            this.transports.set('mcp', mcpTransport);
        }
        // Redis Transport
        if (this.config.transports.redis) {
            const redisTransport = new RedisTransport_js_1.RedisTransport({
                ...this.config.redis,
                logger: this.logger,
                channels: {
                    agentCommunication: 'tnf:agents',
                    workflowExecution: 'tnf:workflows',
                    systemEvents: 'tnf:system',
                    heartbeat: 'tnf:heartbeat',
                },
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
        const { payload, metadata } = message;
        // Check for JWT token in payload or metadata
        const token = payload.token || metadata?.token;
        let verifiedToken = null;
        if (token) {
            this.logger.info(`Authenticating agent ${message.source} via JWT...`);
            verifiedToken = this.authService.verifyToken(token);
            if (!verifiedToken) {
                this.logger.warn(`Failed authentication for agent ${message.source}. Invalid or expired token.`);
                // Send registration error
                const errorMessage = {
                    id: `error_${Date.now()}`,
                    type: 'REGISTRATION_ERROR',
                    source: this.config.id,
                    target: message.source,
                    payload: {
                        error: 'Invalid or expired authentication token',
                        code: 'AUTH_FAILED',
                    },
                    timestamp: new Date().toISOString(),
                };
                await this.messageRouter.route(errorMessage, this.transports, this.agentRegistry);
                return;
            }
            this.logger.info(`Successfully authenticated agent ${message.source} (${verifiedToken.agentId})`);
        }
        else {
            this.logger.warn(`Agent ${message.source} registering without authentication token. Security should be enforced in production.`);
        }
        const agent = {
            id: verifiedToken?.agentId || payload.id || message.source,
            type: verifiedToken?.platform || payload.type,
            capabilities: verifiedToken?.capabilities || payload.capabilities || [],
            registeredAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            status: 'connected',
            metadata: {
                ...(payload.metadata || {}),
                authenticated: !!verifiedToken,
                tokenClaims: verifiedToken,
            },
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
                    capabilities: this.getRelayCapabilities(),
                    authenticated: !!verifiedToken,
                },
            },
            timestamp: new Date().toISOString(),
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
            'real_time_communication',
        ];
    }
    getSystemStatus() {
        this.systemStatus.uptime = Date.now() - new Date(this.systemStatus.startTime).getTime();
        this.systemStatus.activeConnections = Array.from(this.transports.values()).filter((transport) => transport.isConnected()).length;
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
        const a2aAdapter = new A2AProtocolAdapter_js_1.A2AProtocolAdapter();
        this.protocolTranslator.registerAdapter(a2aAdapter);
        // Anthropic XML adapter
        const anthropicAdapter = new AnthropicXmlAdapter_js_1.AnthropicXmlAdapter(this.logger);
        this.protocolTranslator.registerAdapter(anthropicAdapter);
        // OpenAI Assistant adapter
        const openaiAdapter = new OpenAIAdapter_js_1.OpenAIAdapter(this.logger);
        this.protocolTranslator.registerAdapter(openaiAdapter);
        // Langchain adapter
        const langchainAdapter = new LangchainAdapter_js_1.LangchainAdapter(this.logger);
        this.protocolTranslator.registerAdapter(langchainAdapter);
        // CrewAI adapter
        const crewaiAdapter = new CrewAIAdapter_js_1.CrewAIAdapter(this.logger);
        this.protocolTranslator.registerAdapter(crewaiAdapter);
        this.logger.info('Protocol adapters initialized: A2A, Anthropic XML, OpenAI, Langchain, CrewAI');
    }
}
exports.RelayServer = RelayServer;
//# sourceMappingURL=RelayServer.js.map