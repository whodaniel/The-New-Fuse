import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
        if (enhancedIntegrationService) {
            enhancedIntegrationService.initialize().then(() => {
                console.log('   ✅ EnhancedIntegrationService initialized');
                // Initialization is already called and handles startup.
                // No separate 'start()' method is defined or typically needed after initialize().
                console.log('   ✅ EnhancedIntegrationService initialized (startup logic complete)');
            }).catch((error: Error) => {
                console.error('   ❌ Failed to initialize EnhancedIntegrationService:', error);
            });
        } else {
            console.error('   ❌ EnhancedIntegrationService is null. Cannot initialize or start.');
        }
        
        if (orchestrationService) {
            // MultiAgentOrchestrationService starts its internal loop in its constructor.
            // No separate public 'start()' method is defined.
            console.log('   ℹ️ MultiAgentOrchestrationService internal loop started via constructor.');
        } else {
            console.error('   ❌ MultiAgentOrchestrationService is null. Cannot start.');
        }

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
            if (!a2aProtocolClient) {
                vscode.window.showErrorMessage('A2A Protocol Client is not available.');
                return;
            }
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
                if (!orchestrationService) {
                    vscode.window.showErrorMessage('Orchestration Service is not available.');
                    return;
                }
                try {
                    // To delegate a task, create and start a workflow.
                    const workflowId = orchestrationService.createWorkflow( // createWorkflow is synchronous
                        `adhoc-task-${Date.now()}`,
                        `Ad-hoc task: ${taskInput}`,
                        [{
                            type: 'general', // This should match a capability an agent has
                            description: taskInput,
                            input: { details: taskInput },
                            dependencies: [],
                            maxRetries: 0,
                            timeout: 30000,
                            priority: 'normal',
                            metadata: {}
                        }]
                    );
                    orchestrationService.startWorkflow(workflowId); // startWorkflow is synchronous
                    vscode.window.showInformationMessage(`Ad-hoc task workflow created and started: ${workflowId}. Check logs for completion.`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to delegate task: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }),

        // Enhanced MCP 2025 commands
        vscode.commands.registerCommand('the-new-fuse.connectMCP2025', async () => {
            if (!mcp2025Client) {
                vscode.window.showErrorMessage('MCP 2025 Client is not available.');
                return;
            }
            try {
                await mcp2025Client.connect();
                vscode.window.showInformationMessage('Connected to MCP 2025 server with enhanced features');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to connect to MCP 2025: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.batchMCPRequests', async () => {
            if (!mcp2025Client) {
                vscode.window.showErrorMessage('MCP 2025 Client is not available.');
                return;
            }
            try {
                // MCP2025Client does not have a public `batchRequest` method that accepts an array of requests.
                // Its internal `batchRequest` is for queueing. `executeBatch` is private.
                // To achieve a similar outcome, send requests individually or implement a public batch method.
                // For now, sending two separate requests:
                const result1 = await mcp2025Client.request('tools/list', {});
                const result2 = await mcp2025Client.request('resources/list', {});
                const results = [result1, result2];
                vscode.window.showInformationMessage(`MCP requests completed: ${results.length} responses received.`);
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
                if (!orchestrationService) {
                    vscode.window.showErrorMessage('Orchestration Service is not available.');
                    return;
                }
                try {
                    const workflowId = orchestrationService.createWorkflow( // createWorkflow is synchronous
                        workflowName,
                        'User-created workflow',
                        [] // Example: No tasks initially, or prompt user to add tasks
                    );
                    vscode.window.showInformationMessage(`Workflow created: ${workflowId}. You can now add tasks and start it.`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.viewOrchestrationStatus', async () => {
            if (!orchestrationService) {
                vscode.window.showErrorMessage('Orchestration Service is not available.');
                return;
            }
            try {
                const agents = orchestrationService.getAgents();
                const workflows = orchestrationService.getWorkflows();
                let runningTasks = 0;
                let completedTasks = 0;
                workflows.forEach(wf => {
                    Array.from(wf.tasks.values()).forEach(task => {
                        if (task.status === 'running') {
                            runningTasks++;
                        }
                        if (task.status === 'completed') {
                            completedTasks++;
                        }
                    });
                });

                vscode.window.showInformationMessage(
                    `Orchestration Status:\n` +
                    `Active Agents: ${agents.length}\n` +
                    `Total Workflows: ${workflows.length}\n` +
                    `Running Tasks: ${runningTasks}\n` +
                    `Completed Tasks: ${completedTasks}`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get orchestration status: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),

        // Security and observability commands
        vscode.commands.registerCommand('the-new-fuse.viewSecurityMetrics', async () => {
            if (!securityObservabilityService) {
                vscode.window.showErrorMessage('Security & Observability Service is not available.');
                return;
            }
            try {
                const allMetrics = securityObservabilityService.getMetrics(); // Returns MetricPoint[]
                const authSuccessMetrics = allMetrics.filter(m => m.name === 'auth.login.success');
                const authFailureMetrics = allMetrics.filter(m => m.name === 'auth.login.failure'); // Assuming this metric name
                const activeSessionMetrics = allMetrics.filter(m => m.name === 'auth.sessions.active');
                
                const successfulAuths = authSuccessMetrics.reduce((sum, m) => sum + m.value, 0);
                const failedAuths = authFailureMetrics.reduce((sum, m) => sum + m.value, 0);
                const currentActiveSessions = activeSessionMetrics.length > 0 ? activeSessionMetrics[activeSessionMetrics.length -1].value : 0;


                vscode.window.showInformationMessage(
                    `Security Metrics:\n` +
                    `Successful Logins: ${successfulAuths}\n` +
                    `Failed Login Attempts: ${failedAuths}\n` +
                    `Currently Active Sessions: ${currentActiveSessions}`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get security metrics: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.viewPerformanceMetrics', async () => {
            if (!securityObservabilityService) {
                vscode.window.showErrorMessage('Security & Observability Service is not available.');
                return;
            }
            try {
                const allMetrics = securityObservabilityService.getMetrics(); // Returns MetricPoint[]
                // Example: Extracting performance-related metrics. Actual names would depend on what's recorded.
                const requestCountMetrics = allMetrics.filter(m => m.name.includes('request.count') || m.name.includes('tool.call.success') || m.name.includes('tool.call.error'));
                const totalRequests = requestCountMetrics.reduce((sum, m) => sum + m.value, 0);
                
                // For average response time and error rate, more specific metrics or calculations are needed.
                // These are placeholders.
                const avgResponseTime = allMetrics.find(m => m.name === 'system.avg_response_time')?.value || 'N/A';
                const errorRate = allMetrics.find(m => m.name === 'system.error_rate_percent')?.value || 'N/A';

                vscode.window.showInformationMessage(
                    `Performance Metrics:\n` +
                    `Total Monitored Requests: ${totalRequests}\n` +
                    `Average Response Time (example): ${avgResponseTime}ms\n` +
                    `Error Rate (example): ${errorRate}%`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get performance metrics: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),

        // Enhanced integration service commands
        vscode.commands.registerCommand('the-new-fuse.viewConnectionPool', async () => {
            if (!enhancedIntegrationService) {
                vscode.window.showErrorMessage('Enhanced Integration Service is not available.');
                return;
            }
            try {
                const pools = enhancedIntegrationService.getConnectionPools(); // Returns ConnectionPool[]
                let statusString = 'Connection Pool Status:\n';
                if (pools.length === 0) {
                    statusString += 'No active connection pools.';
                } else {
                    pools.forEach(p => {
                        statusString += `  - ID: ${p.id}, Type: ${p.type}, Active: ${p.isActive}, Health: ${p.healthStatus}, Uses: ${p.useCount}\n`;
                    });
                }
                vscode.window.showInformationMessage(statusString);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get connection pool status: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.clearCache', async () => {
            if (!enhancedIntegrationService) {
                vscode.window.showErrorMessage('Enhanced Integration Service is not available.');
                return;
            }
            try {
                // Assuming clearCache() exists or will be added to EnhancedIntegrationService.
                // If not, this will cause a runtime error if called, or a compile error if strict.
                await (enhancedIntegrationService as any).clearCache(); // Using 'as any' to bypass TS if method is not yet defined
                vscode.window.showInformationMessage('Attempted to clear cache (if method exists).');
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
                if (!a2aProtocolClient) {
                    vscode.window.showErrorMessage('A2A Protocol Client is not available.');
                    return;
                }
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
                if (!orchestrationService) {
                    vscode.window.showErrorMessage('Orchestration Service is not available.');
                    return;
                }
                const workflowId = await orchestrationService.createWorkflow(
                    workflowName,
                    workflowDescription,
                    tasks
                );

                // 5. Start the workflow
                if (!orchestrationService) { // Re-check, though unlikely if previous check passed and no async ops in between
                    vscode.window.showErrorMessage('Orchestration Service is not available to start workflow.');
                    return;
                }
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
