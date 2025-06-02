/**
 * Enhanced Integration Service
 * Integrates all state-of-the-art components into a cohesive system:
 * - MCP 2025 Client integration
 * - A2A Protocol integration
 * - Multi-Agent Orchestration
 * - Security and Observability
 * - Performance optimization and connection pooling
 * - Advanced error handling and resilience
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { MCP2025Client, MCP2025ClientConfig } from '../mcp/MCP2025Client';
import { A2AProtocolClient } from '../protocols/A2AProtocol';
import { MultiAgentOrchestrationService } from './MultiAgentOrchestrationService';
import { SecurityObservabilityService } from './SecurityObservabilityService';
import { AgentCommunicationService } from './AgentCommunicationService';

export interface IntegrationConfig {
    mcp2025: MCP2025ClientConfig;
    mcp: {
        endpoints: Array<{
            name: string;
            config: MCP2025ClientConfig;
            priority: number;
            healthCheck: boolean;
        }>;
        connectionPool: {
            maxConnections: number;
            idleTimeout: number; // ms
            retryDelay: number; // ms
            healthCheckInterval: number; // ms
        };
    };
    a2a: {
        discovery: {
            enabled: boolean;
            broadcastInterval: number; // ms
            timeout: number; // ms
        };
        heartbeat: {
            interval: number; // ms
            timeout: number; // ms
        };
    };
    orchestration: {
        defaultStrategy: string;
        maxConcurrentTasks: number;
        taskTimeout: number; // ms
        retryPolicy: {
            maxRetries: number;
            backoffMultiplier: number;
            initialDelay: number; // ms
        };
    };
    security: {
        encryption: {
            algorithm: string;
            keyLength: number;
            secretKey: string;
        };
        authentication: {
            enabled: boolean;
            tokenExpiry: number; // seconds
            refreshTokenExpiry: number; // seconds
            maxLoginAttempts: number;
            lockoutDuration: number; // seconds
        };
        authorization: {
            enabled: boolean;
            roleBasedAccess: boolean;
            permissions: Record<string, string[]>;
        };
        audit: {
            enabled: boolean;
            retentionDays: number;
            includeRequestBodies: boolean;
            sensitiveFields: string[];
        };
    };
    observability: {
        metrics: {
            enabled: boolean;
            interval: number; // seconds
            retention: number; // days
            customMetrics: string[];
        };
        tracing: {
            enabled: boolean;
            samplingRate: number; // 0-1
            includeUserData: boolean;
        };
        logging: {
            level: 'debug' | 'info' | 'warn' | 'error';
            structured: boolean;
            includeStackTrace: boolean;
            maxLogSize: number; // bytes
        };
        alerting: {
            enabled: boolean;
            thresholds: Record<string, number>;
            notificationChannels: string[];
        };
    };
    performance: {
        connectionPool: {
            maxConnections: number;
            idleTimeout: number;
            connectionTimeout: number;
        };
        caching: {
            enabled: boolean;
            ttl: number; // seconds
            maxSize: number; // entries
        };
        rateLimiting: {
            enabled: boolean;
            requests: number;
            window: number; // seconds
        };
    };
}

export interface ConnectionPool {
    id: string;
    type: 'mcp' | 'a2a' | 'websocket';
    connection: any;
    endpoint: string;
    isActive: boolean;
    lastUsed: Date;
    useCount: number;
    healthStatus: 'healthy' | 'unhealthy' | 'unknown';
    lastHealthCheck: Date;
}

export interface CacheEntry {
    key: string;
    value: any;
    timestamp: Date;
    ttl: number;
    accessCount: number;
    lastAccess: Date;
}

export interface RateLimitEntry {
    key: string;
    requests: number;
    windowStart: Date;
}

export class EnhancedIntegrationService extends EventEmitter {
    private config: IntegrationConfig;
    private mcpClients: Map<string, MCP2025Client> = new Map();
    private a2aClient: A2AProtocolClient | null = null;
    private orchestrationService: MultiAgentOrchestrationService | null = null;
    private securityService: SecurityObservabilityService | null = null;
    private agentCommunication: AgentCommunicationService;
    
    private connectionPools: Map<string, ConnectionPool> = new Map();
    private cache: Map<string, CacheEntry> = new Map();
    private rateLimits: Map<string, RateLimitEntry> = new Map();
    
    private _isInitialized: boolean = false; // Renamed to avoid conflict
    private healthCheckTimer: NodeJS.Timeout | null = null;
    private cacheCleanupTimer: NodeJS.Timeout | null = null;
    private rateLimitCleanupTimer: NodeJS.Timeout | null = null;

    constructor(
        config: IntegrationConfig,
        agentCommunication: AgentCommunicationService
    ) {
        super();
        this.config = config;
        this.agentCommunication = agentCommunication;
    }

    async initialize(): Promise<void> {
        if (this._isInitialized) { // Use renamed property
            return;
        }

        try {
            const initSpan = this.startTrace('service_initialization');
            
            // Initialize Security and Observability first
            await this.initializeSecurity();
            
            // Initialize MCP clients
            await this.initializeMCPClients();
            
            // Initialize A2A protocol
            await this.initializeA2AProtocol();
            
            // Initialize orchestration service
            await this.initializeOrchestration();
            
            // Start background services
            this.startBackgroundServices();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            this._isInitialized = true; // Use renamed property
            this.finishTrace(initSpan, 'ok');
            this.emit('initialized');
            
            this.logAuditEvent('service_initialization', 'success');
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    private async initializeSecurity(): Promise<void> {
        const span = this.startTrace('security_initialization');
        
        try {
            this.securityService = new SecurityObservabilityService(
                this.config.security,
                this.config.observability
            );

            // Setup security event handlers
            this.securityService.on('securityThreat', (threat) => {
                this.emit('securityThreat', threat);
            });

            this.securityService.on('alert', (alert) => {
                this.emit('performanceAlert', alert);
            });

            this.finishTrace(span, 'ok');
        } catch (error) {
            this.finishTrace(span, 'error');
            throw error;
        }
    }

    private async initializeMCPClients(): Promise<void> {
        const span = this.startTrace('mcp_initialization');
        
        try {
            for (const endpointConfig of this.config.mcp.endpoints) {
                const client = new MCP2025Client(endpointConfig.config);
                
                // Setup client event handlers
                client.on('connected', () => {
                    this.emit('mcpConnected', endpointConfig.name);
                    this.logAuditEvent(`mcp_connected_${endpointConfig.name}`, 'success');
                });

                client.on('disconnected', () => {
                    this.emit('mcpDisconnected', endpointConfig.name);
                    this.logAuditEvent(`mcp_disconnected_${endpointConfig.name}`, 'success');
                });

                client.on('error', (error) => {
                    this.emit('mcpError', endpointConfig.name, error);
                    this.logAuditEvent(`mcp_error_${endpointConfig.name}`, 'error', { error: error.message });
                });

                await client.connect();
                this.mcpClients.set(endpointConfig.name, client);

                // Add to connection pool
                this.addToConnectionPool({
                    id: `mcp_${endpointConfig.name}`,
                    type: 'mcp',
                    connection: client,
                    endpoint: endpointConfig.config.endpoint,
                    isActive: true,
                    lastUsed: new Date(),
                    useCount: 0,
                    healthStatus: 'healthy',
                    lastHealthCheck: new Date()
                });
            }

            this.finishTrace(span, 'ok');
        } catch (error) {
            this.finishTrace(span, 'error');
            throw error;
        }
    }

    private async initializeA2AProtocol(): Promise<void> {
        const span = this.startTrace('a2a_initialization');
        
        try {
            // this.a2aClient is expected to be injected/set externally, not instantiated here.
            if (!this.a2aClient) {
                throw new Error('A2AProtocolClient is not initialized or injected.');
            }

            // Setup A2A event handlers on the existing this.a2aClient instance
            this.a2aClient.on('agentDiscovered', (agent: import('../protocols/A2AProtocol').A2AAgent) => {
                this.emit('agentDiscovered', agent);
                this.logAuditEvent('agent_discovered', 'success', { agentId: agent.id });
                // Emitting agentJoined here as A2AProtocolClient discovered an agent
                this.emit('agentJoined', agent.id, agent.metadata);
            });

            this.a2aClient.on('taskDelegated', (task: import('../protocols/A2AProtocol').A2ATask) => {
                this.emit('taskDelegated', task);
                this.logAuditEvent('task_delegated', 'success', { taskId: task.id });
            });

            this.a2aClient.on('taskCompleted', (taskId: string, result: any) => {
                this.emit('taskCompleted', taskId, result);
                this.logAuditEvent('task_completed', 'success', { taskId });
            });

            // Removed: await this.a2aClient.connect(this.agentCommunication);
            // A2AProtocolClient does not have a 'connect' method. It initializes itself.

            // Add to connection pool
            this.addToConnectionPool({
                id: 'a2a_protocol',
                type: 'a2a',
                connection: this.a2aClient,
                endpoint: 'local',
                isActive: true,
                lastUsed: new Date(),
                useCount: 0,
                healthStatus: 'healthy',
                lastHealthCheck: new Date()
            });

            this.finishTrace(span, 'ok');
        } catch (error) {
            this.finishTrace(span, 'error');
            throw error;
        }
    }

    private async initializeOrchestration(): Promise<void> {
        const span = this.startTrace('orchestration_initialization');
        
        try {
            if (!this.a2aClient) {
                throw new Error('A2A client must be initialized before orchestration');
            }

            this.orchestrationService = new MultiAgentOrchestrationService(
                this.agentCommunication,
                this.a2aClient
            );

            // Setup orchestration event handlers
            this.orchestrationService.on('workflowCompleted', (workflow) => {
                this.emit('workflowCompleted', workflow);
                this.logAuditEvent('workflow_completed', 'success', { workflowId: workflow.id });
            });

            this.orchestrationService.on('taskFailed', (task, error) => {
                this.emit('taskFailed', task, error);
                this.logAuditEvent('task_failed', 'failure', { 
                    taskId: task.id, 
                    error: error.message 
                });
            });

            this.orchestrationService.on('consensusReached', (consensus) => {
                this.emit('consensusReached', consensus);
                this.logAuditEvent('consensus_reached', 'success', { 
                    requestId: consensus.id,
                    result: consensus.result 
                });
            });

            this.finishTrace(span, 'ok');
        } catch (error) {
            this.finishTrace(span, 'error');
            throw error;
        }
    }

    private startBackgroundServices(): void {
        // Health check timer
        if (this.config.mcp.connectionPool.healthCheckInterval > 0) {
            this.healthCheckTimer = setInterval(() => {
                this.performHealthChecks();
            }, this.config.mcp.connectionPool.healthCheckInterval);
        }

        // Cache cleanup timer
        if (this.config.performance.caching.enabled) {
            this.cacheCleanupTimer = setInterval(() => {
                this.cleanupCache();
            }, 60000); // Every minute
        }

        // Rate limit cleanup timer
        if (this.config.performance.rateLimiting.enabled) {
            this.rateLimitCleanupTimer = setInterval(() => {
                this.cleanupRateLimits();
            }, 60000); // Every minute
        }
    }

    private setupEventHandlers(): void {
        // Agent communication events:
        // 'agentJoined' is now emitted from initializeA2AProtocol when a2aClient discovers an agent.
        // AgentCommunicationService uses 'subscribe', not 'on', for general message handling.
        // Specific 'agentLeft' or general 'error' events from AgentCommunicationService via 'on' are not present.
        // If AgentCommunicationService needs to signal errors, it would typically throw them or use specific event emissions.
        // For now, removing these direct .on listeners from agentCommunication.
    }

    // Enhanced MCP Operations with Connection Pooling
    async callMCPTool(
        endpointName: string,
        toolName: string,
        arguments_: Record<string, any>,
        options?: { 
            timeout?: number; 
            retries?: number;
            useCache?: boolean;
            sessionId?: string;
        }
    ): Promise<any> {
        const span = this.startTrace('mcp_tool_call');
        this.addTraceTag(span, 'endpoint', endpointName);
        this.addTraceTag(span, 'tool', toolName);

        try {
            // Check authorization if session provided
            if (options?.sessionId && this.securityService) {
                const authorized = this.securityService.checkAuthorization(
                    options.sessionId,
                    'mcp.tool.call',
                    `${endpointName}.${toolName}`
                );
                
                if (!authorized) {
                    throw new Error('Unauthorized to call MCP tool');
                }
            }

            // Check rate limiting
            if (this.config.performance.rateLimiting.enabled) {
                const limitKey = `mcp_${endpointName}_${toolName}`;
                if (!this.checkRateLimit(limitKey)) {
                    throw new Error('Rate limit exceeded');
                }
            }

            // Check cache first
            if (options?.useCache && this.config.performance.caching.enabled) {
                const cacheKey = `mcp_${endpointName}_${toolName}_${JSON.stringify(arguments_)}`;
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    this.finishTrace(span, 'ok');
                    return cached;
                }
            }

            const client = this.mcpClients.get(endpointName);
            if (!client) {
                throw new Error(`MCP endpoint ${endpointName} not found`);
            }

            // Update connection pool
            const poolEntry = this.connectionPools.get(`mcp_${endpointName}`);
            if (poolEntry) {
                poolEntry.lastUsed = new Date();
                poolEntry.useCount++;
            }

            const result = await client.callTool(toolName, arguments_);

            // Cache result if enabled
            if (options?.useCache && this.config.performance.caching.enabled) {
                const cacheKey = `mcp_${endpointName}_${toolName}_${JSON.stringify(arguments_)}`;
                this.addToCache(cacheKey, result);
            }

            this.finishTrace(span, 'ok');
            this.recordMetric('mcp.tool.call.success', 1, { endpoint: endpointName, tool: toolName });
            
            return result;

        } catch (error) {
            this.finishTrace(span, 'error');
            this.recordMetric('mcp.tool.call.error', 1, { endpoint: endpointName, tool: toolName });
            throw error;
        }
    }

    async listMCPTools(endpointName: string, sessionId?: string): Promise<any[]> {
        const span = this.startTrace('mcp_list_tools');
        
        try {
            // Check authorization
            if (sessionId && this.securityService) {
                const authorized = this.securityService.checkAuthorization(
                    sessionId,
                    'mcp.tools.list',
                    endpointName
                );
                
                if (!authorized) {
                    throw new Error('Unauthorized to list MCP tools');
                }
            }

            const client = this.mcpClients.get(endpointName);
            if (!client) {
                throw new Error(`MCP endpoint ${endpointName} not found`);
            }

            const tools = await client.listTools();
            
            // Get tool annotations
            await client.annotateTools();
            const annotatedTools = tools.map(tool => ({
                ...tool,
                annotation: client.getToolAnnotation(tool.name)
            }));

            this.finishTrace(span, 'ok');
            return annotatedTools;

        } catch (error) {
            this.finishTrace(span, 'error');
            throw error;
        }
    }

    // Enhanced Orchestration Operations
    async createWorkflow(
        name: string,
        description: string,
        tasks: any[],
        sessionId?: string
    ): Promise<string> {
        const span = this.startTrace('create_workflow');
        
        try {
            // Check authorization
            if (sessionId && this.securityService) {
                const authorized = this.securityService.checkAuthorization(
                    sessionId,
                    'orchestration.workflow.create'
                );
                
                if (!authorized) {
                    throw new Error('Unauthorized to create workflow');
                }
            }

            if (!this.orchestrationService) {
                throw new Error('Orchestration service not initialized');
            }

            const workflowId = this.orchestrationService.createWorkflow(name, description, tasks);
            
            this.finishTrace(span, 'ok');
            this.recordMetric('orchestration.workflow.created', 1);
            
            return workflowId;

        } catch (error) {
            this.finishTrace(span, 'error');
            throw error;
        }
    }

    async startWorkflow(workflowId: string, strategy?: string, sessionId?: string): Promise<void> {
        const span = this.startTrace('start_workflow');
        
        try {
            // Check authorization
            if (sessionId && this.securityService) {
                const authorized = this.securityService.checkAuthorization(
                    sessionId,
                    'orchestration.workflow.start'
                );
                
                if (!authorized) {
                    throw new Error('Unauthorized to start workflow');
                }
            }

            if (!this.orchestrationService) {
                throw new Error('Orchestration service not initialized');
            }

            this.orchestrationService.startWorkflow(
                workflowId, 
                strategy || this.config.orchestration.defaultStrategy
            );
            
            this.finishTrace(span, 'ok');
            this.recordMetric('orchestration.workflow.started', 1);

        } catch (error) {
            this.finishTrace(span, 'error');
            throw error;
        }
    }

    async requestConsensus(
        topic: string,
        proposal: any,
        participants: string[],
        config: any,
        sessionId?: string
    ): Promise<string> {
        const span = this.startTrace('request_consensus');
        
        try {
            // Check authorization
            if (sessionId && this.securityService) {
                const authorized = this.securityService.checkAuthorization(
                    sessionId,
                    'orchestration.consensus.request'
                );
                
                if (!authorized) {
                    throw new Error('Unauthorized to request consensus');
                }
            }

            if (!this.orchestrationService) {
                throw new Error('Orchestration service not initialized');
            }

            const requestId = this.orchestrationService.requestConsensus(topic, proposal, participants, config);
            
            this.finishTrace(span, 'ok');
            this.recordMetric('orchestration.consensus.requested', 1);
            
            return requestId;

        } catch (error) {
            this.finishTrace(span, 'error');
            throw error;
        }
    }

    // Connection Pool Management
    private addToConnectionPool(pool: ConnectionPool): void {
        this.connectionPools.set(pool.id, pool);
        this.recordMetric('connection.pool.added', 1, { type: pool.type });
    }

    private async performHealthChecks(): Promise<void> {
        for (const [id, pool] of this.connectionPools.entries()) {
            try {
                let isHealthy = false;

                switch (pool.type) {
                    case 'mcp':
                        // Check MCP client health
                        const mcpClient = pool.connection as MCP2025Client;
                        const tools = await mcpClient.listTools();
                        isHealthy = Array.isArray(tools);
                        break;

                    case 'a2a':
                        // Check A2A client health
                        const a2aClient = pool.connection as import('../protocols/A2AProtocol').A2AProtocolClient;
                        // Use the new public getter
                        isHealthy = a2aClient.getLocalAgent().status === 'online';
                        break;

                    default:
                        isHealthy = true;
                }

                pool.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
                pool.lastHealthCheck = new Date();

                if (!isHealthy) {
                    this.emit('connectionUnhealthy', pool);
                }

            } catch (error) {
                pool.healthStatus = 'unhealthy';
                pool.lastHealthCheck = new Date();
                this.emit('connectionError', pool, error);
            }
        }
    }

    // Caching Operations
    private addToCache(key: string, value: any, ttl?: number): void {
        if (!this.config.performance.caching.enabled) {
            return;
        }

        const entry: CacheEntry = {
            key,
            value,
            timestamp: new Date(),
            ttl: ttl || this.config.performance.caching.ttl,
            accessCount: 0,
            lastAccess: new Date()
        };

        this.cache.set(key, entry);
        this.recordMetric('cache.entries.added', 1);
    }

    private getFromCache(key: string): any | null {
        if (!this.config.performance.caching.enabled) {
            return null;
        }

        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        const age = (Date.now() - entry.timestamp.getTime()) / 1000;
        if (age > entry.ttl) {
            this.cache.delete(key);
            this.recordMetric('cache.entries.expired', 1);
            return null;
        }

        entry.accessCount++;
        entry.lastAccess = new Date();
        this.recordMetric('cache.hits', 1);
        
        return entry.value;
    }

    private cleanupCache(): void {
        const now = Date.now();
        let expired = 0;

        for (const [key, entry] of this.cache.entries()) {
            const age = (now - entry.timestamp.getTime()) / 1000;
            if (age > entry.ttl) {
                this.cache.delete(key);
                expired++;
            }
        }

        // Also enforce max size
        if (this.cache.size > this.config.performance.caching.maxSize) {
            const entries = Array.from(this.cache.entries());
            entries.sort(([,a], [,b]) => a.lastAccess.getTime() - b.lastAccess.getTime());
            
            const toRemove = this.cache.size - this.config.performance.caching.maxSize;
            for (let i = 0; i < toRemove; i++) {
                this.cache.delete(entries[i][0]);
            }
        }

        if (expired > 0) {
            this.recordMetric('cache.cleanup.expired', expired);
        }
    }

    // Rate Limiting
    private checkRateLimit(key: string): boolean {
        if (!this.config.performance.rateLimiting.enabled) {
            return true;
        }

        const now = new Date();
        const windowStart = new Date(now.getTime() - this.config.performance.rateLimiting.window * 1000);
        
        let entry = this.rateLimits.get(key);
        
        if (!entry || entry.windowStart < windowStart) {
            entry = {
                key,
                requests: 1,
                windowStart: now
            };
            this.rateLimits.set(key, entry);
            return true;
        }

        if (entry.requests >= this.config.performance.rateLimiting.requests) {
            this.recordMetric('ratelimit.exceeded', 1, { key });
            return false;
        }

        entry.requests++;
        return true;
    }

    private cleanupRateLimits(): void {
        const now = new Date();
        const windowDuration = this.config.performance.rateLimiting.window * 1000;
        
        for (const [key, entry] of this.rateLimits.entries()) {
            if (now.getTime() - entry.windowStart.getTime() > windowDuration) {
                this.rateLimits.delete(key);
            }
        }
    }

    // Utility Methods
    private startTrace(operationName: string): string {
        return this.securityService?.startTrace(operationName) || '';
    }

    private finishTrace(spanId: string, status: 'ok' | 'error' | 'timeout' = 'ok'): void {
        this.securityService?.finishTrace(spanId, status);
    }

    private addTraceTag(spanId: string, key: string, value: any): void {
        this.securityService?.addTraceTag(spanId, key, value);
    }

    private recordMetric(name: string, value: number, tags?: Record<string, string>): void {
        this.securityService?.recordMetric({
            name,
            value,
            timestamp: new Date(),
            tags: tags || {},
            type: 'counter'
        });
    }

    private logAuditEvent(action: string, outcome: 'success' | 'failure' | 'error', details?: any): void {
        this.securityService?.logAuditEvent({
            action,
            resource: 'integration_service',
            outcome,
            details: details || {},
            ipAddress: 'localhost',
            userAgent: 'vscode-extension',
            severity: 'low'
        });
    }

    // Public API Methods
    isInitialized(): boolean {
        return this._isInitialized; // Use renamed property
    }

    getStatus(): Record<string, any> {
        return {
            initialized: this.isInitialized,
            mcpClients: Array.from(this.mcpClients.keys()),
            connectionPools: Array.from(this.connectionPools.values()).map(p => ({
                id: p.id,
                type: p.type,
                isActive: p.isActive,
                healthStatus: p.healthStatus,
                useCount: p.useCount
            })),
            cacheSize: this.cache.size,
            rateLimitEntries: this.rateLimits.size,
            metrics: this.securityService?.getMetrics() || {}
        };
    }

    getConnectionPools(): ConnectionPool[] {
        return Array.from(this.connectionPools.values());
    }

    async authenticate(username: string, password: string): Promise<any> {
        if (!this.securityService) {
            throw new Error('Security service not initialized');
        }

        return this.securityService.authenticateUser(username, password, 'localhost', 'vscode-extension');
    }

    async dispose(): Promise<void> {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        if (this.cacheCleanupTimer) {
            clearInterval(this.cacheCleanupTimer);
        }
        if (this.rateLimitCleanupTimer) {
            clearInterval(this.rateLimitCleanupTimer);
        }

        // Disconnect MCP clients
        for (const client of this.mcpClients.values()) {
            await client.disconnect();
        }

        // Disconnect A2A client
        if (this.a2aClient) {
            // A2AProtocolClient has a dispose method, not disconnect.
            // Assuming dispose is synchronous or if async, it should be awaited if it returns Promise.
            // For now, calling dispose as per A2AProtocol.ts.
            this.a2aClient.dispose();
        }

        // Dispose services
        this.orchestrationService?.dispose();
        this.securityService?.dispose();

        this.removeAllListeners();
        this._isInitialized = false; // Assign to the private property
    }
}
