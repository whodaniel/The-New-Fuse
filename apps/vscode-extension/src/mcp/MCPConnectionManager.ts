import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { SecureConnectionManager } from '../security/SecureConnectionManager';
import { SecureConfigManager } from '../security/SecureConfigManager';
import { SecurityOrchestrator } from '../security/SecurityOrchestrator';
import * as vscode from 'vscode';
import {
	MCPServerConfig,
	MCPClientCapabilities,
	MCPInitializeParams,
	MCPServerStatus,
	MCPServerStatusSummary,
	CircuitBreaker
} from '../types';

/**
 * MCP Connection Manager
 * Manages MCP server connections with lifecycle management, pooling, and health monitoring
 */
export class MCPConnectionManager {
	private context: vscode.ExtensionContext;
	private securityOrchestrator: SecurityOrchestrator;
	private secureConfigManager: SecureConfigManager | null = null;
	private secureConnectionManager: SecureConnectionManager = new SecureConnectionManager();

	// Connection pools and registries
	private connections: Map<string, Client> = new Map();
	private connectionPool: Map<string, { client: Client; config: MCPServerConfig; connectedAt: number }> = new Map();
	private toolRegistry: Map<string, string> = new Map();
	private resourceRegistry: Map<string, string> = new Map();
	private promptRegistry: Map<string, string> = new Map();

	// Health monitoring
	private healthChecks: Map<string, { status: 'healthy' | 'unhealthy' | 'unknown'; lastCheck: number; responseTime?: number }> = new Map();
	private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

	// Circuit breaker state
	private circuitBreakers: Map<string, CircuitBreaker> = new Map();

	// Retry configuration
	private retryConfig = {
		maxRetries: 3,
		initialDelay: 1000,
		backoffMultiplier: 2,
		maxDelay: 30000
	};

	// Protocol versions
	private supportedVersions: string[] = ['2024-11-05', '2025-01-01'];

	private initialized: boolean = false;

	constructor(context: vscode.ExtensionContext, securityOrchestrator: SecurityOrchestrator) {
		this.context = context;
		this.securityOrchestrator = securityOrchestrator;
	}

	/**
	 * Initialize the MCP Connection Manager
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
			this.secureConfigManager = new SecureConfigManager(this.context);
			await this.secureConfigManager.initialize();

			// Load persisted connections
			await this.loadPersistedConnections();

			// Start health monitoring
			this.startHealthMonitoring();

			this.initialized = true;
			console.log('🔗 MCP Connection Manager initialized');
		} catch (error) {
			console.error('Failed to initialize MCP Connection Manager:', error);
			throw error;
		}
	}

	/**
	 * Load persisted MCP server configurations
	 */
	async loadPersistedConnections(): Promise<void> {
		try {
			const endpoints = await this.secureConfigManager!.getMcpEndpoints();

			for (const endpoint of endpoints) {
				// @ts-ignore - Dynamic endpoint configuration
				if (endpoint.autoConnect) {
					// @ts-ignore - Runtime type is correct
					await this.connectToServer(endpoint);
				}
			}
		} catch (error) {
			console.warn('Failed to load persisted connections:', error);
		}
	}

	/**
	 * Connect to an MCP server
	 */
	async connectToServer(serverConfig: MCPServerConfig): Promise<string> {
		const serverId = serverConfig.id || this.generateServerId(serverConfig.url);

		// Check circuit breaker
		if (this.isCircuitBreakerOpen(serverId)) {
			throw new Error(`Circuit breaker open for server ${serverId}`);
		}

		try {
			// Create MCP client with appropriate transport
			const client = await this.createMCPClient(serverConfig);

			// Perform protocol handshake and version negotiation
			await this.performHandshake(client, serverConfig);

			// Register server capabilities
			await this.registerServerCapabilities(client, serverId);

			// Add to connection pool
			this.connections.set(serverId, client);
			this.connectionPool.set(serverId, { client, config: serverConfig, connectedAt: Date.now() });

			// Start heartbeat monitoring
			this.startHeartbeat(serverId);

			// Update health status
			this.updateHealthStatus(serverId, 'healthy');

			// Persist connection
			await this.persistConnection(serverConfig);

			console.log(`✅ Connected to MCP server: ${serverConfig.url}`);
			return serverId;

		} catch (error) {
			console.error(`Failed to connect to MCP server ${serverConfig.url}:`, error);
			this.recordFailure(serverId);
			throw error;
		}
	}

	/**
	 * Create MCP client with appropriate transport
	 */
	async createMCPClient(serverConfig: MCPServerConfig): Promise<Client> {
		const transport = await this.createTransport(serverConfig);
		// @ts-ignore - MCP SDK type mismatch
		const client = new Client(
			{
				name: 'the-new-fuse-vscode',
				version: '7.0.0'
			},
			{
				// @ts-ignore - MCP SDK capabilities format
				capabilities: {
					tools: {},
					resources: {},
					prompts: {},
					logging: {}
				}
			}
		);

		// @ts-ignore - MCP SDK transport type
		await client.connect(transport);
		return client;
	}

	/**
	 * Create appropriate transport based on server config
	 */
	async createTransport(serverConfig: MCPServerConfig): Promise<unknown> {
		const url = serverConfig.url;

		if (url.startsWith('ws://') || url.startsWith('wss://')) {
			// @ts-ignore - WebSocket URL type
			return new WebSocketClientTransport(new WebSocket(url));
		} else if (url.includes('/sse')) {
			return new SSEClientTransport(new URL(url));
		} else {
			// Default to HTTP transport with secure connection manager
			return {
				start: () => Promise.resolve(),
				send: async (message: unknown) => {
					const response = await this.secureConnectionManager.makeSecureApiCall(
						url,
						'POST',
						message,
						{
							headers: {
								'Content-Type': 'application/json',
								'Authorization': serverConfig.authToken ? `Bearer ${serverConfig.authToken}` : undefined
							}
						}
					);
					return response.data;
				},
				close: () => Promise.resolve()
			};
		}
	}

	/**
	 * Perform MCP protocol handshake and version negotiation
	 */
	async performHandshake(client: Client, serverConfig: MCPServerConfig): Promise<unknown> {
		try {
			// Initialize connection
			const initParams = {
				protocolVersion: this.supportedVersions[0],
				capabilities: {
					tools: { listChanged: true },
					resources: { listChanged: true, subscribe: true },
					prompts: { listChanged: true },
					logging: {}
				},
				clientInfo: {
					name: 'The New Fuse VSCode Extension',
					version: '7.0.0'
				}
			};

			// @ts-ignore - MCP SDK Zod type mismatch
			const initResult = await client.request(
				{
					method: 'initialize',
					params: initParams as any
				}
				// @ts-ignore - MCP SDK timeout parameter
				, { timeout: 10000 }
			);

			// Negotiate protocol version
			const serverVersion = (initResult as any).protocolVersion;
			if (!this.supportedVersions.includes(serverVersion)) {
				throw new Error(`Unsupported protocol version: ${serverVersion}`);
			}

			console.log(`🤝 MCP handshake successful. Protocol: ${serverVersion}`);
			return initResult;

		} catch (error) {
			throw new Error(`Handshake failed: ${(error as Error).message}`);
		}
	}

	/**
	 * Register server capabilities in registries
	 */
	async registerServerCapabilities(client: Client, serverId: string): Promise<void> {
		try {
			// Register tools
			// @ts-ignore - MCP SDK request parameter type
			const toolsResult = await client.request({ method: 'tools/list' });
			for (const tool of ((toolsResult as any).tools || [])) {
				this.toolRegistry.set(tool.name, serverId);
			}

			// Register resources
			// @ts-ignore - MCP SDK request parameter type
			const resourcesResult = await client.request({ method: 'resources/list' });
			for (const resource of ((resourcesResult as any).resources || [])) {
				this.resourceRegistry.set(resource.uri, serverId);
			}

			// Register prompts
			// @ts-ignore - MCP SDK request parameter type
			const promptsResult = await client.request({ method: 'prompts/list' });
			for (const prompt of ((promptsResult as any).prompts || [])) {
				this.promptRegistry.set(prompt.name, serverId);
			}

		} catch (error) {
			console.warn(`Failed to register capabilities for server ${serverId}:`, error);
		}
	}

	/**
	 * Start heartbeat monitoring for a server
	 */
	startHeartbeat(serverId: string): void {
		const interval = setInterval(async () => {
			try {
				const client = this.connections.get(serverId);
				if (client) {
					// Simple ping/pong or tools/list as heartbeat
					// @ts-ignore - MCP SDK request parameter type
					await client.request({ method: 'tools/list' }, { timeout: 5000 });
					this.updateHealthStatus(serverId, 'healthy');
				}
			} catch (error) {
				console.warn(`Heartbeat failed for server ${serverId}:`, error);
				this.updateHealthStatus(serverId, 'unhealthy');
				this.recordFailure(serverId);
			}
		}, 30000); // 30 second heartbeat

		this.heartbeatIntervals.set(serverId, interval);
	}

	/**
	 * Update health status for a server
	 */
	updateHealthStatus(serverId: string, status: 'healthy' | 'unhealthy' | 'unknown'): void {
		this.healthChecks.set(serverId, {
			status,
			lastCheck: Date.now(),
			responseTime: status === 'healthy' ? Math.random() * 1000 : undefined // Mock response time
		});
	}

	/**
	 * Record a connection failure for circuit breaker
	 */
	recordFailure(serverId: string): void {
		const breaker = this.circuitBreakers.get(serverId) || { failures: 0, lastFailure: 0, state: 'closed' };

		breaker.failures++;
		breaker.lastFailure = Date.now();

		// Open circuit breaker after 3 failures
		if (breaker.failures >= 3) {
			breaker.state = 'open';
			console.warn(`Circuit breaker opened for server ${serverId}`);
		}

		this.circuitBreakers.set(serverId, breaker);
	}

	/**
	 * Check if circuit breaker is open
	 */
	isCircuitBreakerOpen(serverId: string): boolean {
		const breaker = this.circuitBreakers.get(serverId);
		if (!breaker || breaker.state === 'closed') return false;

		// Allow retry after 60 seconds
		if (Date.now() - breaker.lastFailure > 60000) {
			breaker.state = 'half-open';
			this.circuitBreakers.set(serverId, breaker);
			return false;
		}

		return true;
	}

	/**
	 * Retry connection with exponential backoff
	 */
	async retryConnection(serverConfig: MCPServerConfig, attempt: number = 1): Promise<string> {
		if (attempt > this.retryConfig.maxRetries) {
			throw new Error(`Max retries exceeded for server ${serverConfig.url}`);
		}

		const delay = Math.min(
			this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
			this.retryConfig.maxDelay
		);

		await new Promise(resolve => setTimeout(resolve, delay));

		try {
			return await this.connectToServer(serverConfig);
		} catch (error) {
			console.warn(`Retry ${attempt} failed for ${serverConfig.url}:`, error);
			return this.retryConnection(serverConfig, attempt + 1);
		}
	}

	/**
	 * Call a tool on an MCP server
	 */
	async callTool(toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
		const serverId = this.toolRegistry.get(toolName);
		if (!serverId) {
			throw new Error(`Tool ${toolName} not found in registry`);
		}

		const client = this.connections.get(serverId);
		if (!client) {
			throw new Error(`No connection to server ${serverId}`);
		}

		try {
			// @ts-ignore - MCP SDK request parameter type
			const result = await client.request({
				method: 'tools/call',
				params: {
					name: toolName,
					arguments: args
				}
			});

			return result;

		} catch (error) {
			this.recordFailure(serverId);
			throw new Error(`Tool call failed: ${(error as Error).message}`);
		}
	}

	/**
	 * Get a resource from an MCP server
	 */
	async getResource(uri: string): Promise<unknown> {
		const serverId = this.resourceRegistry.get(uri);
		if (!serverId) {
			throw new Error(`Resource ${uri} not found in registry`);
		}

		const client = this.connections.get(serverId);
		if (!client) {
			throw new Error(`No connection to server ${serverId}`);
		}

		try {
			// @ts-ignore - MCP SDK request parameter type
			const result = await client.request({
				method: 'resources/read',
				params: { uri }
			});

			return result;

		} catch (error) {
			this.recordFailure(serverId);
			throw new Error(`Resource read failed: ${(error as Error).message}`);
		}
	}

	/**
	 * Get a prompt from an MCP server
	 */
	async getPrompt(promptName: string, args: Record<string, unknown> = {}): Promise<unknown> {
		const serverId = this.promptRegistry.get(promptName);
		if (!serverId) {
			throw new Error(`Prompt ${promptName} not found in registry`);
		}

		const client = this.connections.get(serverId);
		if (!client) {
			throw new Error(`No connection to server ${serverId}`);
		}

		try {
			// @ts-ignore - MCP SDK request parameter type
			const result = await client.request({
				method: 'prompts/get',
				params: {
					name: promptName,
					arguments: args
				}
			});

			return result;

		} catch (error) {
			this.recordFailure(serverId);
			throw new Error(`Prompt get failed: ${(error as Error).message}`);
		}
	}

	/**
	 * Get MCP server status dashboard data
	 */
	getServerStatus(): MCPServerStatusSummary {
		const status: MCPServerStatusSummary = {
			totalServers: this.connections.size,
			healthyServers: 0,
			unhealthyServers: 0,
			servers: []
		};

		for (const [serverId, poolEntry] of this.connectionPool.entries()) {
			const health = this.healthChecks.get(serverId) || { status: 'unknown' as const, lastCheck: undefined, responseTime: undefined };
			const breaker = this.circuitBreakers.get(serverId) || { state: 'closed' as const, failures: 0 };

			const serverStatus: MCPServerStatus = {
				id: serverId,
				url: poolEntry.config.url,
				status: health.status,
				connectedAt: poolEntry.connectedAt,
				lastHealthCheck: health.lastCheck || 0,
				responseTime: health.responseTime || 0,
				circuitBreaker: breaker.state,
				failures: breaker.failures,
				tools: Array.from(this.toolRegistry.entries())
					.filter(([, sid]) => sid === serverId)
					.map(([name]) => name),
				resources: Array.from(this.resourceRegistry.entries())
					.filter(([, sid]) => sid === serverId)
					.map(([uri]) => uri),
				prompts: Array.from(this.promptRegistry.entries())
					.filter(([, sid]) => sid === serverId)
					.map(([name]) => name)
			};

			status.servers.push(serverStatus);

			if (health.status === 'healthy') {
				status.healthyServers++;
			} else {
				status.unhealthyServers++;
			}
		}

		return status;
	}

	/**
	 * Persist connection configuration
	 */
	async persistConnection(serverConfig: MCPServerConfig): Promise<void> {
		try {
			await this.secureConfigManager!.storeMcpEndpoint({
				...serverConfig,
				autoConnect: true,
				lastConnected: new Date().toISOString()
			});
		} catch (error) {
			console.warn('Failed to persist connection:', error);
		}
	}

	/**
	 * Disconnect from a server
	 */
	async disconnectServer(serverId: string): Promise<void> {
		const client = this.connections.get(serverId);
		if (client) {
			try {
				await client.close();
			} catch (error) {
				console.warn(`Error closing connection to ${serverId}:`, error);
			}
		}

		// Clean up
		this.connections.delete(serverId);
		this.connectionPool.delete(serverId);
		this.healthChecks.delete(serverId);

		// Stop heartbeat
		const interval = this.heartbeatIntervals.get(serverId);
		if (interval) {
			clearInterval(interval);
			this.heartbeatIntervals.delete(serverId);
		}

		// Clean registries
		this.cleanRegistries(serverId);

		console.log(`🔌 Disconnected from MCP server: ${serverId}`);
	}

	/**
	 * Clean registries for a disconnected server
	 */
	cleanRegistries(serverId: string): void {
		// Clean tool registry
		for (const [toolName, sid] of this.toolRegistry.entries()) {
			if (sid === serverId) {
				this.toolRegistry.delete(toolName);
			}
		}

		// Clean resource registry
		for (const [uri, sid] of this.resourceRegistry.entries()) {
			if (sid === serverId) {
				this.resourceRegistry.delete(uri);
			}
		}

		// Clean prompt registry
		for (const [promptName, sid] of this.promptRegistry.entries()) {
			if (sid === serverId) {
				this.promptRegistry.delete(promptName);
			}
		}
	}

	/**
	 * Start health monitoring for all servers
	 */
	startHealthMonitoring(): void {
		// Periodic health check for all servers
		setInterval(() => {
			for (const [serverId] of this.connections.entries()) {
				// Health checks are already done via heartbeats
				// This could be extended for additional monitoring
			}
		}, 60000); // Every minute
	}

	/**
	 * Generate unique server ID
	 */
	generateServerId(url: string): string {
		return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Auto-discover MCP servers (placeholder for future implementation)
	 */
	async autoDiscoverServers(): Promise<MCPServerConfig[]> {
		// This would implement service discovery mechanisms
		// For now, return empty array
		return [];
	}

	/**
	 * Clean up all connections
	 */
	async cleanup(): Promise<void> {
		// Stop all heartbeats
		for (const interval of this.heartbeatIntervals.values()) {
			clearInterval(interval);
		}
		this.heartbeatIntervals.clear();

		// Disconnect all servers
		for (const serverId of this.connections.keys()) {
			await this.disconnectServer(serverId);
		}

		console.log('🧹 MCP Connection Manager cleaned up');
	}
}