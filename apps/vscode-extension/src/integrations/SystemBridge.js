const WebSocket = require('ws');
const EventEmitter = require('events');

/**
 * SystemBridge - Connects VSCode extension with all The New Fuse components
 * Integrates: Core packages, API Gateway, Chrome Extension, Browser Hub
 */
class SystemBridge extends EventEmitter {
    constructor(context, securityOrchestrator, logger) {
        super();
        this.context = context;
        this.securityOrchestrator = securityOrchestrator;
        this.logger = logger;

        // Connection states
        this.connections = {
            apiGateway: null,
            browserHub: null,
            chromeExtension: null
        };

        // Service instances
        this.agentSwarmOrchestration = null;
        this.memorySystem = null;
        this.workflowManager = null;

        // WebSocket connections
        this.wsConnections = new Map();

        // Configuration
        this.config = {
            apiGatewayUrl: process.env.API_GATEWAY_URL || 'http://localhost:3000',
            browserHubUrl: process.env.BROWSER_HUB_URL || 'ws://localhost:8080',
            chromeExtensionBridge: process.env.CHROME_EXT_BRIDGE || 'ws://localhost:9090'
        };

        this.initialized = false;
    }

    /**
     * Initialize all system integrations
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.logger.info('Initializing System Bridge...');

            // Initialize core services
            await this._initializeCoreServices();

            // Connect to API Gateway
            await this._connectToApiGateway();

            // Connect to Browser Hub
            await this._connectToBrowserHub();

            // Setup Chrome Extension bridge
            await this._setupChromeExtensionBridge();

            this.initialized = true;
            this.logger.success('System Bridge initialized successfully');
            this.emit('initialized');
        } catch (error) {
            this.logger.error('Failed to initialize System Bridge:', error);
            throw error;
        }
    }

    /**
     * Initialize core services from packages
     */
    async _initializeCoreServices() {
        try {
            // Agent Swarm Orchestration
            this.agentSwarmOrchestration = {
                orchestrate: async (task, agents) => {
                    this.logger.info('Orchestrating agent swarm:', task.id);
                    return await this._proxyToApiGateway('/agent/orchestrate', {
                        method: 'POST',
                        body: { task, agents }
                    });
                },
                coordinate: async (workflow, context) => {
                    this.logger.info('Coordinating workflow:', workflow.id);
                    return await this._proxyToApiGateway('/agent/coordinate', {
                        method: 'POST',
                        body: { workflow, context }
                    });
                }
            };

            // Memory System
            this.memorySystem = {
                store: async (key, data, metadata) => {
                    this.logger.debug('Storing data in memory:', key);
                    return await this._proxyToApiGateway('/memory/store', {
                        method: 'POST',
                        body: { key, data, metadata }
                    });
                },
                retrieve: async (key) => {
                    this.logger.debug('Retrieving data from memory:', key);
                    return await this._proxyToApiGateway(`/memory/retrieve/${key}`, {
                        method: 'GET'
                    });
                },
                search: async (query, filters) => {
                    this.logger.debug('Searching memory:', query);
                    return await this._proxyToApiGateway('/memory/search', {
                        method: 'POST',
                        body: { query, filters }
                    });
                }
            };

            // Workflow Manager
            this.workflowManager = {
                createWorkflow: async (definition) => {
                    this.logger.info('Creating workflow:', definition.name);
                    return await this._proxyToApiGateway('/workflow/create', {
                        method: 'POST',
                        body: definition
                    });
                },
                executeWorkflow: async (workflowId, context) => {
                    this.logger.info('Executing workflow:', workflowId);
                    return await this._proxyToApiGateway(`/workflow/execute/${workflowId}`, {
                        method: 'POST',
                        body: { context }
                    });
                },
                listWorkflows: async () => {
                    return await this._proxyToApiGateway('/workflow/list', {
                        method: 'GET'
                    });
                }
            };

            this.logger.success('Core services initialized');
        } catch (error) {
            this.logger.error('Failed to initialize core services:', error);
            throw error;
        }
    }

    /**
     * Connect to API Gateway
     */
    async _connectToApiGateway() {
        try {
            this.logger.info('Connecting to API Gateway:', this.config.apiGatewayUrl);

            // Test connection with health check
            const response = await fetch(`${this.config.apiGatewayUrl}/health`, {
                method: 'GET',
                timeout: 5000
            }).catch(() => null);

            if (response && response.ok) {
                this.connections.apiGateway = {
                    url: this.config.apiGatewayUrl,
                    status: 'connected',
                    connectedAt: new Date().toISOString()
                };
                this.logger.success('Connected to API Gateway');
            } else {
                this.logger.warn('API Gateway not available, will retry on demand');
                this.connections.apiGateway = {
                    url: this.config.apiGatewayUrl,
                    status: 'disconnected',
                    retryable: true
                };
            }
        } catch (error) {
            this.logger.warn('Could not connect to API Gateway:', error.message);
            this.connections.apiGateway = {
                url: this.config.apiGatewayUrl,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Connect to Browser Hub via WebSocket
     */
    async _connectToBrowserHub() {
        try {
            this.logger.info('Connecting to Browser Hub:', this.config.browserHubUrl);

            const ws = new WebSocket(this.config.browserHubUrl);

            ws.on('open', () => {
                this.logger.success('Connected to Browser Hub');
                this.connections.browserHub = {
                    status: 'connected',
                    connectedAt: new Date().toISOString()
                };
                this.wsConnections.set('browserHub', ws);

                // Send initial handshake
                ws.send(JSON.stringify({
                    type: 'handshake',
                    source: 'vscode-extension',
                    version: '7.0.0',
                    capabilities: ['mcp', 'file-sync', 'terminal']
                }));

                this.emit('browserHub:connected');
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this._handleBrowserHubMessage(message);
                } catch (error) {
                    this.logger.error('Failed to parse Browser Hub message:', error);
                }
            });

            ws.on('error', (error) => {
                this.logger.error('Browser Hub WebSocket error:', error);
                this.connections.browserHub = {
                    status: 'error',
                    error: error.message
                };
            });

            ws.on('close', () => {
                this.logger.warn('Browser Hub connection closed');
                this.connections.browserHub = {
                    status: 'disconnected'
                };
                this.wsConnections.delete('browserHub');

                // Attempt reconnection after delay
                setTimeout(() => this._connectToBrowserHub(), 5000);
            });
        } catch (error) {
            this.logger.warn('Could not connect to Browser Hub:', error.message);
            this.connections.browserHub = {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Setup Chrome Extension bridge
     */
    async _setupChromeExtensionBridge() {
        try {
            this.logger.info('Setting up Chrome Extension bridge:', this.config.chromeExtensionBridge);

            const ws = new WebSocket(this.config.chromeExtensionBridge);

            ws.on('open', () => {
                this.logger.success('Chrome Extension bridge connected');
                this.connections.chromeExtension = {
                    status: 'connected',
                    connectedAt: new Date().toISOString()
                };
                this.wsConnections.set('chromeExtension', ws);

                // Send initial handshake
                ws.send(JSON.stringify({
                    type: 'bridge:handshake',
                    source: 'vscode-extension',
                    capabilities: ['ai-context', 'task-delegation', 'file-transfer']
                }));

                this.emit('chromeExtension:connected');
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this._handleChromeExtensionMessage(message);
                } catch (error) {
                    this.logger.error('Failed to parse Chrome Extension message:', error);
                }
            });

            ws.on('error', (error) => {
                this.logger.error('Chrome Extension bridge error:', error);
                this.connections.chromeExtension = {
                    status: 'error',
                    error: error.message
                };
            });

            ws.on('close', () => {
                this.logger.warn('Chrome Extension bridge closed');
                this.connections.chromeExtension = {
                    status: 'disconnected'
                };
                this.wsConnections.delete('chromeExtension');

                // Attempt reconnection after delay
                setTimeout(() => this._setupChromeExtensionBridge(), 5000);
            });
        } catch (error) {
            this.logger.warn('Could not setup Chrome Extension bridge:', error.message);
            this.connections.chromeExtension = {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Handle Browser Hub messages
     */
    _handleBrowserHubMessage(message) {
        this.logger.debug('Browser Hub message:', message.type);

        switch (message.type) {
            case 'mcp:tool-result':
                this.emit('mcp:tool-result', message.data);
                break;

            case 'file:changed':
                this.emit('file:changed', message.data);
                break;

            case 'terminal:output':
                this.emit('terminal:output', message.data);
                break;

            case 'handshake:response':
                this.logger.success('Browser Hub handshake complete');
                break;

            default:
                this.emit('browserHub:message', message);
        }
    }

    /**
     * Handle Chrome Extension messages
     */
    _handleChromeExtensionMessage(message) {
        this.logger.debug('Chrome Extension message:', message.type);

        switch (message.type) {
            case 'ai:response':
                this.emit('ai:response', message.data);
                break;

            case 'task:completed':
                this.emit('task:completed', message.data);
                break;

            case 'context:updated':
                this.emit('context:updated', message.data);
                break;

            case 'bridge:handshake-response':
                this.logger.success('Chrome Extension bridge handshake complete');
                break;

            default:
                this.emit('chromeExtension:message', message);
        }
    }

    /**
     * Proxy request to API Gateway
     */
    async _proxyToApiGateway(endpoint, options = {}) {
        if (!this.connections.apiGateway || this.connections.apiGateway.status !== 'connected') {
            // Attempt reconnection
            await this._connectToApiGateway();
        }

        try {
            const url = `${this.config.apiGatewayUrl}${endpoint}`;
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            if (!response.ok) {
                throw new Error(`API Gateway error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error('API Gateway proxy error:', error);
            throw error;
        }
    }

    /**
     * Send message to Browser Hub
     */
    sendToBrowserHub(message) {
        const ws = this.wsConnections.get('browserHub');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            return true;
        } else {
            this.logger.warn('Browser Hub not connected');
            return false;
        }
    }

    /**
     * Send message to Chrome Extension
     */
    sendToChromeExtension(message) {
        const ws = this.wsConnections.get('chromeExtension');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            return true;
        } else {
            this.logger.warn('Chrome Extension not connected');
            return false;
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            apiGateway: this.connections.apiGateway?.status || 'unknown',
            browserHub: this.connections.browserHub?.status || 'unknown',
            chromeExtension: this.connections.chromeExtension?.status || 'unknown',
            initialized: this.initialized
        };
    }

    /**
     * Cleanup and close all connections
     */
    async cleanup() {
        this.logger.info('Cleaning up System Bridge connections...');

        for (const [name, ws] of this.wsConnections.entries()) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
                this.logger.info(`Closed ${name} connection`);
            }
        }

        this.wsConnections.clear();
        this.initialized = false;
        this.emit('cleanup');
    }
}

module.exports = SystemBridge;