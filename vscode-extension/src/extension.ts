import * as vscode from 'vscode';
import { NewFuseApiClient } from './services/ApiClient';
import { ChatParticipantManager } from './services/ChatParticipantManager';
import { ConfigurationManager } from './services/ConfigurationManager';
import { LoggingService } from './services/LoggingService';
import { MetricsService } from './services/MetricsService';

/**
 * VS Code Extension Entry Point
 * 
 * This extension integrates with The New Fuse platform to provide
 * GitHub Copilot chat participants that can interact with various
 * AI agents and services.
 */

let apiClient: NewFuseApiClient;
let participantManager: ChatParticipantManager;
let configManager: ConfigurationManager;
let loggingService: LoggingService;
let metricsService: MetricsService;

export async function activate(context: vscode.ExtensionContext) {
	console.log('The New Fuse Copilot Extension is now active!');

	// Initialize services
	loggingService = new LoggingService();
	configManager = new ConfigurationManager();
	apiClient = new NewFuseApiClient(configManager, loggingService);
	metricsService = new MetricsService(apiClient, loggingService);
	participantManager = new ChatParticipantManager(apiClient, configManager, loggingService, metricsService);

	// Register commands
	registerCommands(context);

	// Initialize chat participants
	await initializeChatParticipants(context);

	// Set up configuration change listener
	setupConfigurationWatcher(context);

	// Start auto-refresh if enabled
	setupAutoRefresh(context);

	loggingService.info('The New Fuse Copilot Extension activated successfully');
}

export function deactivate() {
	loggingService?.info('The New Fuse Copilot Extension deactivated');
	participantManager?.dispose();
	metricsService?.dispose();
}

/**
 * Register VS Code commands
 */
function registerCommands(context: vscode.ExtensionContext) {
	// Refresh agents command
	const refreshCommand = vscode.commands.registerCommand('new-fuse.refreshAgents', async () => {
		try {
			await participantManager.refreshAgents();
			vscode.window.showInformationMessage('Agents refreshed successfully');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			vscode.window.showErrorMessage(`Failed to refresh agents: ${errorMessage}`);
			loggingService.error('Failed to refresh agents', error);
		}
	});

	// Configure tenant command
	const configureCommand = vscode.commands.registerCommand('new-fuse.configureTenant', async () => {
		try {
			await showConfigurationDialog();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			vscode.window.showErrorMessage(`Configuration error: ${errorMessage}`);
			loggingService.error('Configuration error', error);
		}
	});

	// View metrics command
	const metricsCommand = vscode.commands.registerCommand('new-fuse.viewMetrics', async () => {
		try {
			await metricsService.showMetricsPanel();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			vscode.window.showErrorMessage(`Failed to show metrics: ${errorMessage}`);
			loggingService.error('Failed to show metrics', error);
		}
	});

	context.subscriptions.push(refreshCommand, configureCommand, metricsCommand);
}

/**
 * Initialize chat participants from The New Fuse platform
 */
async function initializeChatParticipants(context: vscode.ExtensionContext) {
	try {
		// Validate configuration before initializing
		const isValid = await configManager.validateConfiguration();
		if (!isValid) {
			vscode.window.showWarningMessage(
				'The New Fuse configuration is incomplete. Please configure your tenant settings.',
				'Configure Now'
			).then(selection => {
				if (selection === 'Configure Now') {
					vscode.commands.executeCommand('new-fuse.configureTenant');
				}
			});
			return;
		}

		// Initialize participants
		await participantManager.initialize(context);
		
		loggingService.info('Chat participants initialized successfully');
	} catch (error) {
		loggingService.error('Failed to initialize chat participants', error);
		vscode.window.showErrorMessage(
			'Failed to initialize The New Fuse chat participants. Check your configuration and network connection.'
		);
	}
}

/**
 * Set up configuration change watcher
 */
function setupConfigurationWatcher(context: vscode.ExtensionContext) {
	const configWatcher = vscode.workspace.onDidChangeConfiguration(async (event) => {
		if (event.affectsConfiguration('newFuse')) {
			loggingService.info('Configuration changed, reinitializing...');
			
			try {
				// Reinitialize with new configuration
				await apiClient.updateConfiguration();
				await participantManager.refreshAgents();
				
				vscode.window.showInformationMessage('The New Fuse configuration updated successfully');
			} catch (error) {
				loggingService.error('Failed to update configuration', error);
				vscode.window.showErrorMessage('Failed to apply configuration changes');
			}
		}
	});

	context.subscriptions.push(configWatcher);
}

/**
 * Set up auto-refresh interval
 */
function setupAutoRefresh(context: vscode.ExtensionContext) {
	const interval = configManager.getAutoRefreshInterval();
	
	if (interval > 0) {
		const timer = setInterval(async () => {
			try {
				await participantManager.refreshAgents();
				loggingService.debug('Auto-refresh completed');
			} catch (error) {
				loggingService.error('Auto-refresh failed', error);
			}
		}, interval);

		// Clear timer when extension is deactivated
		context.subscriptions.push({
			dispose: () => clearInterval(timer)
		});
	}
}

/**
 * Show configuration dialog for tenant setup
 */
async function showConfigurationDialog() {
	const currentConfig = configManager.getConfiguration();

	// Server URL
	const serverUrl = await vscode.window.showInputBox({
		prompt: 'Enter The New Fuse server URL',
		value: currentConfig.serverUrl,
		validateInput: (value) => {
			if (!value) return 'Server URL is required';
			try {
				new URL(value);
				return null;
			} catch {
				return 'Please enter a valid URL';
			}
		}
	});

	if (!serverUrl) return;

	// Tenant ID
	const tenantId = await vscode.window.showInputBox({
		prompt: 'Enter your tenant ID',
		value: currentConfig.tenantId,
		validateInput: (value) => {
			if (!value) return 'Tenant ID is required';
			if (value.length < 3) return 'Tenant ID must be at least 3 characters';
			return null;
		}
	});

	if (!tenantId) return;

	// API Key
	const apiKey = await vscode.window.showInputBox({
		prompt: 'Enter your API key',
		value: currentConfig.apiKey,
		password: true,
		validateInput: (value) => {
			if (!value) return 'API key is required';
			if (value.length < 10) return 'API key seems too short';
			return null;
		}
	});

	if (!apiKey) return;

	// Update configuration
	const config = vscode.workspace.getConfiguration('newFuse');
	await config.update('serverUrl', serverUrl, vscode.ConfigurationTarget.Global);
	await config.update('tenantId', tenantId, vscode.ConfigurationTarget.Global);
	await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);

	vscode.window.showInformationMessage('Configuration saved successfully!');
}
