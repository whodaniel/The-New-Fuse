import * as vscode from 'vscode';
import { ChatViewProvider } from './views/ChatViewProvider';
import { LLMProviderManager } from './llm/LLMProviderManager';
import { AgentCommunicationService } from './services/AgentCommunicationService';
import { LLMMonitoringService } from './services/LLMMonitoringService';
import { WebviewMessageRouter } from './services/WebviewMessageRouter';
import { TabbedContainerProvider } from './views/TabbedContainerProvider';
import { CommunicationHubProvider } from './views/CommunicationHubProvider';
import { DashboardProvider } from './views/DashboardProvider';
import { SettingsViewProvider } from './views/SettingsViewProvider';

// Enhanced Integration Services
import { EnhancedIntegrationService } from './services/EnhancedIntegrationService';
import { MultiAgentOrchestrationService } from './services/MultiAgentOrchestrationService';
import { SecurityObservabilityService } from './services/SecurityObservabilityService';
import { A2AProtocolClient, A2AAgent } from './protocols/A2AProtocol';
import { MCP2025Client } from './mcp/MCP2025Client';

// Enhanced Configuration
import { 
    getConfig, 
    validateConfig, 
    defaultEnhancedConfig,
    developmentConfig,
    productionConfig,
    testConfig 
} from './config/enhancedConfig';

// Global references for cleanup
let enhancedIntegrationService: EnhancedIntegrationService | null = null;
let orchestrationService: MultiAgentOrchestrationService | null = null;
let securityObservabilityService: SecurityObservabilityService | null = null;
let a2aProtocolClient: A2AProtocolClient | null = null;
let mcp2025Client: MCP2025Client | null = null;

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 The New Fuse extension is being activated');

    try {
        // Initialize VS Code LM API availability check
        console.log('🔍 Checking VS Code LM API availability...');
        checkVSCodeLmApiAvailability().then(available => {
            console.log(`📡 VS Code LM API available: ${available}`);
            if (!available) {
                vscode.window.showWarningMessage(
                    'VS Code Language Model API is not available. ' +
                    'Please ensure you have GitHub Copilot or another LM provider installed and enabled.'
                );
            }
        }).catch(error => {
            console.error('❌ Error checking VS Code LM API:', error);
        });

        // Load and validate enhanced configuration
        console.log('⚙️ Loading enhanced configuration...');
        const environment = process.env.NODE_ENV || 'development';
        const config = getConfig(environment as 'development' | 'production' | 'test');
        
        if (!validateConfig(config)) {
            throw new Error('Invalid configuration detected. Please check your configuration settings.');
        }
        console.log(`   ✅ Configuration loaded for ${environment} environment`);

        console.log('🔧 Initializing core services...');
        
        console.log('   - Initializing LLMProviderManager...');
        const llmProviderManager = new LLMProviderManager(context);
        console.log('   ✅ LLMProviderManager initialized');
        
        console.log('   - Initializing LLMMonitoringService...');
        const llmMonitoringService = new LLMMonitoringService(context);
        console.log('   ✅ LLMMonitoringService initialized');

        // Initialize enhanced services
        console.log('🚀 Initializing enhanced services...');
        
        console.log('   - Initializing SecurityObservabilityService...');
        securityObservabilityService = new SecurityObservabilityService(config.security, config.observability);
        console.log('   ✅ SecurityObservabilityService initialized');
        
        console.log('   - Initializing MCP2025Client...');
        mcp2025Client = new MCP2025Client(config.mcp2025);
        console.log('   ✅ MCP2025Client initialized');
        
        console.log('   - Creating local A2A agent configuration...');
        const localA2AAgent = {
            id: `vscode-extension-${context.extension.id || 'the-new-fuse'}`,
            name: 'VS Code The New Fuse Extension',
            version: context.extension.packageJSON.version || '1.0.0',
            capabilities: [
                {
                    name: 'text_generation',
                    version: '1.0',
                    description: 'Generate text using various LLM providers',
                    parameters: { maxTokens: 4000, temperature: 0.7 },
                    required: false
                },
                {
                    name: 'code_analysis',
                    version: '1.0',
                    description: 'Analyze and review code',
                    parameters: { languages: ['typescript', 'javascript', 'python'] },
                    required: false
                },
                {
                    name: 'agent_communication',
                    version: '1.0',
                    description: 'Communicate with other AI agents',
                    parameters: { protocols: ['mcp', 'a2a', 'file'] },
                    required: true
                }
            ],
            endpoints: {
                discovery: 'vscode://extension/discovery',
                communication: 'vscode://extension/communication',
                health: 'vscode://extension/health'
            },
            metadata: {
                environment: 'vscode-extension',
                platform: process.platform,
                nodeVersion: process.version
            },
            status: 'online' as const,
            lastSeen: Date.now()
        };
        console.log('   ✅ Local A2A agent configuration created');
         console.log('   - Initializing A2AProtocolClient...');
        a2aProtocolClient = new A2AProtocolClient(context, localA2AAgent);
        console.log('   ✅ A2AProtocolClient initialized');
        
        console.log('   - Initializing AgentCommunicationService...');
        const agentCommunicationService = new AgentCommunicationService(context, llmProviderManager);
        console.log('   ✅ AgentCommunicationService initialized');
        
        console.log('   - Initializing MultiAgentOrchestrationService...');
        orchestrationService = new MultiAgentOrchestrationService(
            agentCommunicationService,
            a2aProtocolClient
        );
        console.log('   ✅ MultiAgentOrchestrationService initialized');
        
        console.log('   - Initializing EnhancedIntegrationService...');
        enhancedIntegrationService = new EnhancedIntegrationService(
            config,
            agentCommunicationService
        );
        console.log('   ✅ EnhancedIntegrationService initialized');
        
        // Integrate enhanced services with EnhancedIntegrationService
        console.log('   - Connecting enhanced services to integration service...');
        (enhancedIntegrationService as any).mcpClients.set('primary', mcp2025Client);
        (enhancedIntegrationService as any).a2aClient = a2aProtocolClient;
        (enhancedIntegrationService as any).orchestrationService = orchestrationService;
        (enhancedIntegrationService as any).securityService = securityObservabilityService;
        console.log('   ✅ Enhanced services connected to integration service');
        
        // Integrate enhanced services with existing communication service
        console.log('   - Integrating enhanced services with communication service...');
        (agentCommunicationService as any).enhancedIntegrationService = enhancedIntegrationService;
        (agentCommunicationService as any).orchestrationService = orchestrationService;
        (agentCommunicationService as any).securityService = securityObservabilityService;
        (agentCommunicationService as any).a2aClient = a2aProtocolClient;
        (agentCommunicationService as any).mcp2025Client = mcp2025Client;
        console.log('   ✅ Enhanced services integrated with communication service');
        
        console.log('   - Initializing WebviewMessageRouter...');
        const messageRouter = new WebviewMessageRouter(context, llmProviderManager, agentCommunicationService);
        console.log('   ✅ WebviewMessageRouter initialized');

        // Start enhanced services
        console.log('🔄 Starting enhanced services...');
        
        // Initialize and start the enhanced integration service
        enhancedIntegrationService.initialize().then(() => {
            console.log('   ✅ EnhancedIntegrationService initialized');
            return enhancedIntegrationService.start();
        }).then(() => {
            console.log('   ✅ EnhancedIntegrationService started');
        }).catch((error) => {
            console.error('   ❌ Failed to start EnhancedIntegrationService:', error);
        });
        
        orchestrationService.start().then(() => {
            console.log('   ✅ MultiAgentOrchestrationService started');
        }).catch((error) => {
            console.error('   ❌ Failed to start MultiAgentOrchestrationService:', error);
        });

        console.log('🎨 Creating view providers...');
        
        console.log('   - Creating ChatViewProvider...');
        const chatProvider = new ChatViewProvider(
            context.extensionUri,
            context,
            llmProviderManager,
            agentCommunicationService,
            llmMonitoringService
        );
        console.log('   ✅ ChatViewProvider created');
        
        console.log('   - Creating CommunicationHubProvider...');
        const communicationHubProvider = new CommunicationHubProvider(context.extensionUri, agentCommunicationService);
        console.log('   ✅ CommunicationHubProvider created');
        
        console.log('   - Creating DashboardProvider...');
        const dashboardProvider = new DashboardProvider(context.extensionUri, llmMonitoringService);
        console.log('   ✅ DashboardProvider created');
        
        console.log('   - Creating SettingsViewProvider...');
        const settingsProvider = new SettingsViewProvider(context.extensionUri, context, llmProviderManager, messageRouter);
        console.log('   ✅ SettingsViewProvider created');

        console.log('   - Creating TabbedContainerProvider...');
        const tabbedContainerProvider = new TabbedContainerProvider(
            context.extensionUri,
            context,
            chatProvider,
            communicationHubProvider,
            dashboardProvider,
            settingsProvider,
            messageRouter
        );
        console.log('   ✅ TabbedContainerProvider created');

        console.log('🔗 Registering webview view provider...');
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(TabbedContainerProvider.viewType, tabbedContainerProvider, {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            })
        );
        console.log('   ✅ WebviewViewProvider registered successfully');

        // Register commands
        console.log('⚡ Registering commands...');
        context.subscriptions.push(
        // Existing chat commands
        vscode.commands.registerCommand('theFuse.startChat', () => tabbedContainerProvider.switchToTab('chat')),
        vscode.commands.registerCommand('theFuse.clearChat', () => chatProvider.clearChatHistory()),
        vscode.commands.registerCommand('theFuse.checkLLM', async () => {
            const diagnosticResult = await chatProvider.performDiagnostic();
            vscode.window.showInformationMessage(`Chat Diagnostic:\n${diagnosticResult}`);
        }),
        vscode.commands.registerCommand('theFuse.newChat', () => chatProvider.handleNewChat()),
        vscode.commands.registerCommand('theFuse.viewStarredMessages', () => chatProvider.viewStarredMessages()),
        vscode.commands.registerCommand('theFuse.exportChatHistory', async () => {
            const success = await chatProvider.exportChatHistory();
            if (success) {
                vscode.window.showInformationMessage('Chat history exported successfully!');
            } else {
                vscode.window.showErrorMessage('Failed to export chat history.');
            }
        }),
        vscode.commands.registerCommand('theFuse.importChatHistory', async () => {
            const success = await chatProvider.importChatHistory();
            if (success) {
                vscode.window.showInformationMessage('Chat history imported successfully!');
            } else {
                vscode.window.showErrorMessage('Failed to import chat history.');
            }
        }),
        
        // Existing agent communication commands
        vscode.commands.registerCommand('the-new-fuse.startAICollab', () => agentCommunicationService.startCollaboration()),
        vscode.commands.registerCommand('the-new-fuse.stopAICollab', () => agentCommunicationService.stopCollaboration()),
        vscode.commands.registerCommand('the-new-fuse.selectLLMProvider', () => llmProviderManager.showProviderQuickPick()),
        vscode.commands.registerCommand('the-new-fuse.checkLLMProviderHealth', async () => {
            const health = await llmProviderManager.checkProviderHealth();
            vscode.window.showInformationMessage(`LLM Provider Health: ${health.status === 'healthy' ? '✅' : '❌'} ${health.message}`);
        }),
        vscode.commands.registerCommand('the-new-fuse.resetLLMProviderHealth', () => {
            llmProviderManager.resetFailedProviders();
            vscode.window.showInformationMessage('LLM provider health has been reset.');
        }),
        vscode.commands.registerCommand('the-new-fuse.connectMCP', async () => {
            try {
                await agentCommunicationService.connect();
                vscode.window.showInformationMessage('Connected to MCP server.');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to connect to MCP: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.disconnectMCP', async () => {
            try {
                await agentCommunicationService.disconnect();
                vscode.window.showInformationMessage('Disconnected from MCP server.');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to disconnect from MCP: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.showChat', () => tabbedContainerProvider.focus()),
        vscode.commands.registerCommand('the-new-fuse.openSettings', () => tabbedContainerProvider.switchToTab('settings')),
        vscode.commands.registerCommand('the-new-fuse.notifyProviderSwitch', (previousProvider: string, newProvider: string) => {
            chatProvider.notifyProviderSwitch(previousProvider, newProvider);
        }),
        vscode.commands.registerCommand('the-new-fuse.selectLLMModel', () => llmProviderManager.showModelQuickPick()),

        // Enhanced A2A Protocol commands
        vscode.commands.registerCommand('the-new-fuse.discoverAgents', async () => {
            try {
                const agents = await a2aProtocolClient.discoverAgents();
                vscode.window.showInformationMessage(`Discovered ${agents.length} agents`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to discover agents: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.delegateTask', async () => {
            const taskInput = await vscode.window.showInputBox({
                prompt: 'Enter task description',
                placeHolder: 'Task to delegate...'
            });
            if (taskInput) {
                try {
                    const result = await orchestrationService.delegateTask({
                        id: `task-${Date.now()}`,
                        type: 'general',
                        description: taskInput,
                        requirements: { capabilities: ['general'] },
                        priority: 1,
                        metadata: {}
                    });
                    vscode.window.showInformationMessage(`Task delegated successfully: ${result.taskId}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to delegate task: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }),

        // Enhanced MCP 2025 commands
        vscode.commands.registerCommand('the-new-fuse.connectMCP2025', async () => {
            try {
                await mcp2025Client.connect();
                vscode.window.showInformationMessage('Connected to MCP 2025 server with enhanced features');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to connect to MCP 2025: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.batchMCPRequests', async () => {
            try {
                const results = await mcp2025Client.batchRequest([
                    { method: 'tools/list', params: {} },
                    { method: 'resources/list', params: {} }
                ]);
                vscode.window.showInformationMessage(`Batch request completed: ${results.length} responses`);
            } catch (error) {
                vscode.window.showErrorMessage(`Batch request failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),

        // Enhanced orchestration commands
        vscode.commands.registerCommand('the-new-fuse.createWorkflow', async () => {
            const workflowName = await vscode.window.showInputBox({
                prompt: 'Enter workflow name',
                placeHolder: 'My Workflow'
            });
            if (workflowName) {
                try {
                    const workflowId = await orchestrationService.createWorkflow({
                        name: workflowName,
                        description: 'User-created workflow',
                        tasks: [],
                        dependencies: new Map(),
                        coordinationStrategy: 'majority',
                        loadBalancingStrategy: 'round_robin'
                    });
                    vscode.window.showInformationMessage(`Workflow created: ${workflowId}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.viewOrchestrationStatus', async () => {
            try {
                const status = await orchestrationService.getOrchestrationStatus();
                vscode.window.showInformationMessage(
                    `Orchestration Status:\n` +
                    `Active Agents: ${status.activeAgents}\n` +
                    `Running Tasks: ${status.runningTasks}\n` +
                    `Completed Tasks: ${status.completedTasks}`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get orchestration status: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),

        // Security and observability commands
        vscode.commands.registerCommand('the-new-fuse.viewSecurityMetrics', async () => {
            try {
                const metrics = await securityObservabilityService.getSecurityMetrics();
                vscode.window.showInformationMessage(
                    `Security Metrics:\n` +
                    `Authentication Attempts: ${metrics.authenticationAttempts}\n` +
                    `Failed Attempts: ${metrics.failedAttempts}\n` +
                    `Active Sessions: ${metrics.activeSessions}`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get security metrics: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.viewPerformanceMetrics', async () => {
            try {
                const metrics = await securityObservabilityService.getPerformanceMetrics();
                vscode.window.showInformationMessage(
                    `Performance Metrics:\n` +
                    `Request Count: ${metrics.requestCount}\n` +
                    `Avg Response Time: ${metrics.avgResponseTime}ms\n` +
                    `Error Rate: ${metrics.errorRate}%`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get performance metrics: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),

        // Enhanced integration service commands
        vscode.commands.registerCommand('the-new-fuse.viewConnectionPool', async () => {
            try {
                const poolStatus = enhancedIntegrationService.getConnectionPoolStatus();
                vscode.window.showInformationMessage(
                    `Connection Pool Status:\n` +
                    `Active Connections: ${poolStatus.activeConnections}\n` +
                    `Available Connections: ${poolStatus.availableConnections}\n` +
                    `Total Connections: ${poolStatus.totalConnections}`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get connection pool status: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.clearCache', async () => {
            try {
                await enhancedIntegrationService.clearCache();
                vscode.window.showInformationMessage('Cache cleared successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),

        // FULLY FEATURED AI COLLABORATION WORKFLOW COMMAND
        vscode.commands.registerCommand('thefuse.ai.startCollaboration', async () => {
            try {
                // 1. Prompt user for workflow name and description
                const workflowName = await vscode.window.showInputBox({
                    prompt: 'Enter the name for the AI Collaboration Workflow',
                    placeHolder: 'AI Collaboration Workflow'
                });
                if (!workflowName) {
                    vscode.window.showWarningMessage('Workflow creation cancelled: Name is required.');
                    return;
                }
                const workflowDescription = await vscode.window.showInputBox({
                    prompt: 'Enter a description for the workflow',
                    placeHolder: 'Describe the purpose and goals of this collaboration workflow'
                });
                if (!workflowDescription) {
                    vscode.window.showWarningMessage('Workflow creation cancelled: Description is required.');
                    return;
                }

                // 2. Prompt user to select agents for collaboration
                const availableAgents = await a2aProtocolClient.discoverAgents();
                if (!availableAgents || availableAgents.length === 0) {
                    vscode.window.showErrorMessage('No available agents found for collaboration.');
                    return;
                }
                const agentQuickPickItems = availableAgents.map(agent => ({
                    label: agent.name,
                    description: agent.id,
                    detail: agent.capabilities?.map(c => c.name).join(', ') || '',
                    agent
                }));
                const selectedAgents = await vscode.window.showQuickPick(agentQuickPickItems, {
                    canPickMany: true,
                    placeHolder: 'Select agents to participate in the collaboration'
                });
                if (!selectedAgents || selectedAgents.length === 0) {
                    vscode.window.showWarningMessage('Workflow creation cancelled: At least one agent must be selected.');
                    return;
                }

                // 3. Prompt user to define tasks for the workflow
                const tasks: any[] = [];
                let addMoreTasks = true;
                while (addMoreTasks) {
                    const taskDescription = await vscode.window.showInputBox({
                        prompt: 'Enter a task description for this workflow (leave blank to finish)',
                        placeHolder: 'Describe the task for an agent'
                    });
                    if (!taskDescription) {
                        addMoreTasks = false;
                        break;
                    }
                    // Assign task to an agent
                    const agentPick = await vscode.window.showQuickPick(agentQuickPickItems, {
                        canPickMany: false,
                        placeHolder: 'Assign this task to an agent'
                    });
                    if (!agentPick) {
                        vscode.window.showWarningMessage('Task assignment cancelled: No agent selected.');
                        continue;
                    }
                    tasks.push({
                        id: `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                        description: taskDescription,
                        assignedAgent: agentPick.agent.id,
                        status: 'pending'
                    });
                    addMoreTasks = (await vscode.window.showQuickPick(
                        [{ label: 'Add another task' }, { label: 'Finish task entry' }],
                        { placeHolder: 'Would you like to add another task?' }
                    ))?.label === 'Add another task';
                }
                if (tasks.length === 0) {
                    vscode.window.showWarningMessage('Workflow creation cancelled: At least one task is required.');
                    return;
                }

                // 4. Create the workflow using the orchestration service
                const workflowId = await orchestrationService.createWorkflow(
                    workflowName,
                    workflowDescription,
                    tasks
                );

                // 5. Start the workflow
                await orchestrationService.startWorkflow(workflowId);

                // 6. Notify user and show workflow status
                vscode.window.showInformationMessage(
                    `AI Collaboration Workflow "${workflowName}" started with ${tasks.length} tasks and ${selectedAgents.length} agents.`
                );
                // Optionally, open the dashboard or workflow status view
                tabbedContainerProvider.switchToTab('dashboard');
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Failed to start AI Collaboration Workflow: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        })
    );
    console.log('   ✅ Commands registered successfully');

    console.log('🎉 The New Fuse extension activated successfully');
    
    } catch (error) {
        console.error('❌ CRITICAL ERROR during extension activation:', error);
        vscode.window.showErrorMessage(`The New Fuse extension failed to activate: ${error instanceof Error ? error.message : String(error)}`);
        throw error; // Re-throw to ensure VS Code knows the extension failed to activate
    }
}

/**
 * Check if the VS Code LM API is available
 */
async function checkVSCodeLmApiAvailability(): Promise<boolean> {
    try {
        const lmAvailable = vscode.lm !== undefined;
        console.log('VS Code LM API available:', lmAvailable);
        
        if (lmAvailable) {
            try {
                const models = await vscode.lm.selectChatModels({});
                console.log(`Found ${models?.length || 0} available language models`);
                return models && models.length > 0;
            } catch (err) {
                console.log('Error checking for language models:', err);
                return false;
            }
        }
        
        return false;
    } catch (err) {
        console.error('Error checking for VS Code LM API availability:', err);
        return false;
    }
}

export function deactivate() {
    console.log('🔄 The New Fuse extension is being deactivated');
    
    try {
        // Stop enhanced services gracefully
        console.log('🛑 Stopping enhanced services...');
        
        // Dispose of EnhancedIntegrationService
        if (enhancedIntegrationService) {
            console.log('   - Stopping EnhancedIntegrationService...');
            if (typeof enhancedIntegrationService.dispose === 'function') {
                enhancedIntegrationService.dispose();
            }
            enhancedIntegrationService = null;
        }
        
        // Dispose of MultiAgentOrchestrationService  
        if (orchestrationService) {
            console.log('   - Stopping MultiAgentOrchestrationService...');
            if (typeof orchestrationService.dispose === 'function') {
                orchestrationService.dispose();
            }
            orchestrationService = null;
        }
        
        // Dispose of SecurityObservabilityService
        if (securityObservabilityService) {
            console.log('   - Stopping SecurityObservabilityService...');
            if (typeof securityObservabilityService.dispose === 'function') {
                securityObservabilityService.dispose();
            }
            securityObservabilityService = null;
        }
        
        // Dispose of A2AProtocolClient
        if (a2aProtocolClient) {
            console.log('   - Disconnecting A2AProtocolClient...');
            if (typeof a2aProtocolClient.dispose === 'function') {
                a2aProtocolClient.dispose();
            }
            a2aProtocolClient = null;
        }
        
        // Dispose of MCP2025Client
        if (mcp2025Client) {
            console.log('   - Disconnecting MCP2025Client...');
            if (typeof mcp2025Client.disconnect === 'function') {
                mcp2025Client.disconnect();
            }
            mcp2025Client = null;
        }
        
        console.log('✅ The New Fuse extension deactivated successfully');
    } catch (error) {
        console.error('❌ Error during extension deactivation:', error);
    }
}
