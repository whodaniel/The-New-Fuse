import * as vscode from 'vscode';
import * as path from 'path';

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
	command: string;
	args: string[];
	env?: Record<string, string>;
	description?: string;
	managed_by?: string;
	priority?: number;
	tags?: string[];
	capabilities?: string[];
}

/**
 * User-specific MCP Preferences
 */
export interface UserMCPPreferences {
	userId: string;
	enabledServers: string[];
	disabledServers: string[];
	defaultServer?: string;
	customServers: Record<string, MCPServerConfig>;
	serverOverrides: Record<string, Partial<MCPServerConfig>>;
	lastModified: string;
}

/**
 * Agent-specific MCP Configuration
 */
export interface AgentMCPConfig {
	agentId: string;
	agentName: string;
	enabledServers: string[];
	requiredCapabilities: string[];
	priorityServers: string[];
	customTools: string[];
	toolRestrictions?: {
		allowedTools?: string[];
		deniedTools?: string[];
	};
	lastModified: string;
}

/**
 * Workflow MCP Configuration
 */
export interface WorkflowMCPConfig {
	workflowId: string;
	workflowName: string;
	requiredServers: string[];
	optionalServers: string[];
	toolMappings: Record<string, string>; // tool name -> server id
	stepMCPConfig: Record<string, string[]>; // step id -> enabled servers
	lastModified: string;
}

/**
 * MCP Configuration Manager
 * Handles multi-tenant MCP configuration with user, agent, and workflow-specific settings
 */
export class MCPConfigurationManager {
	private context: vscode.ExtensionContext;
	private globalConfig: Record<string, MCPServerConfig> = {};
	private userPreferences: Map<string, UserMCPPreferences> = new Map();
	private agentConfigs: Map<string, AgentMCPConfig> = new Map();
	private workflowConfigs: Map<string, WorkflowMCPConfig> = new Map();
	private configPath: string;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		// Initialize with empty path, will be set asynchronously
		this.configPath = '';
	}

	/**
	 * Initialize configuration manager
	 */
	async initialize(): Promise<void> {
		console.log('🔧 Initializing MCP Configuration Manager...');

		// Find and set config path
		this.configPath = await this.findGlobalMCPConfig();

		// Load global MCP config
		await this.loadGlobalConfig();

		// Load user preferences
		await this.loadUserPreferences();

		// Load agent configs
		await this.loadAgentConfigs();

		// Load workflow configs
		await this.loadWorkflowConfigs();

		console.log('✅ MCP Configuration Manager initialized');
	}

	/**
	 * Find global MCP config file
	 */
	private async findGlobalMCPConfig(): Promise<string> {
		// Try multiple locations
		const possiblePaths = [
			'/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/mcp_config.json',
			path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', 'data', 'mcp_config.json'),
			path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', 'mcp_config.json'),
			path.join(this.context.globalStorageUri.fsPath, 'mcp_config.json')
		];

		for (const p of possiblePaths) {
			if (await this._safePathExists(p)) {
				console.log(`Found MCP config at: ${p}`);
				return p;
			}
		}

		console.warn('No global MCP config found, using defaults');
		return possiblePaths[0]; // Default location
	}

	/**
	 * Safely check if path exists using VSCode workspace API
	 */
	private async _safePathExists(filePath: string): Promise<boolean> {
		try {
			// Validate path to prevent directory traversal
			if (!this._isValidPath(filePath)) {
				console.warn(`Invalid path detected: ${filePath}`);
				return false;
			}

			const uri = vscode.Uri.file(filePath);
			try {
				await vscode.workspace.fs.stat(uri);
				return true;
			} catch {
				return false;
			}
		} catch (error) {
			console.error(`Error checking path existence: ${filePath}`, error);
			return false;
		}
	}

	/**
	 * Validate path to prevent directory traversal attacks
	 */
	private _isValidPath(filePath: string): boolean {
		try {
			// Normalize the path
			const normalized = path.normalize(filePath);
			
			// Check for directory traversal patterns
			if (normalized.includes('..') || normalized.includes('~')) {
				return false;
			}

			// Ensure it's within allowed directories
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			const globalStoragePath = this.context.globalStorageUri.fsPath;
			const allowedPaths = [
				'/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data',
				workspaceRoot,
				globalStoragePath
			].filter(Boolean);

			return allowedPaths.some(allowedPath =>
				normalized.startsWith(allowedPath!)
			);
		} catch (error) {
			console.error('Path validation error:', error);
			return false;
		}
	}

	/**
	 * Load global MCP configuration
	 */
	async loadGlobalConfig(): Promise<void> {
		try {
			if (await this._safePathExists(this.configPath)) {
				const uri = vscode.Uri.file(this.configPath);
				const content = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8');
				const config = JSON.parse(content);
				this.globalConfig = config.mcpServers || {};
				console.log(`Loaded ${Object.keys(this.globalConfig).length} MCP servers from global config`);
			}
		} catch (error) {
			console.error('Failed to load global MCP config:', error);
		}
	}

	/**
	 * Get all available MCP servers
	 */
	getAvailableServers(): Array<{id: string; config: MCPServerConfig}> {
		return Object.entries(this.globalConfig).map(([id, config]) => ({
			id,
			config
		}));
	}

	/**
	 * Get servers filtered by tags
	 */
	getServersByTags(tags: string[]): Array<{id: string; config: MCPServerConfig}> {
		return this.getAvailableServers().filter(({config}) =>
			config.tags?.some(tag => tags.includes(tag))
		);
	}

	/**
	 * Get servers filtered by capabilities
	 */
	getServersByCapabilities(capabilities: string[]): Array<{id: string; config: MCPServerConfig}> {
		return this.getAvailableServers().filter(({config}) =>
			config.capabilities?.some(cap =>
				capabilities.some(reqCap =>
					cap.toLowerCase().includes(reqCap.toLowerCase())
				)
			)
		);
	}

	/**
	 * Load user preferences
	 */
	async loadUserPreferences(): Promise<void> {
		const stored = this.context.globalState.get<Record<string, UserMCPPreferences>>('userMCPPreferences');
		if (stored) {
			this.userPreferences = new Map(Object.entries(stored));
			console.log(`Loaded preferences for ${this.userPreferences.size} users`);
		}
	}

	/**
	 * Save user preferences
	 */
	async saveUserPreferences(): Promise<void> {
		const obj = Object.fromEntries(this.userPreferences);
		await this.context.globalState.update('userMCPPreferences', obj);
	}

	/**
	 * Get user preferences
	 */
	getUserPreferences(userId: string): UserMCPPreferences {
		if (!this.userPreferences.has(userId)) {
			const defaultPrefs: UserMCPPreferences = {
				userId,
				enabledServers: Object.keys(this.globalConfig),
				disabledServers: [],
				customServers: {},
				serverOverrides: {},
				lastModified: new Date().toISOString()
			};
			this.userPreferences.set(userId, defaultPrefs);
		}
		return this.userPreferences.get(userId)!;
	}

	/**
	 * Update user preferences
	 */
	async updateUserPreferences(userId: string, prefs: Partial<UserMCPPreferences>): Promise<void> {
		const current = this.getUserPreferences(userId);
		const updated = { ...current, ...prefs, lastModified: new Date().toISOString() };
		this.userPreferences.set(userId, updated);
		await this.saveUserPreferences();
	}

	/**
	 * Get enabled servers for user
	 */
	getUserEnabledServers(userId: string): Array<{id: string; config: MCPServerConfig}> {
		const prefs = this.getUserPreferences(userId);
		return this.getAvailableServers().filter(({id}) =>
			prefs.enabledServers.includes(id) && !prefs.disabledServers.includes(id)
		);
	}

	/**
	 * Load agent configurations
	 */
	async loadAgentConfigs(): Promise<void> {
		const stored = this.context.globalState.get<Record<string, AgentMCPConfig>>('agentMCPConfigs');
		if (stored) {
			this.agentConfigs = new Map(Object.entries(stored));
			console.log(`Loaded MCP configs for ${this.agentConfigs.size} agents`);
		}
	}

	/**
	 * Save agent configurations
	 */
	async saveAgentConfigs(): Promise<void> {
		const obj = Object.fromEntries(this.agentConfigs);
		await this.context.globalState.update('agentMCPConfigs', obj);
	}

	/**
	 * Get agent configuration
	 */
	getAgentConfig(agentId: string): AgentMCPConfig | undefined {
		return this.agentConfigs.get(agentId);
	}

	/**
	 * Create/Update agent configuration
	 */
	async saveAgentConfig(config: AgentMCPConfig): Promise<void> {
		config.lastModified = new Date().toISOString();
		this.agentConfigs.set(config.agentId, config);
		await this.saveAgentConfigs();
	}

	/**
	 * Get servers configured for agent
	 */
	getAgentServers(agentId: string): Array<{id: string; config: MCPServerConfig}> {
		const agentConfig = this.getAgentConfig(agentId);
		if (!agentConfig) {
			return [];
		}

		return this.getAvailableServers().filter(({id}) =>
			agentConfig.enabledServers.includes(id)
		);
	}

	/**
	 * Load workflow configurations
	 */
	async loadWorkflowConfigs(): Promise<void> {
		const stored = this.context.globalState.get<Record<string, WorkflowMCPConfig>>('workflowMCPConfigs');
		if (stored) {
			this.workflowConfigs = new Map(Object.entries(stored));
			console.log(`Loaded MCP configs for ${this.workflowConfigs.size} workflows`);
		}
	}

	/**
	 * Save workflow configurations
	 */
	async saveWorkflowConfigs(): Promise<void> {
		const obj = Object.fromEntries(this.workflowConfigs);
		await this.context.globalState.update('workflowMCPConfigs', obj);
	}

	/**
	 * Get workflow configuration
	 */
	getWorkflowConfig(workflowId: string): WorkflowMCPConfig | undefined {
		return this.workflowConfigs.get(workflowId);
	}

	/**
	 * Create/Update workflow configuration
	 */
	async saveWorkflowConfig(config: WorkflowMCPConfig): Promise<void> {
		config.lastModified = new Date().toISOString();
		this.workflowConfigs.set(config.workflowId, config);
		await this.saveWorkflowConfigs();
	}

	/**
	 * Get servers for workflow step
	 */
	getWorkflowStepServers(workflowId: string, stepId: string): Array<{id: string; config: MCPServerConfig}> {
		const workflowConfig = this.getWorkflowConfig(workflowId);
		if (!workflowConfig || !workflowConfig.stepMCPConfig[stepId]) {
			return [];
		}

		const enabledServerIds = workflowConfig.stepMCPConfig[stepId];
		return this.getAvailableServers().filter(({id}) =>
			enabledServerIds.includes(id)
		);
	}

	/**
	 * Add custom server to user preferences
	 */
	async addCustomServer(userId: string, serverId: string, config: MCPServerConfig): Promise<void> {
		const prefs = this.getUserPreferences(userId);
		prefs.customServers[serverId] = config;
		prefs.enabledServers.push(serverId);
		await this.updateUserPreferences(userId, prefs);
	}

	/**
	 * Get all servers for user (global + custom)
	 */
	getAllUserServers(userId: string): Array<{id: string; config: MCPServerConfig; isCustom: boolean}> {
		const prefs = this.getUserPreferences(userId);
		const global = this.getAvailableServers().map(({id, config}) => ({
			id,
			config,
			isCustom: false
		}));

		const custom = Object.entries(prefs.customServers).map(([id, config]) => ({
			id,
			config,
			isCustom: true
		}));

		return [...global, ...custom];
	}

	/**
	 * Get server by ID (checks global + user custom)
	 */
	getServerConfig(serverId: string, userId?: string): MCPServerConfig | undefined {
		// Check global config first
		if (this.globalConfig[serverId]) {
			return this.globalConfig[serverId];
		}

		// Check user custom servers
		if (userId) {
			const prefs = this.getUserPreferences(userId);
			if (prefs.customServers[serverId]) {
				return prefs.customServers[serverId];
			}
		}

		return undefined;
	}

	/**
	 * Export configuration for debugging
	 */
	exportConfiguration(): any {
		return {
			globalServers: Object.keys(this.globalConfig).length,
			users: this.userPreferences.size,
			agents: this.agentConfigs.size,
			workflows: this.workflowConfigs.size,
			configPath: this.configPath
		};
	}
}
