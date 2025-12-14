import * as vscode from 'vscode';
import { MCPConfigurationManager, MCPServerConfig, AgentMCPConfig, WorkflowMCPConfig } from './MCPConfigurationManager';

/**
 * MCP UI Manager
 * Handles all user interactions for MCP configuration and management
 */
export class MCPUIManager {
	private configManager: MCPConfigurationManager;
	private currentUserId: string = 'default';

	constructor(configManager: MCPConfigurationManager) {
		this.configManager = configManager;
	}

	/**
	 * Show main MCP marketplace/tools menu
	 */
	async showMainMenu(): Promise<void> {
		const options = [
			{
				label: '$(server) Browse MCP Servers',
				description: 'View all available MCP servers',
				action: () => this.browseMCPServers()
			},
			{
				label: '$(plug) Connect to Server',
				description: 'Connect to an MCP server',
				action: () => this.connectToServer()
			},
			{
				label: '$(tools) View Available Tools',
				description: 'Browse tools from all servers',
				action: () => this.browseTools()
			},
			{
				label: '$(person) User Preferences',
				description: 'Manage your MCP preferences',
				action: () => this.manageUserPreferences()
			},
			{
				label: '$(robot) Agent Configuration',
				description: 'Configure MCP for agents',
				action: () => this.manageAgentConfigs()
			},
			{
				label: '$(symbol-namespace) Workflow Integration',
				description: 'Configure MCP for workflows',
				action: () => this.manageWorkflowConfigs()
			},
			{
				label: '$(add) Add Custom Server',
				description: 'Add a new MCP server',
				action: () => this.addCustomServer()
			}
		];

		const selection = await vscode.window.showQuickPick(options, {
			placeHolder: 'MCP Marketplace & Configuration',
			matchOnDescription: true
		});

		if (selection) {
			await selection.action();
		}
	}

	/**
	 * Browse all available MCP servers with rich information
	 */
	async browseMCPServers(): Promise<void> {
		const servers = this.configManager.getAvailableServers();

		if (servers.length === 0) {
			vscode.window.showInformationMessage('No MCP servers configured');
			return;
		}

		const items = servers.map(({id, config}) => ({
			label: `$(server) ${id}`,
			description: config.description || 'No description',
			detail: this.formatServerDetails(config),
			serverId: id,
			config
		}));

		const selection = await vscode.window.showQuickPick(items, {
			placeHolder: `Browse MCP Servers (${servers.length} available)`,
			matchOnDescription: true,
			matchOnDetail: true
		});

		if (selection) {
			await this.showServerActions(selection.serverId, selection.config);
		}
	}

	/**
	 * Format server details for display
	 */
	private formatServerDetails(config: MCPServerConfig): string {
		const parts: string[] = [];

		if (config.priority) {
			parts.push(`Priority: ${config.priority}`);
		}

		if (config.tags && config.tags.length > 0) {
			parts.push(`Tags: ${config.tags.join(', ')}`);
		}

		if (config.capabilities && config.capabilities.length > 0) {
			parts.push(`Capabilities: ${config.capabilities.length} features`);
		}

		if (config.managed_by) {
			parts.push(`Managed by: ${config.managed_by}`);
		}

		return parts.join(' | ');
	}

	/**
	 * Show actions for a specific server
	 */
	private async showServerActions(serverId: string, config: MCPServerConfig): Promise<void> {
		const actions = [
			{
				label: '$(info) View Details',
				description: 'Show full server configuration',
				action: () => this.showServerDetails(serverId, config)
			},
			{
				label: '$(list-unordered) View Capabilities',
				description: 'Show server capabilities',
				action: () => this.showServerCapabilities(serverId, config)
			},
			{
				label: '$(plug) Connect',
				description: 'Connect to this server',
				action: () => this.connectSpecificServer(serverId)
			},
			{
				label: '$(settings-gear) Configure',
				description: 'Configure server settings',
				action: () => this.configureServer(serverId)
			}
		];

		const selection = await vscode.window.showQuickPick(actions, {
			placeHolder: `Actions for ${serverId}`,
			matchOnDescription: true
		});

		if (selection) {
			await selection.action();
		}
	}

	/**
	 * Show detailed server information
	 */
	private async showServerDetails(serverId: string, config: MCPServerConfig): Promise<void> {
		const details = [
			`**Server ID**: ${serverId}`,
			`**Description**: ${config.description || 'N/A'}`,
			`**Command**: ${config.command}`,
			`**Arguments**: ${config.args.join(' ')}`,
			config.priority ? `**Priority**: ${config.priority}` : '',
			config.managed_by ? `**Managed By**: ${config.managed_by}` : '',
			config.tags ? `**Tags**: ${config.tags.join(', ')}` : '',
			config.env ? `**Environment Variables**: ${Object.keys(config.env).length}` : ''
		].filter(Boolean).join('\n\n');

		const document = await vscode.workspace.openTextDocument({
			content: details,
			language: 'markdown'
		});

		await vscode.window.showTextDocument(document);
	}

	/**
	 * Show server capabilities
	 */
	private async showServerCapabilities(serverId: string, config: MCPServerConfig): Promise<void> {
		if (!config.capabilities || config.capabilities.length === 0) {
			vscode.window.showInformationMessage(`${serverId} has no documented capabilities`);
			return;
		}

		const items = config.capabilities.map(cap => ({
			label: `$(check) ${cap}`,
			description: serverId
		}));

		await vscode.window.showQuickPick(items, {
			placeHolder: `${serverId} Capabilities (${config.capabilities.length})`
		});
	}

	/**
	 * Connect to a specific server
	 */
	private async connectSpecificServer(serverId: string): Promise<void> {
		// This will be integrated with MCPConnectionManager
		vscode.window.showInformationMessage(`Connecting to ${serverId}...`);
	}

	/**
	 * Configure server settings
	 */
	private async configureServer(serverId: string): Promise<void> {
		const options = [
			{
				label: '$(symbol-boolean) Enable/Disable',
				description: 'Toggle server for current user'
			},
			{
				label: '$(settings-gear) Override Settings',
				description: 'Override server configuration'
			},
			{
				label: '$(tag) Manage Tags',
				description: 'Add or remove tags'
			}
		];

		const selection = await vscode.window.showQuickPick(options, {
			placeHolder: `Configure ${serverId}`
		});

		if (selection) {
			vscode.window.showInformationMessage(`Configuration action: ${selection.label}`);
		}
	}

	/**
	 * Connect to a new MCP server
	 */
	private async connectToServer(): Promise<void> {
		// Show server selection from available servers
		const servers = this.configManager.getAllUserServers(this.currentUserId);
		const userPrefs = this.configManager.getUserPreferences(this.currentUserId);

		const items = servers.map(({id, config, isCustom}) => ({
			label: `$(${isCustom ? 'star' : 'server'}) ${id}`,
			description: config.description || '',
			detail: userPrefs.enabledServers.includes(id) ? '✓ Enabled' : '○ Disabled',
			serverId: id,
			picked: userPrefs.enabledServers.includes(id)
		}));

		const selection = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select server to connect',
			canPickMany: false
		});

		if (selection) {
			await this.connectSpecificServer(selection.serverId);
		}
	}

	/**
	 * Browse tools from all servers
	 */
	private async browseTools(): Promise<void> {
		const servers = this.configManager.getUserEnabledServers(this.currentUserId);

		// Group tools by server
		const toolsByServer = servers.map(({id, config}) => ({
			label: `$(server) ${id}`,
			description: `${config.capabilities?.length || 0} capabilities`,
			detail: config.description,
			serverId: id,
			config
		}));

		const selection = await vscode.window.showQuickPick(toolsByServer, {
			placeHolder: 'Browse tools by server',
			matchOnDescription: true
		});

		if (selection) {
			await this.showServerCapabilities(selection.serverId, selection.config);
		}
	}

	/**
	 * Manage user MCP preferences
	 */
	async manageUserPreferences(): Promise<void> {
		const options = [
			{
				label: '$(server-process) Enable/Disable Servers',
				description: 'Choose which servers to enable',
				action: () => this.toggleUserServers()
			},
			{
				label: '$(star) Set Default Server',
				description: 'Set your default MCP server',
				action: () => this.setDefaultServer()
			},
			{
				label: '$(list-ordered) View Enabled Servers',
				description: 'See your currently enabled servers',
				action: () => this.viewEnabledServers()
			},
			{
				label: '$(export) Export Preferences',
				description: 'Export your MCP preferences',
				action: () => this.exportUserPreferences()
			}
		];

		const selection = await vscode.window.showQuickPick(options, {
			placeHolder: 'Manage User MCP Preferences',
			matchOnDescription: true
		});

		if (selection) {
			await selection.action();
		}
	}

	/**
	 * Toggle servers for user
	 */
	private async toggleUserServers(): Promise<void> {
		const servers = this.configManager.getAllUserServers(this.currentUserId);
		const prefs = this.configManager.getUserPreferences(this.currentUserId);

		const items = servers.map(({id, config}) => ({
			label: id,
			description: config.description || '',
			picked: prefs.enabledServers.includes(id) && !prefs.disabledServers.includes(id)
		}));

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select servers to enable',
			canPickMany: true
		});

		if (selected) {
			const enabledIds = selected.map(s => s.label);
			const allIds = servers.map(s => s.id);
			const disabledIds = allIds.filter(id => !enabledIds.includes(id));

			await this.configManager.updateUserPreferences(this.currentUserId, {
				enabledServers: enabledIds,
				disabledServers: disabledIds
			});

			vscode.window.showInformationMessage(`✓ Updated server preferences: ${enabledIds.length} enabled`);
		}
	}

	/**
	 * Set default server
	 */
	private async setDefaultServer(): Promise<void> {
		const servers = this.configManager.getUserEnabledServers(this.currentUserId);

		const items = servers.map(({id, config}) => ({
			label: id,
			description: config.description || ''
		}));

		const selection = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select default MCP server'
		});

		if (selection) {
			await this.configManager.updateUserPreferences(this.currentUserId, {
				defaultServer: selection.label
			});
			vscode.window.showInformationMessage(`✓ Default server set to: ${selection.label}`);
		}
	}

	/**
	 * View enabled servers
	 */
	private async viewEnabledServers(): Promise<void> {
		const servers = this.configManager.getUserEnabledServers(this.currentUserId);

		if (servers.length === 0) {
			vscode.window.showInformationMessage('No servers currently enabled');
			return;
		}

		const items = servers.map(({id, config}) => ({
			label: `$(check) ${id}`,
			description: config.description || '',
			detail: `Priority: ${config.priority || 'N/A'} | Tags: ${config.tags?.join(', ') || 'None'}`
		}));

		await vscode.window.showQuickPick(items, {
			placeHolder: `Your Enabled Servers (${servers.length})`
		});
	}

	/**
	 * Export user preferences
	 */
	private async exportUserPreferences(): Promise<void> {
		const prefs = this.configManager.getUserPreferences(this.currentUserId);
		const json = JSON.stringify(prefs, null, 2);

		const uri = await vscode.window.showSaveDialog({
			filters: { 'JSON': ['json'] },
			defaultUri: vscode.Uri.file(`mcp-preferences-${Date.now()}.json`)
		});

		if (uri) {
			await vscode.workspace.fs.writeFile(uri, Buffer.from(json));
			vscode.window.showInformationMessage('✓ Preferences exported');
		}
	}

	/**
	 * Manage agent MCP configurations
	 */
	async manageAgentConfigs(): Promise<void> {
		const options = [
			{
				label: '$(add) Create Agent Config',
				description: 'Configure MCP for a new agent',
				action: () => this.createAgentConfig()
			},
			{
				label: '$(edit) Edit Agent Config',
				description: 'Modify existing agent configuration',
				action: () => this.editAgentConfig()
			},
			{
				label: '$(list-unordered) View Agent Configs',
				description: 'See all agent configurations',
				action: () => this.viewAgentConfigs()
			}
		];

		const selection = await vscode.window.showQuickPick(options, {
			placeHolder: 'Manage Agent MCP Configurations',
			matchOnDescription: true
		});

		if (selection) {
			await selection.action();
		}
	}

	/**
	 * Create new agent MCP configuration
	 */
	private async createAgentConfig(): Promise<void> {
		// Get agent name
		const agentName = await vscode.window.showInputBox({
			prompt: 'Enter agent name',
			placeHolder: 'My AI Agent'
		});

		if (!agentName) return;

		// Select servers
		const servers = this.configManager.getAvailableServers();
		const serverItems = servers.map(({id, config}) => ({
			label: id,
			description: config.description || '',
			picked: false
		}));

		const selectedServers = await vscode.window.showQuickPick(serverItems, {
			placeHolder: 'Select MCP servers for this agent',
			canPickMany: true
		});

		if (!selectedServers || selectedServers.length === 0) {
			vscode.window.showWarningMessage('No servers selected');
			return;
		}

		// Create config
		const agentConfig: AgentMCPConfig = {
			agentId: `agent-${Date.now()}`,
			agentName,
			enabledServers: selectedServers.map(s => s.label),
			requiredCapabilities: [],
			priorityServers: [],
			customTools: [],
			lastModified: new Date().toISOString()
		};

		await this.configManager.saveAgentConfig(agentConfig);
		vscode.window.showInformationMessage(`✓ Agent configuration created: ${agentName}`);
	}

	/**
	 * Edit agent configuration
	 */
	private async editAgentConfig(): Promise<void> {
		// Implementation for editing agent configs
		vscode.window.showInformationMessage('Agent config editing - Coming soon');
	}

	/**
	 * View all agent configurations
	 */
	private async viewAgentConfigs(): Promise<void> {
		vscode.window.showInformationMessage('Viewing agent configs - Coming soon');
	}

	/**
	 * Manage workflow MCP configurations
	 */
	async manageWorkflowConfigs(): Promise<void> {
		const options = [
			{
				label: '$(symbol-namespace) Create Workflow Config',
				description: 'Configure MCP for a new workflow',
				action: () => this.createWorkflowConfig()
			},
			{
				label: '$(edit) Edit Workflow Config',
				description: 'Modify existing workflow configuration',
				action: () => this.editWorkflowConfig()
			},
			{
				label: '$(list-tree) View Workflow Configs',
				description: 'See all workflow configurations',
				action: () => this.viewWorkflowConfigs()
			}
		];

		const selection = await vscode.window.showQuickPick(options, {
			placeHolder: 'Manage Workflow MCP Configurations',
			matchOnDescription: true
		});

		if (selection) {
			await selection.action();
		}
	}

	/**
	 * Create workflow configuration
	 */
	private async createWorkflowConfig(): Promise<void> {
		const workflowName = await vscode.window.showInputBox({
			prompt: 'Enter workflow name',
			placeHolder: 'My Workflow'
		});

		if (!workflowName) return;

		// Select required servers
		const servers = this.configManager.getAvailableServers();
		const serverItems = servers.map(({id, config}) => ({
			label: id,
			description: config.description || ''
		}));

		const requiredServers = await vscode.window.showQuickPick(serverItems, {
			placeHolder: 'Select required MCP servers',
			canPickMany: true
		});

		if (!requiredServers) return;

		const workflowConfig: WorkflowMCPConfig = {
			workflowId: `workflow-${Date.now()}`,
			workflowName,
			requiredServers: requiredServers.map(s => s.label),
			optionalServers: [],
			toolMappings: {},
			stepMCPConfig: {},
			lastModified: new Date().toISOString()
		};

		await this.configManager.saveWorkflowConfig(workflowConfig);
		vscode.window.showInformationMessage(`✓ Workflow configuration created: ${workflowName}`);
	}

	/**
	 * Edit workflow configuration
	 */
	private async editWorkflowConfig(): Promise<void> {
		vscode.window.showInformationMessage('Workflow config editing - Coming soon');
	}

	/**
	 * View workflow configurations
	 */
	private async viewWorkflowConfigs(): Promise<void> {
		vscode.window.showInformationMessage('Viewing workflow configs - Coming soon');
	}

	/**
	 * Add custom MCP server
	 */
	private async addCustomServer(): Promise<void> {
		const serverId = await vscode.window.showInputBox({
			prompt: 'Enter server ID',
			placeHolder: 'my-custom-server'
		});

		if (!serverId) return;

		const command = await vscode.window.showInputBox({
			prompt: 'Enter command',
			placeHolder: 'npx'
		});

		if (!command) return;

		const argsInput = await vscode.window.showInputBox({
			prompt: 'Enter arguments (space-separated)',
			placeHolder: 'my-mcp-server arg1 arg2'
		});

		const args = argsInput ? argsInput.split(' ') : [];

		const description = await vscode.window.showInputBox({
			prompt: 'Enter description (optional)',
			placeHolder: 'My custom MCP server'
		});

		const config: MCPServerConfig = {
			command,
			args,
			description: description || undefined
		};

		await this.configManager.addCustomServer(this.currentUserId, serverId, config);
		vscode.window.showInformationMessage(`✓ Custom server added: ${serverId}`);
	}

	/**
	 * Set current user ID
	 */
	setUserId(userId: string): void {
		this.currentUserId = userId;
	}
}
